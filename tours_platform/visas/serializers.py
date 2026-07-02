from rest_framework import serializers
from .models import (
    Country, VisaPolicy, VisaPolicyTranslation, CountryVisaPolicy,
    InsuranceRequirement, InsuranceRequirementTranslation,
)


def _get_translation(translations, lang, field, default=None):
    """Ищет перевод на нужном языке, fallback на любой доступный."""
    tr = next((t for t in translations if t.language.code == lang), None)
    if tr is None and translations:
        tr = translations[0]
    return getattr(tr, field, default) if tr else default


class VisaPolicySerializer(serializers.ModelSerializer):
    """Визовый режим с переводами RU/EN."""
    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()

    class Meta:
        model = VisaPolicy
        fields = (
            'id', 'code',
            'max_stay_days', 'rolling_period_days',
            'requires_evisa', 'evisa_portal_url', 'is_eaeu',
            'title', 'description',
        )

    def get_title(self, obj):
        translations = list(obj.translations.all())
        return {
            'ru': _get_translation(translations, 'ru', 'title'),
            'en': _get_translation(translations, 'en', 'title'),
        }

    def get_description(self, obj):
        translations = list(obj.translations.all())
        return {
            'ru': _get_translation(translations, 'ru', 'description'),
            'en': _get_translation(translations, 'en', 'description'),
        }


class CountryVisaInfoSerializer(serializers.ModelSerializer):
    """Страна + её текущий визовый режим в КР."""
    country_name = serializers.SerializerMethodField()
    visa_policy = serializers.SerializerMethodField()

    class Meta:
        model = Country
        fields = ('id', 'iso_alpha2', 'iso_alpha3', 'country_name', 'visa_policy')

    def get_country_name(self, obj):
        return {'ru': obj.name_ru, 'en': obj.name_en}

    def get_visa_policy(self, obj):
        """Возвращает текущий (действующий сегодня) визовый режим."""
        from django.utils import timezone
        today = timezone.now().date()

        # ищем действующий на сегодня режим
        current = None
        for cvp in obj.visa_policies.all():
            if cvp.effective_from <= today and (
                cvp.effective_to is None or cvp.effective_to >= today
            ):
                current = cvp
                break

        if not current:
            return None

        return VisaPolicySerializer(
            current.visa_policy, context=self.context
        ).data


class InsuranceRequirementSerializer(serializers.ModelSerializer):
    """Требование к страхованию с переводами."""
    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()

    class Meta:
        model = InsuranceRequirement
        fields = (
            'id', 'code', 'applies_to',
            'min_medical_coverage', 'medical_currency',
            'requires_evacuation',
            'min_evacuation_coverage', 'evacuation_currency',
            'is_mandatory',
            'title', 'description',
        )

    def get_title(self, obj):
        translations = list(obj.translations.all())
        return {
            'ru': _get_translation(translations, 'ru', 'title'),
            'en': _get_translation(translations, 'en', 'title'),
        }

    def get_description(self, obj):
        translations = list(obj.translations.all())
        return {
            'ru': _get_translation(translations, 'ru', 'description'),
            'en': _get_translation(translations, 'en', 'description'),
        }
    

class AdminVisaPolicyUpsertSerializer(serializers.Serializer):
    """Создание/обновление визового режима с переводами."""
    code = serializers.CharField(max_length=40)
    max_stay_days = serializers.IntegerField(required=False, allow_null=True, min_value=0)
    rolling_period_days = serializers.IntegerField(required=False, allow_null=True, min_value=0)
    requires_evisa = serializers.BooleanField(default=False)
    evisa_portal_url = serializers.CharField(max_length=255, required=False, allow_blank=True, allow_null=True)
    is_eaeu = serializers.BooleanField(default=False)
    title_ru = serializers.CharField(max_length=150)
    title_en = serializers.CharField(max_length=150)
    description_ru = serializers.CharField(allow_blank=True, required=False)
    description_en = serializers.CharField(allow_blank=True, required=False)


class AdminCountryVisaAssignSerializer(serializers.Serializer):
    """Привязка визового режима к стране с датой действия."""
    country_id = serializers.IntegerField()
    visa_policy_id = serializers.IntegerField()
    effective_from = serializers.DateField()
    effective_to = serializers.DateField(required=False, allow_null=True)


class AdminInsuranceRequirementUpsertSerializer(serializers.Serializer):
    """Создание/обновление требования к страхованию с переводами."""
    code = serializers.CharField(max_length=40)
    applies_to = serializers.ChoiceField(choices=['general', 'mountain', 'custom'])
    min_medical_coverage = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False, allow_null=True
    )
    medical_currency = serializers.CharField(max_length=3, required=False, allow_blank=True, allow_null=True)
    requires_evacuation = serializers.BooleanField(default=False)
    min_evacuation_coverage = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False, allow_null=True
    )
    evacuation_currency = serializers.CharField(max_length=3, required=False, allow_blank=True, allow_null=True)
    is_mandatory = serializers.BooleanField(default=False)
    title_ru = serializers.CharField(max_length=150)
    title_en = serializers.CharField(max_length=150)
    description_ru = serializers.CharField(allow_blank=True, required=False)
    description_en = serializers.CharField(allow_blank=True, required=False)