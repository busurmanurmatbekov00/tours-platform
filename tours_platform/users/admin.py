from django.contrib import admin
from .models import Role, User, PasswordResetToken

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('code', 'name_ru', 'name_en', 'is_provider')

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'full_name', 'role', 'is_active', 'is_blocked', 'created_at')
    list_filter = ('role', 'is_active', 'is_blocked')
    search_fields = ('email', 'full_name', 'phone')
    readonly_fields = ('password_hash', 'created_at', 'updated_at', 'last_login_at')

@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'expires_at', 'used_at', 'created_at')
    readonly_fields = ('token_hash', 'created_at')