from rest_framework import serializers
from django.utils import timezone

from .models import (
    ProviderProfile, ProviderProfileTranslation,
    VerificationRequest, VerificationDocument,
    VerificationStatus, VerificationDocumentType,
    Certificate, CertificateType,
)


class ProviderProfileTranslationSerializer(serializers.ModelSerializer):
    language_code = serializers.CharField(source='language.code', read_only=True)

    class Meta:
        model = ProviderProfileTranslation
        fields = ('id', 'language', 'language_code', 'headline', 'bio')


class ProviderProfileSerializer(serializers.ModelSerializer):
    translations = ProviderProfileTranslationSerializer(many=True, read_only=True)
    verification_status_code = serializers.CharField(
        source='verification_status.code', read_only=True
    )

    class Meta:
        model = ProviderProfile
        fields = (
            'id', 'slug', 'display_name', 'avatar_path',
            'contact_email', 'contact_phone', 'website_url', 'address',
            'verification_status_code', 'is_published',
            'translations', 'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'slug', 'verification_status_code',
            'is_published', 'created_at', 'updated_at',
        )


class VerificationDocumentSerializer(serializers.ModelSerializer):
    document_type_code = serializers.CharField(
        source='document_type.code', read_only=True
    )

    class Meta:
        model = VerificationDocument
        fields = (
            'id', 'document_type', 'document_type_code',
            'file_path', 'original_filename', 'mime_type', 'file_size',
            'uploaded_at',
        )
        read_only_fields = (
            'id', 'document_type_code', 'file_path',
            'original_filename', 'mime_type', 'file_size', 'uploaded_at',
        )

class AdminProviderListSerializer(serializers.ModelSerializer):
    role_code = serializers.CharField(source='user.role.code', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    is_blocked = serializers.BooleanField(source='user.is_blocked', read_only=True)
    verification_status_code = serializers.CharField(source='verification_status.code', read_only=True)

    class Meta:
        model = ProviderProfile
        fields = (
            'id', 'slug', 'display_name', 'role_code', 'email',
            'is_blocked', 'verification_status_code', 'is_published', 'created_at',
        )

class VerificationRequestSerializer(serializers.ModelSerializer):
    status_code = serializers.CharField(source='status.code', read_only=True)
    documents = VerificationDocumentSerializer(many=True, read_only=True)

    class Meta:
        model = VerificationRequest
        fields = (
            'id', 'status_code', 'submitted_at', 'reviewed_at',
            'admin_comment', 'documents',
        )
        read_only_fields = fields

class AdminVerificationDocumentSerializer(serializers.ModelSerializer):
    document_type_code = serializers.CharField(source='document_type.code', read_only=True)
    document_type_name = serializers.CharField(source='document_type.name_ru', read_only=True)

    class Meta:
        model = VerificationDocument
        fields = (
            'id', 'document_type', 'document_type_code', 'document_type_name',
            'file_path', 'original_filename', 'mime_type', 'file_size', 'uploaded_at',
        )


class AdminVerificationRequestListSerializer(serializers.ModelSerializer):
    """Краткий вид заявки для списка."""
    status_code = serializers.CharField(source='status.code', read_only=True)
    provider_display_name = serializers.CharField(
        source='provider_profile.display_name', read_only=True
    )
    provider_email = serializers.CharField(
        source='provider_profile.user.email', read_only=True
    )
    documents_count = serializers.IntegerField(source='documents.count', read_only=True)

    class Meta:
        model = VerificationRequest
        fields = (
            'id', 'status_code',
            'provider_profile', 'provider_display_name', 'provider_email',
            'submitted_at', 'reviewed_at', 'documents_count',
        )


class AdminVerificationRequestDetailSerializer(serializers.ModelSerializer):
    """Полный вид заявки с документами."""
    status_code = serializers.CharField(source='status.code', read_only=True)
    provider_display_name = serializers.CharField(
        source='provider_profile.display_name', read_only=True
    )
    provider_email = serializers.CharField(
        source='provider_profile.user.email', read_only=True
    )
    provider_role = serializers.CharField(
        source='provider_profile.user.role.code', read_only=True
    )
    documents = AdminVerificationDocumentSerializer(many=True, read_only=True)
    reviewed_by_admin_email = serializers.CharField(
        source='reviewed_by_admin.email', read_only=True
    )

    class Meta:
        model = VerificationRequest
        fields = (
            'id', 'status_code',
            'provider_profile', 'provider_display_name', 'provider_email', 'provider_role',
            'submitted_at', 'reviewed_at', 'reviewed_by_admin_email',
            'admin_comment', 'documents',
        )

class MyCertificateSerializer(serializers.ModelSerializer):
    certificate_type_name = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Certificate
        fields = (
            'id', 'certificate_type', 'certificate_type_name',
            'title', 'issuer', 'certificate_number',
            'issued_date', 'expiry_date', 'file_path', 'file_url', 'created_at',
        )
        read_only_fields = ('id', 'file_path', 'file_url', 'created_at')

    def get_certificate_type_name(self, obj):
        if not obj.certificate_type:
            return None
        return {'ru': obj.certificate_type.name_ru, 'en': obj.certificate_type.name_en}

    def get_file_url(self, obj):
        if not obj.file_path:
            return None
        request = self.context.get('request')
        path = f'/media/{obj.file_path}'
        return request.build_absolute_uri(path) if request else path