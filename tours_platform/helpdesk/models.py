from django.db import models


class HelpCategory(models.Model):
    """Категории справочного раздела."""
    id = models.BigAutoField(primary_key=True)
    code = models.CharField(unique=True, max_length=40)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = 'help_categories'
        verbose_name = 'Категория справки'
        verbose_name_plural = 'Категории справки'
        ordering = ['sort_order']

    def __str__(self):
        ru = self.translations.filter(language__code='ru').first()
        return ru.name if ru else self.code


class HelpCategoryTranslation(models.Model):
    id = models.BigAutoField(primary_key=True)
    help_category = models.ForeignKey(
        HelpCategory, on_delete=models.CASCADE,
        related_name='translations', db_column='help_category_id',
    )
    language = models.ForeignKey(
        'core.Language', on_delete=models.PROTECT, db_column='language_id',
    )
    name = models.CharField(max_length=120)

    class Meta:
        db_table = 'help_category_translations'
        unique_together = (('help_category', 'language'),)
        verbose_name = 'Перевод категории справки'
        verbose_name_plural = 'Переводы категорий справки'

    def __str__(self):
        return f'{self.name} [{self.language.code}]'


class HelpArticle(models.Model):
    """Статьи справочного раздела."""
    id = models.BigAutoField(primary_key=True)
    help_category = models.ForeignKey(
        HelpCategory, on_delete=models.PROTECT,
        related_name='articles', db_column='help_category_id',
    )
    author_admin = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL,
        blank=True, null=True, related_name='help_articles',
        db_column='author_admin_id',
    )
    slug = models.CharField(unique=True, max_length=200)
    is_published = models.BooleanField(default=False)
    sort_order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'help_articles'
        verbose_name = 'Статья справки'
        verbose_name_plural = 'Статьи справки'
        ordering = ['sort_order']

    def __str__(self):
        ru = self.translations.filter(language__code='ru').first()
        return ru.title if ru else self.slug


class HelpArticleTranslation(models.Model):
    id = models.BigAutoField(primary_key=True)
    help_article = models.ForeignKey(
        HelpArticle, on_delete=models.CASCADE,
        related_name='translations', db_column='help_article_id',
    )
    language = models.ForeignKey(
        'core.Language', on_delete=models.PROTECT, db_column='language_id',
    )
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'help_article_translations'
        unique_together = (('help_article', 'language'),)
        verbose_name = 'Перевод статьи справки'
        verbose_name_plural = 'Переводы статей справки'

    def __str__(self):
        return f'{self.title} [{self.language.code}]'