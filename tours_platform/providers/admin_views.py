from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView



from users.permissions import IsPlatformAdmin
from moderation.models import ModerationAction

from .models import (
    ProviderProfile, VerificationRequest, VerificationStatus,
)
from .serializers import (
    AdminVerificationRequestListSerializer,
    AdminVerificationRequestDetailSerializer, AdminProviderListSerializer
)


class AdminVerificationListView(APIView):
    """GET /api/admin/verification/?status=pending"""
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        qs = VerificationRequest.objects.select_related(
            'status', 'provider_profile__user'
        ).prefetch_related('documents').order_by('-submitted_at')

        status_code = request.query_params.get('status')
        if status_code:
            qs = qs.filter(status__code=status_code)

        return Response(
            AdminVerificationRequestListSerializer(qs, many=True).data
        )


class AdminVerificationDetailView(APIView):
    """GET /api/admin/verification/<id>/"""
    permission_classes = [IsPlatformAdmin]

    def get(self, request, request_id: int):
        req = get_object_or_404(
            VerificationRequest.objects.select_related(
                'status', 'provider_profile__user__role',
                'reviewed_by_admin',
            ).prefetch_related('documents__document_type'),
            id=request_id,
        )
        return Response(AdminVerificationRequestDetailSerializer(req).data)


class AdminVerificationApproveView(APIView):
    """POST /api/admin/verification/<id>/approve/"""
    permission_classes = [IsPlatformAdmin]

    @transaction.atomic
    def post(self, request, request_id: int):
        req = get_object_or_404(
            VerificationRequest.objects.select_related('status', 'provider_profile'),
            id=request_id,
        )
        if req.status.code != 'pending':
            return Response(
                {'detail': f'Нельзя одобрить заявку в статусе "{req.status.code}".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        approved = VerificationStatus.objects.get(code='approved')

        # обновляем заявку
        req.status = approved
        req.reviewed_at = timezone.now()
        req.reviewed_by_admin_id = request.user.id
        req.admin_comment = request.data.get('comment') or None
        req.save()

        # обновляем оперативный статус профиля + публикуем
        profile = req.provider_profile
        profile.verification_status = approved
        profile.is_published = True
        profile.save(update_fields=['verification_status', 'is_published'])

        # запись в журнал
        ModerationAction.objects.create(
            admin_user_id=request.user.id,
            action_type='approve_verification',
            target_provider_profile=profile,
            reason=req.admin_comment,
        )

        return Response(AdminVerificationRequestDetailSerializer(req).data)


class AdminVerificationRejectView(APIView):
    """POST /api/admin/verification/<id>/reject/  body: {"comment": "причина"}"""
    permission_classes = [IsPlatformAdmin]

    @transaction.atomic
    def post(self, request, request_id: int):
        req = get_object_or_404(
            VerificationRequest.objects.select_related('status', 'provider_profile'),
            id=request_id,
        )
        if req.status.code != 'pending':
            return Response(
                {'detail': f'Нельзя отклонить заявку в статусе "{req.status.code}".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        comment = request.data.get('comment')
        if not comment or not str(comment).strip():
            return Response(
                {'comment': 'Причина отклонения обязательна.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        rejected = VerificationStatus.objects.get(code='rejected')
        req.status = rejected
        req.reviewed_at = timezone.now()
        req.reviewed_by_admin_id = request.user.id
        req.admin_comment = comment.strip()
        req.save()

        profile = req.provider_profile
        profile.verification_status = rejected
        # is_published не трогаем — если профиль был опубликован раньше, остаётся
        profile.save(update_fields=['verification_status'])

        ModerationAction.objects.create(
            admin_user_id=request.user.id,
            action_type='reject_verification',
            target_provider_profile=profile,
            reason=req.admin_comment,
        )

        return Response(AdminVerificationRequestDetailSerializer(req).data)


class AdminBlockProviderView(APIView):
    """POST /api/admin/providers/<id>/block/  body: {"reason": "..."}"""
    permission_classes = [IsPlatformAdmin]

    @transaction.atomic
    def post(self, request, profile_id: int):
        profile = get_object_or_404(
            ProviderProfile.objects.select_related('user'),
            id=profile_id,
        )
        reason = (request.data.get('reason') or '').strip()
        if not reason:
            return Response(
                {'reason': 'Причина блокировки обязательна.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if profile.user.is_blocked:
            return Response(
                {'detail': 'Исполнитель уже заблокирован.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile.user.is_blocked = True
        profile.user.save(update_fields=['is_blocked'])

        profile.is_published = False
        profile.save(update_fields=['is_published'])

        ModerationAction.objects.create(
            admin_user_id=request.user.id,
            action_type='block_provider',
            target_provider_profile=profile,
            reason=reason,
        )

        return Response({'detail': 'Исполнитель заблокирован.'})


class AdminUnblockProviderView(APIView):
    """POST /api/admin/providers/<id>/unblock/"""
    permission_classes = [IsPlatformAdmin]

    @transaction.atomic
    def post(self, request, profile_id: int):
        profile = get_object_or_404(
            ProviderProfile.objects.select_related('user'),
            id=profile_id,
        )
        if not profile.user.is_blocked:
            return Response(
                {'detail': 'Исполнитель не заблокирован.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile.user.is_blocked = False
        profile.user.save(update_fields=['is_blocked'])

        # если был верифицирован — снова публикуем
        if profile.verification_status.code == 'approved':
            profile.is_published = True
            profile.save(update_fields=['is_published'])

        ModerationAction.objects.create(
            admin_user_id=request.user.id,
            action_type='unblock_provider',
            target_provider_profile=profile,
            reason=(request.data.get('reason') or '').strip() or None,
        )

        return Response({'detail': 'Исполнитель разблокирован.'})
    
class AdminProvidersListView(APIView):
    """GET список всех исполнителей для админа."""

    def get(self, request):
        qs = ProviderProfile.objects.select_related(
            'user__role', 'verification_status'
        ).order_by('display_name')

        role = request.query_params.get('role')
        if role:
            qs = qs.filter(user__role__code=role)

        is_blocked = request.query_params.get('is_blocked')
        if is_blocked in ('true', '1'):
            qs = qs.filter(user__is_blocked=True)
        elif is_blocked in ('false', '0'):
            qs = qs.filter(user__is_blocked=False)

        return Response(AdminProviderListSerializer(qs, many=True).data)