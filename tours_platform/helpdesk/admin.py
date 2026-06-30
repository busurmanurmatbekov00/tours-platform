from django.contrib import admin
from .models import (
    HelpCategory, HelpCategoryTranslation,
    HelpArticle, HelpArticleTranslation,
)


class HelpCategoryTranslationInline(admin.TabularInline):
    model = HelpCategoryTranslation
    extra = 1


class HelpArticleTranslationInline(admin.TabularInline):
    model = HelpArticleTranslation
    extra = 1


@admin.register(HelpCategory)
class HelpCategoryAdmin(admin.ModelAdmin):
    list_display = ('code', 'sort_order')
    inlines = [HelpCategoryTranslationInline]


@admin.register(HelpArticle)
class HelpArticleAdmin(admin.ModelAdmin):
    list_display = ('slug', 'help_category', 'is_published', 'author_admin', 'updated_at')
    list_filter = ('help_category', 'is_published')
    search_fields = ('slug', 'translations__title')
    inlines = [HelpArticleTranslationInline]