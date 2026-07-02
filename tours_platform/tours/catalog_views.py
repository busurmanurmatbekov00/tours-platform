from django.db.models import Q, Prefetch
from django.shortcuts import get_object_or_404
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Tour, TourType, DifficultyLevel, TourPhoto, TourRoutePoint, TourTranslation,
)
from .catalog_serializers import (
    CatalogTourCardSerializer, CatalogTourDetailSerializer,
    CatalogTourTypeSerializer, CatalogDifficultySerializer,
)


class CatalogPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


def _published_tours_qs():
    """Базовый QuerySet: только опубликованные туры от верифицированных исполнителей."""
    return Tour.objects.filter(
        status='published',
        provider_profile__is_published=True,
        provider_profile__verification_status__code='approved',
        provider_profile__user__is_blocked=False,
    ).select_related(
        'tour_type', 'difficulty_level',
        'provider_profile__user', 'provider_profile__verification_status',
    ).prefetch_related(
        'translations__language',
        'tour_type__translations__language',
        'difficulty_level__translations__language',
        'photos',
    )


class CatalogToursListView(APIView):
    """
    GET /api/catalog/tours/
      ?q=...              — поиск по названию/описанию
      ?tour_type=1        — фильтр по типу
      ?difficulty=2       — фильтр по сложности
      ?price_min=100
      ?price_max=500
      ?duration_min=1
      ?duration_max=14
      ?is_custom=true|false
      ?ordering=price|-price|duration_days|-duration_days|-published_at
      ?page=1&page_size=20
    """
    permission_classes = [AllowAny]

    def get(self, request):
        qs = _published_tours_qs()

        # === Фильтры ===
        p = request.query_params

        tour_type = p.get('tour_type')
        if tour_type:
            qs = qs.filter(tour_type_id=tour_type)

        difficulty = p.get('difficulty')
        if difficulty:
            qs = qs.filter(difficulty_level_id=difficulty)

        price_min = p.get('price_min')
        if price_min:
            qs = qs.filter(price__gte=price_min)

        price_max = p.get('price_max')
        if price_max:
            qs = qs.filter(price__lte=price_max)

        duration_min = p.get('duration_min')
        if duration_min:
            qs = qs.filter(duration_days__gte=duration_min)

        duration_max = p.get('duration_max')
        if duration_max:
            qs = qs.filter(duration_days__lte=duration_max)

        is_custom = p.get('is_custom')
        if is_custom in ('true', '1'):
            qs = qs.filter(is_custom=True)
        elif is_custom in ('false', '0'):
            qs = qs.filter(is_custom=False)

        # === Поиск по ключевому слову ===
        q = (p.get('q') or '').strip()
        if q:
            # ищем в переводах: title / summary / description
            tour_ids = TourTranslation.objects.filter(
                Q(title__icontains=q) |
                Q(summary__icontains=q) |
                Q(description__icontains=q)
            ).values_list('tour_id', flat=True).distinct()
            qs = qs.filter(id__in=tour_ids)

        # === Сортировка ===
        ordering = p.get('ordering', '-published_at')
        allowed = {'price', '-price', 'duration_days', '-duration_days',
                   'published_at', '-published_at', 'created_at', '-created_at'}
        if ordering in allowed:
            qs = qs.order_by(ordering)
        else:
            qs = qs.order_by('-published_at')

        # === Пагинация ===
        paginator = CatalogPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = CatalogTourCardSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)


class CatalogTourDetailView(APIView):
    """GET /api/catalog/tours/<slug>/"""
    permission_classes = [AllowAny]

    def get(self, request, slug: str):
        qs = _published_tours_qs().prefetch_related(
            'photos',
            'route_points__location__translations__language',
        )
        tour = get_object_or_404(qs, slug=slug)
        serializer = CatalogTourDetailSerializer(tour, context={'request': request})
        return Response(serializer.data)


class CatalogTourTypesView(APIView):
    """GET /api/catalog/tour-types/  — для фильтра каталога."""
    permission_classes = [AllowAny]

    def get(self, request):
        qs = TourType.objects.filter(is_active=True).prefetch_related(
            'translations__language'
        ).order_by('sort_order')
        return Response(CatalogTourTypeSerializer(qs, many=True).data)


class CatalogDifficultyLevelsView(APIView):
    """GET /api/catalog/difficulty-levels/  — для фильтра каталога."""
    permission_classes = [AllowAny]

    def get(self, request):
        qs = DifficultyLevel.objects.prefetch_related(
            'translations__language'
        ).order_by('sort_order')
        return Response(CatalogDifficultySerializer(qs, many=True).data)