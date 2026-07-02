from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Language
from users.permissions import IsPlatformAdmin

from .models import (
    VisaPolicy, VisaPolicyTranslation,
    Country, CountryVisaPolicy,
    InsuranceRequirement, InsuranceRequirementTranslation,
)
from .serializers import (
    VisaPolicySerializer, InsuranceRequirementSerializer,
    AdminVisaPolicyUpsertSerializer,
    AdminCountryVisaAssignSerializer,
    AdminInsuranceRequirementUpsertSerializer,
)


def _lang(code):
    return Language.objects.get(code=code)


# ---------- ВИЗОВЫЕ РЕЖИМЫ ----------

class AdminVisaPolicyListCreateView(APIView):
    """
    GET  /api/admin/help/visa-policies/
    POST /api/admin/help/visa-policies/
    """
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        qs = VisaPolicy.objects.prefetch_related('translations__language').all()
        return Response(VisaPolicySerializer(qs, many=True).data)

    @transaction.atomic
    def post(self, request):
        s = AdminVisaPolicyUpsertSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data

        if VisaPolicy.objects.filter(code=d['code']).exists():
            return Response(
                {'code': f'Режим с кодом "{d["code"]}" уже существует.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        vp = VisaPolicy.objects.create(
            code=d['code'],
            max_stay_days=d.get('max_stay_days'),
            rolling_period_days=d.get('rolling_period_days'),
            requires_evisa=d.get('requires_evisa', False),
            evisa_portal_url=d.get('evisa_portal_url') or None,
            is_eaeu=d.get('is_eaeu', False),
        )
        VisaPolicyTranslation.objects.create(
            visa_policy=vp, language=_lang('ru'),
            title=d['title_ru'], description=d.get('description_ru') or '',
        )
        VisaPolicyTranslation.objects.create(
            visa_policy=vp, language=_lang('en'),
            title=d['title_en'], description=d.get('description_en') or '',
        )
        return Response(VisaPolicySerializer(vp).data, status=status.HTTP_201_CREATED)


class AdminVisaPolicyDetailView(APIView):
    """PATCH/DELETE /api/admin/help/visa-policies/<id>/"""
    permission_classes = [IsPlatformAdmin]

    @transaction.atomic
    def patch(self, request, policy_id: int):
        vp = get_object_or_404(VisaPolicy, id=policy_id)

        for f in ('code', 'max_stay_days', 'rolling_period_days',
                  'requires_evisa', 'evisa_portal_url', 'is_eaeu'):
            if f in request.data:
                setattr(vp, f, request.data[f])
        vp.save()

        if 'title_ru' in request.data or 'description_ru' in request.data:
            VisaPolicyTranslation.objects.update_or_create(
                visa_policy=vp, language=_lang('ru'),
                defaults={
                    'title': request.data.get('title_ru', ''),
                    'description': request.data.get('description_ru', ''),
                },
            )
        if 'title_en' in request.data or 'description_en' in request.data:
            VisaPolicyTranslation.objects.update_or_create(
                visa_policy=vp, language=_lang('en'),
                defaults={
                    'title': request.data.get('title_en', ''),
                    'description': request.data.get('description_en', ''),
                },
            )

        return Response(VisaPolicySerializer(vp).data)

    def delete(self, request, policy_id: int):
        vp = get_object_or_404(VisaPolicy, id=policy_id)
        if vp.country_links.exists():
            return Response(
                {'detail': 'Нельзя удалить режим, привязанный к странам.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        vp.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------- ПРИВЯЗКА СТРАНЫ К РЕЖИМУ ----------

class AdminCountryVisaAssignView(APIView):
    """
    POST /api/admin/help/country-visa-policies/
    Назначить стране визовый режим с даты. Автоматически закрывает предыдущий
    (effective_to = вчера) для этой страны, если он был открыт.
    """
    permission_classes = [IsPlatformAdmin]

    @transaction.atomic
    def post(self, request):
        s = AdminCountryVisaAssignSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data

        try:
            country = Country.objects.get(id=d['country_id'])
        except Country.DoesNotExist:
            return Response(
                {'country_id': 'Страна не найдена.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            policy = VisaPolicy.objects.get(id=d['visa_policy_id'])
        except VisaPolicy.DoesNotExist:
            return Response(
                {'visa_policy_id': 'Визовый режим не найден.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Закрываем предыдущий открытый режим этой страны
        from datetime import timedelta
        prev = CountryVisaPolicy.objects.filter(
            country=country, effective_to__isnull=True,
        ).first()
        if prev:
            prev.effective_to = d['effective_from'] - timedelta(days=1)
            prev.save(update_fields=['effective_to'])

        # Создаём новую привязку
        cvp = CountryVisaPolicy.objects.create(
            country=country,
            visa_policy=policy,
            effective_from=d['effective_from'],
            effective_to=d.get('effective_to'),
        )

        return Response({
            'id': cvp.id,
            'country_id': country.id,
            'country_name_ru': country.name_ru,
            'visa_policy_id': policy.id,
            'visa_policy_code': policy.code,
            'effective_from': cvp.effective_from,
            'effective_to': cvp.effective_to,
        }, status=status.HTTP_201_CREATED)


# ---------- СТРАХОВАНИЕ ----------

class AdminInsuranceListCreateView(APIView):
    """GET/POST /api/admin/help/insurance/"""
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        qs = InsuranceRequirement.objects.prefetch_related(
            'translations__language'
        ).all()
        return Response(InsuranceRequirementSerializer(qs, many=True).data)

    @transaction.atomic
    def post(self, request):
        s = AdminInsuranceRequirementUpsertSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data

        if InsuranceRequirement.objects.filter(code=d['code']).exists():
            return Response(
                {'code': f'Требование с кодом "{d["code"]}" уже существует.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ir = InsuranceRequirement.objects.create(
            code=d['code'],
            applies_to=d['applies_to'],
            min_medical_coverage=d.get('min_medical_coverage'),
            medical_currency=d.get('medical_currency') or None,
            requires_evacuation=d.get('requires_evacuation', False),
            min_evacuation_coverage=d.get('min_evacuation_coverage'),
            evacuation_currency=d.get('evacuation_currency') or None,
            is_mandatory=d.get('is_mandatory', False),
        )
        InsuranceRequirementTranslation.objects.create(
            insurance_requirement=ir, language=_lang('ru'),
            title=d['title_ru'], description=d.get('description_ru') or '',
        )
        InsuranceRequirementTranslation.objects.create(
            insurance_requirement=ir, language=_lang('en'),
            title=d['title_en'], description=d.get('description_en') or '',
        )
        return Response(
            InsuranceRequirementSerializer(ir).data,
            status=status.HTTP_201_CREATED,
        )


class AdminInsuranceDetailView(APIView):
    """PATCH/DELETE /api/admin/help/insurance/<id>/"""
    permission_classes = [IsPlatformAdmin]

    @transaction.atomic
    def patch(self, request, insurance_id: int):
        ir = get_object_or_404(InsuranceRequirement, id=insurance_id)

        for f in ('code', 'applies_to', 'min_medical_coverage', 'medical_currency',
                  'requires_evacuation', 'min_evacuation_coverage',
                  'evacuation_currency', 'is_mandatory'):
            if f in request.data:
                setattr(ir, f, request.data[f])
        ir.save()

        if 'title_ru' in request.data or 'description_ru' in request.data:
            InsuranceRequirementTranslation.objects.update_or_create(
                insurance_requirement=ir, language=_lang('ru'),
                defaults={
                    'title': request.data.get('title_ru', ''),
                    'description': request.data.get('description_ru', ''),
                },
            )
        if 'title_en' in request.data or 'description_en' in request.data:
            InsuranceRequirementTranslation.objects.update_or_create(
                insurance_requirement=ir, language=_lang('en'),
                defaults={
                    'title': request.data.get('title_en', ''),
                    'description': request.data.get('description_en', ''),
                },
            )

        return Response(InsuranceRequirementSerializer(ir).data)

    def delete(self, request, insurance_id: int):
        ir = get_object_or_404(InsuranceRequirement, id=insurance_id)
        ir.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)