from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import HelpCategory, HelpArticle
from .serializers import (
    HelpCategorySerializer, HelpArticleCardSerializer, HelpArticleDetailSerializer,
)


class HelpCategoriesListView(APIView):
    """GET /api/help/categories/"""
    permission_classes = [AllowAny]

    def get(self, request):
        qs = HelpCategory.objects.prefetch_related(
            'translations__language', 'articles',
        ).order_by('sort_order')
        return Response(HelpCategorySerializer(qs, many=True).data)


class HelpArticlesListView(APIView):
    """
    GET /api/help/articles/
      ?category=visas   — фильтр по коду категории
      ?q=иссык          — поиск по названию/тексту
    """
    permission_classes = [AllowAny]

    def get(self, request):
        qs = HelpArticle.objects.filter(is_published=True).select_related(
            'help_category',
        ).prefetch_related(
            'translations__language',
        ).order_by('sort_order', '-updated_at')

        category = request.query_params.get('category')
        if category:
            qs = qs.filter(help_category__code=category)

        q = (request.query_params.get('q') or '').strip()
        if q:
            article_ids = HelpArticle.objects.filter(
                translations__title__icontains=q,
            ).values_list('id', flat=True).distinct()
            qs = qs.filter(id__in=article_ids)

        return Response(HelpArticleCardSerializer(qs, many=True).data)


class HelpArticleDetailView(APIView):
    """GET /api/help/articles/<slug>/"""
    permission_classes = [AllowAny]

    def get(self, request, slug: str):
        qs = HelpArticle.objects.filter(is_published=True).select_related(
            'help_category',
        ).prefetch_related(
            'translations__language',
        )
        article = get_object_or_404(qs, slug=slug)
        return Response(HelpArticleDetailSerializer(article).data)