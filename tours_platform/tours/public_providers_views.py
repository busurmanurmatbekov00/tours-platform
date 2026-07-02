from django.shortcuts import get_object_or_404
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from providers.models import ProviderProfile
from .models import Tour
from .catalog_serializers import CatalogTourCardSerializer
from .public_providers_serializers import (
    PublicProviderCardSerializer, PublicProviderDetailSerializer,
)


class PublicPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


def _public_providers_qs():
    """Базовый QuerySet: только верифицированные, опубликованные, не заблокированные."""
    return ProviderProfile.objects.filter(
        is_published=True,
        verification_status__code='approved',
        user__is_blocked=False,
    ).select_related(
        'user__role', 'verification_status',
    ).prefetch_related(
        'translations__language',
    )


class PublicProvidersListView(APIView):
    """
    GET /api/catalog/providers/
      ?role=guide|tour_operator|travel_agent
      ?q=...           — поиск по display_name
      ?page=1&page_size=20
    """
    permission_classes = [AllowAny]

    def get(self, request):
        qs = _public_providers_qs()

        role = request.query_params.get('role')
        if role in ('guide', 'tour_operator', 'travel_agent'):
            qs = qs.filter(user__role__code=role)

        q = (request.query_params.get('q') or '').strip()
        if q:
            qs = qs.filter(display_name__icontains=q)

        qs = qs.order_by('display_name')

        paginator = PublicPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = PublicProviderCardSerializer(
            page, many=True, context={'request': request}
        )
        return paginator.get_paginated_response(serializer.data)


class PublicProviderDetailView(APIView):
    """GET /api/catalog/providers/<slug>/"""
    permission_classes = [AllowAny]

    def get(self, request, slug: str):
        qs = _public_providers_qs().prefetch_related(
            'certificates__certificate_type',
        )
        provider = get_object_or_404(qs, slug=slug)
        serializer = PublicProviderDetailSerializer(
            provider, context={'request': request}
        )
        return Response(serializer.data)


class PublicProviderToursView(APIView):
    """
    GET /api/catalog/providers/<slug>/tours/
      Возвращает все опубликованные туры этого исполнителя.
    """
    permission_classes = [AllowAny]

    def get(self, request, slug: str):
        # проверяем что исполнитель есть и публичный
        provider = get_object_or_404(_public_providers_qs(), slug=slug)

        tours_qs = Tour.objects.filter(
            provider_profile=provider,
            status='published',
        ).select_related(
            'tour_type', 'difficulty_level',
            'provider_profile__user', 'provider_profile__verification_status',
        ).prefetch_related(
            'translations__language',
            'tour_type__translations__language',
            'difficulty_level__translations__language',
            'photos',
        ).order_by('-published_at')

        paginator = PublicPagination()
        page = paginator.paginate_queryset(tours_qs, request)
        serializer = CatalogTourCardSerializer(
            page, many=True, context={'request': request}
        )
        return paginator.get_paginated_response(serializer.data)