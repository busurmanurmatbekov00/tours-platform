from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import serializers, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import IsPlatformAdmin
from moderation.models import ModerationAction

from .models import Tour


# ---------- Локальный сериализатор для списка ----------

class AdminTourListSerializer(serializers.ModelSerializer):
    """Краткий вид тура для админ-модерации."""
    title_ru = serializers.SerializerMethodField()
    title_en = serializers.SerializerMethodField()
    tour_type_code = serializers.CharField(source='tour_type.code', read_only=True)
    difficulty_code = serializers.CharField(source='difficulty_level.code', read_only=True)
    provider_display_name = serializers.CharField(
        source='provider_profile.display_name', read_only=True
    )
    provider_email = serializers.CharField(
        source='provider_profile.user.email', read_only=True
    )

    class Meta:
        model = Tour
        fields = (
            'id', 'slug', 'status', 'is_custom',
            'title_ru', 'title_en',
            'tour_type_code', 'difficulty_code',
            'price', 'currency_code', 'duration_days',
            'provider_profile', 'provider_display_name', 'provider_email',
            'published_at', 'created_at', 'updated_at',
        )

    def get_title_ru(self, obj):
        tr = next(
            (t for t in obj.translations.all() if t.language.code == 'ru'),
            None,
        )
        return tr.title if tr else obj.slug

    def get_title_en(self, obj):
        tr = next(
            (t for t in obj.translations.all() if t.language.code == 'en'),
            None,
        )
        return tr.title if tr else obj.slug


class AdminPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


# ---------- View'хи ----------

class AdminToursListView(APIView):
    """
    GET /api/providers/admin/tours/
      ?status=published|hidden|archived|draft|pending_review
      ?provider=<id>
      ?q=<поиск по slug/названию>
    """
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        qs = Tour.objects.select_related(
            'tour_type', 'difficulty_level',
            'provider_profile__user',
        ).prefetch_related(
            'translations__language',
        ).order_by('-updated_at')

        status_code = request.query_params.get('status')
        if status_code in ('draft', 'pending_review', 'published', 'hidden', 'archived'):
            qs = qs.filter(status=status_code)

        provider = request.query_params.get('provider')
        if provider:
            qs = qs.filter(provider_profile_id=provider)

        q = (request.query_params.get('q') or '').strip()
        if q:
            qs = qs.filter(slug__icontains=q) | qs.filter(
                translations__title__icontains=q
            )
            qs = qs.distinct()

        paginator = AdminPagination()
        page = paginator.paginate_queryset(qs, request)
        return paginator.get_paginated_response(
            AdminTourListSerializer(page, many=True).data
        )


class AdminTourHideView(APIView):
    """POST /api/providers/admin/tours/<id>/hide/  body: {"reason": "..."}"""
    permission_classes = [IsPlatformAdmin]

    @transaction.atomic
    def post(self, request, tour_id: int):
        tour = get_object_or_404(Tour.objects.select_related('provider_profile'), id=tour_id)

        if tour.status != 'published':
            return Response(
                {'detail': f'Нельзя скрыть тур в статусе "{tour.status}". Только опубликованные туры можно скрывать.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reason = (request.data.get('reason') or '').strip()
        if not reason:
            return Response(
                {'reason': 'Причина скрытия обязательна.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tour.status = 'hidden'
        tour.save(update_fields=['status', 'updated_at'])

        ModerationAction.objects.create(
            admin_user_id=request.user.id,
            action_type='hide_tour',
            target_tour=tour,
            target_provider_profile=tour.provider_profile,
            reason=reason,
        )

        return Response({
            'detail': 'Тур скрыт.',
            'tour_id': tour.id,
            'new_status': tour.status,
        })


class AdminTourUnhideView(APIView):
    """POST /api/providers/admin/tours/<id>/unhide/"""
    permission_classes = [IsPlatformAdmin]

    @transaction.atomic
    def post(self, request, tour_id: int):
        tour = get_object_or_404(Tour.objects.select_related('provider_profile'), id=tour_id)

        if tour.status != 'hidden':
            return Response(
                {'detail': f'Нельзя снять скрытие с тура в статусе "{tour.status}". Только скрытые туры.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tour.status = 'published'
        tour.save(update_fields=['status', 'updated_at'])

        ModerationAction.objects.create(
            admin_user_id=request.user.id,
            action_type='unhide_tour',
            target_tour=tour,
            target_provider_profile=tour.provider_profile,
            reason=(request.data.get('reason') or '').strip() or None,
        )

        return Response({
            'detail': 'Скрытие снято, тур снова опубликован.',
            'tour_id': tour.id,
            'new_status': tour.status,
        })


class AdminTourDeleteView(APIView):
    """
    POST /api/providers/admin/tours/<id>/delete/  body: {"reason": "..."}
    Мягкое удаление — status → 'archived'. Физически данные не удаляются
    (журнал модерации, если что, останется целым).
    """
    permission_classes = [IsPlatformAdmin]

    @transaction.atomic
    def post(self, request, tour_id: int):
        tour = get_object_or_404(Tour.objects.select_related('provider_profile'), id=tour_id)

        if tour.status == 'archived':
            return Response(
                {'detail': 'Тур уже архивирован.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        reason = (request.data.get('reason') or '').strip()
        if not reason:
            return Response(
                {'reason': 'Причина удаления обязательна.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tour.status = 'archived'
        tour.save(update_fields=['status', 'updated_at'])

        ModerationAction.objects.create(
            admin_user_id=request.user.id,
            action_type='delete_tour',
            target_tour=tour,
            target_provider_profile=tour.provider_profile,
            reason=reason,
        )

        return Response({
            'detail': 'Тур перемещён в архив.',
            'tour_id': tour.id,
            'new_status': tour.status,
        })