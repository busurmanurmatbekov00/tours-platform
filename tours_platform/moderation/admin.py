from django.contrib import admin
from .models import ModerationAction


@admin.register(ModerationAction)
class ModerationActionAdmin(admin.ModelAdmin):
    list_display = ('id', 'action_type', 'admin_user', 'target_tour', 'target_provider_profile', 'created_at')
    list_filter = ('action_type',)
    search_fields = ('reason',)
    readonly_fields = ('created_at',)