from rest_framework import serializers
from providers.models import ProviderProfile, Certificate
from .catalog_serializers import (
    CatalogTourCardSerializer, _get_translation, _build_media_url,
)


class PublicCertificateSerializer(serializers.ModelSerializer):
    """Сертификат исполнителя для публичного просмотра."""
    certificate_type_code = serializers.CharField(
        source='certificate_type.code', read_only=True, allow_null=True
    )
    certificate_type_name = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Certificate
        fields = (
            'id', 'title', 'issuer', 'certificate_number',
            'issued_date', 'expiry_date',
            'certificate_type_code', 'certificate_type_name',
            'file_url',
        )

    def get_certificate_type_name(self, obj):
        ct = obj.certificate_type
        if not ct:
            return None
        return {'ru': ct.name_ru, 'en': ct.name_en}

    def get_file_url(self, obj):
        return _build_media_url(obj.file_path, self.context.get('request'))


class PublicProviderCardSerializer(serializers.ModelSerializer):
    """Карточка исполнителя в списке — минимум данных."""
    headline = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    role = serializers.CharField(source='user.role.code', read_only=True)
    tours_count = serializers.SerializerMethodField()
    certificates_count = serializers.SerializerMethodField()
    is_verified = serializers.SerializerMethodField()

    class Meta:
        model = ProviderProfile
        fields = (
            'id', 'slug', 'display_name', 'role',
            'avatar_url', 'headline',
            'tours_count', 'certificates_count', 'is_verified',
        )

    def get_headline(self, obj):
        translations = list(obj.translations.all())
        return {
            'ru': _get_translation(translations, 'ru', 'headline'),
            'en': _get_translation(translations, 'en', 'headline'),
        }

    def get_avatar_url(self, obj):
        return _build_media_url(obj.avatar_path, self.context.get('request'))

    def get_tours_count(self, obj):
        # Количество опубликованных туров этого исполнителя
        return obj.tours.filter(status='published').count()

    def get_certificates_count(self, obj):
        return obj.certificates.count()

    def get_is_verified(self, obj):
        return obj.verification_status.code == 'approved'


class PublicProviderDetailSerializer(PublicProviderCardSerializer):
    """Полный публичный профиль: карточка + био + контакты + сертификаты."""
    bio = serializers.SerializerMethodField()
    contact_email = serializers.CharField(read_only=True)
    contact_phone = serializers.CharField(read_only=True)
    website_url = serializers.CharField(read_only=True)
    address = serializers.CharField(read_only=True)
    certificates = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True)

    class Meta(PublicProviderCardSerializer.Meta):
        fields = PublicProviderCardSerializer.Meta.fields + (
            'bio', 'contact_email', 'contact_phone', 'website_url', 'address',
            'certificates', 'created_at',
        )

    def get_bio(self, obj):
        translations = list(obj.translations.all())
        return {
            'ru': _get_translation(translations, 'ru', 'bio'),
            'en': _get_translation(translations, 'en', 'bio'),
        }

    def get_certificates(self, obj):
        qs = obj.certificates.select_related('certificate_type').all()
        return PublicCertificateSerializer(
            qs, many=True, context=self.context
        ).data