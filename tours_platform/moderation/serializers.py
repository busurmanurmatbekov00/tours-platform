from rest_framework import serializers
from .models import ModerationAction


class ModerationActionSerializer(serializers.ModelSerializer):
    admin_email = serializers.CharField(source='admin_user.email', read_only=True)
    target_provider_display_name = serializers.CharField(
        source='target_provider_profile.display_name', read_only=True
    )
    action_type_display = serializers.CharField(
        source='get_action_type_display', read_only=True
    )

    class Meta:
        model = ModerationAction
        fields = (
            'id', 'action_type', 'action_type_display',
            'admin_user', 'admin_email',
            'target_tour', 'target_provider_profile', 'target_provider_display_name',
            'reason', 'created_at',
        )