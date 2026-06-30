from rest_framework.response import Response
from rest_framework.views import APIView

from users.permissions import IsPlatformAdmin
from .models import ModerationAction
from .serializers import ModerationActionSerializer


class ModerationLogView(APIView):
    """GET /api/admin/moderation-log/?action_type=approve_verification"""
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        qs = ModerationAction.objects.select_related(
            'admin_user', 'target_tour', 'target_provider_profile',
        ).order_by('-created_at')

        action_type = request.query_params.get('action_type')
        if action_type:
            qs = qs.filter(action_type=action_type)

        profile_id = request.query_params.get('provider_profile')
        if profile_id:
            qs = qs.filter(target_provider_profile_id=profile_id)

        return Response(ModerationActionSerializer(qs, many=True).data)