from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Language
from users.permissions import IsPlatformAdmin

from .models import (
    HelpCategory, HelpCategoryTranslation,
    HelpArticle, HelpArticleTranslation,
)
from .serializers import (
    HelpCategorySerializer, HelpArticleDetailSerializer,
    AdminHelpCategoryUpsertSerializer, AdminHelpArticleUpsertSerializer,
)


def _lang(code):
    return Language.objects.get(code=code)


# ---------- КАТЕГОРИИ ----------

class AdminHelpCategoryListCreateView(APIView):
    """
    GET  /api/admin/help/categories/           — список всех категорий
    POST /api/admin/help/categories/           — создать новую
      body: {code, sort_order, name_ru, name_en}
    """
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        qs = HelpCategory.objects.prefetch_related(
            'translations__language', 'articles',
        ).order_by('sort_order')
        return Response(HelpCategorySerializer(qs, many=True).data)

    @transaction.atomic
    def post(self, request):
        s = AdminHelpCategoryUpsertSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data

        if HelpCategory.objects.filter(code=d['code']).exists():
            return Response(
                {'code': f'Категория с кодом "{d["code"]}" уже существует.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        cat = HelpCategory.objects.create(code=d['code'], sort_order=d['sort_order'])
        HelpCategoryTranslation.objects.create(
            help_category=cat, language=_lang('ru'), name=d['name_ru'],
        )
        HelpCategoryTranslation.objects.create(
            help_category=cat, language=_lang('en'), name=d['name_en'],
        )
        return Response(HelpCategorySerializer(cat).data, status=status.HTTP_201_CREATED)


class AdminHelpCategoryDetailView(APIView):
    """
    PATCH  /api/admin/help/categories/<id>/    — обновить
    DELETE /api/admin/help/categories/<id>/    — удалить (только пустую)
    """
    permission_classes = [IsPlatformAdmin]

    @transaction.atomic
    def patch(self, request, category_id: int):
        cat = get_object_or_404(HelpCategory, id=category_id)

        # Обновляем поля если переданы
        if 'code' in request.data:
            cat.code = request.data['code']
        if 'sort_order' in request.data:
            cat.sort_order = int(request.data['sort_order'])
        cat.save()

        # Обновляем переводы
        if 'name_ru' in request.data:
            HelpCategoryTranslation.objects.update_or_create(
                help_category=cat, language=_lang('ru'),
                defaults={'name': request.data['name_ru']},
            )
        if 'name_en' in request.data:
            HelpCategoryTranslation.objects.update_or_create(
                help_category=cat, language=_lang('en'),
                defaults={'name': request.data['name_en']},
            )

        return Response(HelpCategorySerializer(cat).data)

    def delete(self, request, category_id: int):
        cat = get_object_or_404(HelpCategory, id=category_id)
        if cat.articles.exists():
            return Response(
                {'detail': 'Нельзя удалить категорию, в которой есть статьи.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        cat.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------- СТАТЬИ ----------

class AdminHelpArticleListCreateView(APIView):
    """
    GET  /api/admin/help/articles/?category=<code>
    POST /api/admin/help/articles/
      body: {help_category_id, slug, is_published, sort_order, title_ru, title_en, body_ru, body_en}
    """
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        qs = HelpArticle.objects.select_related('help_category').prefetch_related(
            'translations__language',
        ).order_by('sort_order', '-updated_at')

        category = request.query_params.get('category')
        if category:
            qs = qs.filter(help_category__code=category)

        return Response(HelpArticleDetailSerializer(qs, many=True).data)

    @transaction.atomic
    def post(self, request):
        s = AdminHelpArticleUpsertSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data

        if HelpArticle.objects.filter(slug=d['slug']).exists():
            return Response(
                {'slug': f'Статья со slug "{d["slug"]}" уже существует.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            category = HelpCategory.objects.get(id=d['help_category_id'])
        except HelpCategory.DoesNotExist:
            return Response(
                {'help_category_id': 'Категория не найдена.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        article = HelpArticle.objects.create(
            help_category=category,
            author_admin_id=request.user.id,
            slug=d['slug'],
            is_published=d.get('is_published', False),
            sort_order=d.get('sort_order', 0),
        )
        HelpArticleTranslation.objects.create(
            help_article=article, language=_lang('ru'),
            title=d['title_ru'], body=d.get('body_ru') or '',
        )
        HelpArticleTranslation.objects.create(
            help_article=article, language=_lang('en'),
            title=d['title_en'], body=d.get('body_en') or '',
        )
        return Response(
            HelpArticleDetailSerializer(article).data,
            status=status.HTTP_201_CREATED,
        )


class AdminHelpArticleDetailView(APIView):
    """
    GET    /api/admin/help/articles/<id>/    — получить статью
    PATCH  /api/admin/help/articles/<id>/    — обновить
    DELETE /api/admin/help/articles/<id>/    — удалить
    """
    permission_classes = [IsPlatformAdmin]

    def get(self, request, article_id: int):
        article = get_object_or_404(
            HelpArticle.objects.prefetch_related('translations__language'),
            id=article_id,
        )
        return Response(HelpArticleDetailSerializer(article).data)

    @transaction.atomic
    def patch(self, request, article_id: int):
        article = get_object_or_404(HelpArticle, id=article_id)

        for f in ('slug', 'is_published', 'sort_order'):
            if f in request.data:
                setattr(article, f, request.data[f])

        if 'help_category_id' in request.data:
            try:
                article.help_category = HelpCategory.objects.get(
                    id=request.data['help_category_id']
                )
            except HelpCategory.DoesNotExist:
                return Response(
                    {'help_category_id': 'Категория не найдена.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        article.save()

        # Обновление переводов
        if 'title_ru' in request.data or 'body_ru' in request.data:
            HelpArticleTranslation.objects.update_or_create(
                help_article=article, language=_lang('ru'),
                defaults={
                    'title': request.data.get('title_ru', ''),
                    'body': request.data.get('body_ru', ''),
                },
            )
        if 'title_en' in request.data or 'body_en' in request.data:
            HelpArticleTranslation.objects.update_or_create(
                help_article=article, language=_lang('en'),
                defaults={
                    'title': request.data.get('title_en', ''),
                    'body': request.data.get('body_en', ''),
                },
            )

        return Response(HelpArticleDetailSerializer(article).data)

    def delete(self, request, article_id: int):
        article = get_object_or_404(HelpArticle, id=article_id)
        article.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)