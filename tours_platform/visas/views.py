from django.utils import timezone
from django.db.models import Prefetch
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Country, VisaPolicy, CountryVisaPolicy, InsuranceRequirement,
)
from .serializers import (
    VisaPolicySerializer, CountryVisaInfoSerializer, InsuranceRequirementSerializer,
)


class VisaPoliciesListView(APIView):
    """
    GET /api/help/visa-policies/
    Все шаблоны визовых режимов с переводами (для страницы справки).
    """
    permission_classes = [AllowAny]

    def get(self, request):
        qs = VisaPolicy.objects.prefetch_related(
            'translations__language'
        ).all()
        return Response(VisaPolicySerializer(qs, many=True).data)


class CountriesVisaListView(APIView):
    """
    GET /api/help/countries/
      ?q=япон                 — поиск по названию
      ?policy=visa_free_30_60 — фильтр по коду режима
    Возвращает список стран с их текущим визовым режимом в КР.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        today = timezone.now().date()

        # prefetch только действующих привязок
        active_visa_policies = Prefetch(
            'visa_policies',
            queryset=CountryVisaPolicy.objects.select_related(
                'visa_policy'
            ).prefetch_related(
                'visa_policy__translations__language'
            ).filter(
                effective_from__lte=today,
            ),
        )

        qs = Country.objects.prefetch_related(active_visa_policies).order_by('name_ru')

        # Фильтр по поиску
        q = (request.query_params.get('q') or '').strip()
        if q:
            qs = qs.filter(name_ru__icontains=q) | qs.filter(name_en__icontains=q)

        # Фильтр по коду визового режима
        policy_code = request.query_params.get('policy')
        if policy_code:
            country_ids = CountryVisaPolicy.objects.filter(
                visa_policy__code=policy_code,
                effective_from__lte=today,
            ).values_list('country_id', flat=True).distinct()
            qs = qs.filter(id__in=country_ids)

        serializer = CountryVisaInfoSerializer(qs, many=True)
        return Response(serializer.data)


class CountryVisaDetailView(APIView):
    """
    GET /api/help/countries/<iso_alpha2>/
    Визовая информация по конкретной стране (по коду ISO alpha-2).
    """
    permission_classes = [AllowAny]

    def get(self, request, iso: str):
        today = timezone.now().date()

        active_visa_policies = Prefetch(
            'visa_policies',
            queryset=CountryVisaPolicy.objects.select_related(
                'visa_policy'
            ).prefetch_related(
                'visa_policy__translations__language'
            ).filter(
                effective_from__lte=today,
            ),
        )

        try:
            country = Country.objects.prefetch_related(
                active_visa_policies
            ).get(iso_alpha2=iso.upper())
        except Country.DoesNotExist:
            return Response(
                {'detail': 'Страна не найдена.'}, status=404
            )

        return Response(CountryVisaInfoSerializer(country).data)


class InsuranceRequirementsListView(APIView):
    """
    GET /api/help/insurance/
      ?applies_to=general|mountain|custom
    Список требований к страхованию с переводами.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        qs = InsuranceRequirement.objects.prefetch_related(
            'translations__language'
        ).all()

        applies_to = request.query_params.get('applies_to')
        if applies_to in ('general', 'mountain', 'custom'):
            qs = qs.filter(applies_to=applies_to)

        return Response(InsuranceRequirementSerializer(qs, many=True).data)