from django.contrib import admin
from .models import (
    VerificationStatus, VerificationDocumentType, CertificateType,
    ProviderProfile, ProviderProfileTranslation,
    Certificate, VerificationRequest, VerificationDocument,
)


class ProviderProfileTranslationInline(admin.TabularInline):
    model = ProviderProfileTranslation
    extra = 1


class CertificateInline(admin.TabularInline):
    model = Certificate
    extra = 0


class VerificationDocumentInline(admin.TabularInline):
    model = VerificationDocument
    extra = 0


@admin.register(VerificationStatus)
class VerificationStatusAdmin(admin.ModelAdmin):
    list_display = ('code', 'name_ru', 'name_en')


@admin.register(VerificationDocumentType)
class VerificationDocumentTypeAdmin(admin.ModelAdmin):
    list_display = ('code', 'name_ru', 'name_en')


@admin.register(CertificateType)
class CertificateTypeAdmin(admin.ModelAdmin):
    list_display = ('code', 'name_ru', 'name_en')


@admin.register(ProviderProfile)
class ProviderProfileAdmin(admin.ModelAdmin):
    list_display = ('display_name', 'user', 'verification_status', 'is_published', 'created_at')
    list_filter = ('verification_status', 'is_published')
    search_fields = ('display_name', 'slug', 'user__email')
    inlines = [ProviderProfileTranslationInline, CertificateInline]


@admin.register(VerificationRequest)
class VerificationRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'provider_profile', 'status', 'submitted_at', 'reviewed_at', 'reviewed_by_admin')
    list_filter = ('status',)
    inlines = [VerificationDocumentInline]
    readonly_fields = ('submitted_at',)