from rest_framework import serializers
from .models import (
    HelpCategory, HelpCategoryTranslation,
    HelpArticle, HelpArticleTranslation,
)


def _get_translation(translations, lang, field, default=None):
    tr = next((t for t in translations if t.language.code == lang), None)
    if tr is None and translations:
        tr = translations[0]
    return getattr(tr, field, default) if tr else default


class HelpCategorySerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    articles_count = serializers.SerializerMethodField()

    class Meta:
        model = HelpCategory
        fields = ('id', 'code', 'sort_order', 'name', 'articles_count')

    def get_name(self, obj):
        translations = list(obj.translations.all())
        return {
            'ru': _get_translation(translations, 'ru', 'name'),
            'en': _get_translation(translations, 'en', 'name'),
        }

    def get_articles_count(self, obj):
        return obj.articles.filter(is_published=True).count()


class HelpArticleCardSerializer(serializers.ModelSerializer):
    """Краткая карточка статьи для списка."""
    title = serializers.SerializerMethodField()
    category_code = serializers.CharField(source='help_category.code', read_only=True)

    class Meta:
        model = HelpArticle
        fields = (
            'id', 'slug', 'category_code', 'sort_order',
            'title', 'created_at', 'updated_at',
        )

    def get_title(self, obj):
        translations = list(obj.translations.all())
        return {
            'ru': _get_translation(translations, 'ru', 'title'),
            'en': _get_translation(translations, 'en', 'title'),
        }


class HelpArticleDetailSerializer(HelpArticleCardSerializer):
    """Полная статья с телом."""
    body = serializers.SerializerMethodField()

    class Meta(HelpArticleCardSerializer.Meta):
        fields = HelpArticleCardSerializer.Meta.fields + ('body',)

    def get_body(self, obj):
        translations = list(obj.translations.all())
        return {
            'ru': _get_translation(translations, 'ru', 'body'),
            'en': _get_translation(translations, 'en', 'body'),
        }
    
class AdminHelpCategoryUpsertSerializer(serializers.Serializer):
    """Создание/редактирование категории с переводами."""
    code = serializers.CharField(max_length=40)
    sort_order = serializers.IntegerField(min_value=0, default=0)
    name_ru = serializers.CharField(max_length=120)
    name_en = serializers.CharField(max_length=120)


class AdminHelpArticleUpsertSerializer(serializers.Serializer):
    """Создание/редактирование статьи с переводами."""
    help_category_id = serializers.IntegerField()
    slug = serializers.CharField(max_length=200)
    is_published = serializers.BooleanField(default=False)
    sort_order = serializers.IntegerField(min_value=0, default=0)

    title_ru = serializers.CharField(max_length=200)
    title_en = serializers.CharField(max_length=200)
    body_ru = serializers.CharField(allow_blank=True, required=False)
    body_en = serializers.CharField(allow_blank=True, required=False)   