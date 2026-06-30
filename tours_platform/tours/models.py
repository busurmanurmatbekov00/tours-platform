from django.db import models


class TourType(models.Model):
    """Типы туров (переводимый справочник)."""
    id = models.BigAutoField(primary_key=True)
    code = models.CharField(unique=True, max_length=40)
    icon = models.CharField(max_length=60, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = 'tour_types'
        verbose_name = 'Тип тура'
        verbose_name_plural = 'Типы туров'
        ordering = ['sort_order']

    def __str__(self):
        ru = self.translations.filter(language__code='ru').first()
        return ru.name if ru else self.code


class TourTypeTranslation(models.Model):
    id = models.BigAutoField(primary_key=True)
    tour_type = models.ForeignKey(
        TourType, on_delete=models.CASCADE,
        related_name='translations', db_column='tour_type_id',
    )
    language = models.ForeignKey(
        'core.Language', on_delete=models.PROTECT, db_column='language_id',
    )
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'tour_type_translations'
        unique_together = (('tour_type', 'language'),)
        verbose_name = 'Перевод типа тура'
        verbose_name_plural = 'Переводы типов туров'

    def __str__(self):
        return f'{self.name} [{self.language.code}]'


class DifficultyLevel(models.Model):
    """Уровни сложности (easy, moderate, challenging, expert)."""
    id = models.BigAutoField(primary_key=True)
    code = models.CharField(unique=True, max_length=30)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = 'difficulty_levels'
        verbose_name = 'Уровень сложности'
        verbose_name_plural = 'Уровни сложности'
        ordering = ['sort_order']

    def __str__(self):
        ru = self.translations.filter(language__code='ru').first()
        return ru.name if ru else self.code


class DifficultyLevelTranslation(models.Model):
    id = models.BigAutoField(primary_key=True)
    difficulty_level = models.ForeignKey(
        DifficultyLevel, on_delete=models.CASCADE,
        related_name='translations', db_column='difficulty_level_id',
    )
    language = models.ForeignKey(
        'core.Language', on_delete=models.PROTECT, db_column='language_id',
    )
    name = models.CharField(max_length=80)
    description = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'difficulty_level_translations'
        unique_together = (('difficulty_level', 'language'),)
        verbose_name = 'Перевод уровня сложности'
        verbose_name_plural = 'Переводы уровней сложности'

    def __str__(self):
        return f'{self.name} [{self.language.code}]'


class Tour(models.Model):
    """Тур — ядро системы."""
    STATUS_CHOICES = [
        ('draft', 'Черновик'),
        ('pending_review', 'На проверке'),
        ('published', 'Опубликован'),
        ('hidden', 'Скрыт'),
        ('archived', 'В архиве'),
    ]
    id = models.BigAutoField(primary_key=True)
    provider_profile = models.ForeignKey(
        'providers.ProviderProfile', on_delete=models.CASCADE,
        related_name='tours', db_column='provider_profile_id',
    )
    tour_type = models.ForeignKey(
        TourType, on_delete=models.PROTECT,
        related_name='tours', db_column='tour_type_id',
    )
    difficulty_level = models.ForeignKey(
        DifficultyLevel, on_delete=models.PROTECT,
        related_name='tours', db_column='difficulty_level_id',
    )
    slug = models.CharField(unique=True, max_length=200)
    is_custom = models.BooleanField(default=False)  # 0=стандартный, 1=авторский
    price = models.DecimalField(max_digits=12, decimal_places=2)
    currency_code = models.CharField(max_length=3, default='USD')
    duration_days = models.PositiveSmallIntegerField(default=1)
    duration_hours = models.PositiveSmallIntegerField(blank=True, null=True)
    min_group_size = models.PositiveSmallIntegerField(blank=True, null=True)
    max_group_size = models.PositiveSmallIntegerField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    published_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tours'
        verbose_name = 'Тур'
        verbose_name_plural = 'Туры'

    def __str__(self):
        ru = self.translations.filter(language__code='ru').first()
        return ru.title if ru else self.slug


class TourTranslation(models.Model):
    id = models.BigAutoField(primary_key=True)
    tour = models.ForeignKey(
        Tour, on_delete=models.CASCADE,
        related_name='translations', db_column='tour_id',
    )
    language = models.ForeignKey(
        'core.Language', on_delete=models.PROTECT, db_column='language_id',
    )
    title = models.CharField(max_length=255)
    summary = models.CharField(max_length=500, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    route_overview = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'tour_translations'
        unique_together = (('tour', 'language'),)
        verbose_name = 'Перевод тура'
        verbose_name_plural = 'Переводы туров'

    def __str__(self):
        return f'{self.title} [{self.language.code}]'


class TourPhoto(models.Model):
    """Галерея тура."""
    id = models.BigAutoField(primary_key=True)
    tour = models.ForeignKey(
        Tour, on_delete=models.CASCADE,
        related_name='photos', db_column='tour_id',
    )
    file_path = models.CharField(max_length=255)
    original_filename = models.CharField(max_length=255, blank=True, null=True)
    mime_type = models.CharField(max_length=100, blank=True, null=True)
    file_size = models.PositiveIntegerField(blank=True, null=True)
    alt_text = models.CharField(max_length=255, blank=True, null=True)
    is_cover = models.BooleanField(default=False)
    sort_order = models.PositiveSmallIntegerField(default=0)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tour_photos'
        verbose_name = 'Фото тура'
        verbose_name_plural = 'Фотографии туров'
        ordering = ['sort_order']

    def __str__(self):
        return self.file_path


class TourRoutePoint(models.Model):
    """Точки маршрута (связка M:N Tour↔Location с порядком)."""
    id = models.BigAutoField(primary_key=True)
    tour = models.ForeignKey(
        Tour, on_delete=models.CASCADE,
        related_name='route_points', db_column='tour_id',
    )
    location = models.ForeignKey(
        'locations.Location', on_delete=models.PROTECT,
        related_name='route_points', db_column='location_id',
    )
    sequence_order = models.PositiveSmallIntegerField()
    day_number = models.PositiveSmallIntegerField(blank=True, null=True)
    notes_ru = models.CharField(max_length=255, blank=True, null=True)
    notes_en = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'tour_route_points'
        unique_together = (('tour', 'sequence_order'),)
        verbose_name = 'Точка маршрута'
        verbose_name_plural = 'Точки маршрутов'
        ordering = ['sequence_order']

    def __str__(self):
        return f'{self.tour} → {self.location} (#{self.sequence_order})'


class TourVisaDetails(models.Model):
    """Визовые особенности тура (1:1)."""
    id = models.BigAutoField(primary_key=True)
    tour = models.OneToOneField(
        Tour, on_delete=models.CASCADE,
        related_name='visa_details', db_column='tour_id',
    )
    requires_border_permit = models.BooleanField(default=False)
    requires_special_permit = models.BooleanField(default=False)
    notes_ru = models.TextField(blank=True, null=True)
    notes_en = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'tour_visa_details'
        verbose_name = 'Визовые детали тура'
        verbose_name_plural = 'Визовые детали туров'

    def __str__(self):
        return f'Visa details for {self.tour}'


class TourInsuranceDetails(models.Model):
    """Страховые требования тура (1:1)."""
    id = models.BigAutoField(primary_key=True)
    tour = models.OneToOneField(
        Tour, on_delete=models.CASCADE,
        related_name='insurance_details', db_column='tour_id',
    )
    is_insurance_required = models.BooleanField(default=True)
    min_medical_coverage = models.DecimalField(
        max_digits=12, decimal_places=2, blank=True, null=True
    )
    medical_currency = models.CharField(max_length=3, blank=True, null=True)
    requires_evacuation = models.BooleanField(default=False)
    min_evacuation_coverage = models.DecimalField(
        max_digits=12, decimal_places=2, blank=True, null=True
    )
    evacuation_currency = models.CharField(max_length=3, blank=True, null=True)
    notes_ru = models.TextField(blank=True, null=True)
    notes_en = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'tour_insurance_details'
        verbose_name = 'Страховые детали тура'
        verbose_name_plural = 'Страховые детали туров'

    def __str__(self):
        return f'Insurance for {self.tour}'