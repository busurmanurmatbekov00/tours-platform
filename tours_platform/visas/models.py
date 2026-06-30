from django.db import models


class Country(models.Model):
    """Страны (для визовых правил)."""
    id = models.BigAutoField(primary_key=True)
    iso_alpha2 = models.CharField(unique=True, max_length=2)
    iso_alpha3 = models.CharField(unique=True, max_length=3)
    name_ru = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100)

    class Meta:
        db_table = 'countries'
        verbose_name = 'Страна'
        verbose_name_plural = 'Страны'

    def __str__(self):
        return self.name_ru


class VisaPolicy(models.Model):
    """Шаблоны визовых режимов (visa_free_30_60, eaeu_90_180, evisa, visa_required)."""
    id = models.BigAutoField(primary_key=True)
    code = models.CharField(unique=True, max_length=40)
    max_stay_days = models.PositiveSmallIntegerField(blank=True, null=True)
    rolling_period_days = models.PositiveSmallIntegerField(blank=True, null=True)
    requires_evisa = models.BooleanField(default=False)
    evisa_portal_url = models.CharField(max_length=255, blank=True, null=True)
    is_eaeu = models.BooleanField(default=False)

    class Meta:
        db_table = 'visa_policies'
        verbose_name = 'Визовый режим'
        verbose_name_plural = 'Визовые режимы'

    def __str__(self):
        ru = self.translations.filter(language__code='ru').first()
        return ru.title if ru else self.code


class VisaPolicyTranslation(models.Model):
    id = models.BigAutoField(primary_key=True)
    visa_policy = models.ForeignKey(
        VisaPolicy, on_delete=models.CASCADE,
        related_name='translations', db_column='visa_policy_id',
    )
    language = models.ForeignKey(
        'core.Language', on_delete=models.PROTECT, db_column='language_id',
    )
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'visa_policy_translations'
        unique_together = (('visa_policy', 'language'),)
        verbose_name = 'Перевод визового режима'
        verbose_name_plural = 'Переводы визовых режимов'

    def __str__(self):
        return f'{self.title} [{self.language.code}]'


class CountryVisaPolicy(models.Model):
    """Привязка визового режима к стране с датами действия (M:N)."""
    id = models.BigAutoField(primary_key=True)
    country = models.ForeignKey(
        Country, on_delete=models.CASCADE,
        related_name='visa_policies', db_column='country_id',
    )
    visa_policy = models.ForeignKey(
        VisaPolicy, on_delete=models.PROTECT,
        related_name='country_links', db_column='visa_policy_id',
    )
    effective_from = models.DateField()
    effective_to = models.DateField(blank=True, null=True)  # NULL = действует сейчас

    class Meta:
        db_table = 'country_visa_policies'
        unique_together = (('country', 'effective_from'),)
        verbose_name = 'Визовый режим страны'
        verbose_name_plural = 'Визовые режимы стран'

    def __str__(self):
        return f'{self.country} → {self.visa_policy} (с {self.effective_from})'


class InsuranceRequirement(models.Model):
    """Справочные требования к страхованию."""
    APPLIES_CHOICES = [
        ('general', 'Общее'),
        ('mountain', 'Горный маршрут'),
        ('custom', 'Особое'),
    ]
    id = models.BigAutoField(primary_key=True)
    code = models.CharField(unique=True, max_length=40)
    applies_to = models.CharField(max_length=10, choices=APPLIES_CHOICES, default='general')
    min_medical_coverage = models.DecimalField(
        max_digits=12, decimal_places=2, blank=True, null=True
    )
    medical_currency = models.CharField(max_length=3, blank=True, null=True)
    requires_evacuation = models.BooleanField(default=False)
    min_evacuation_coverage = models.DecimalField(
        max_digits=12, decimal_places=2, blank=True, null=True
    )
    evacuation_currency = models.CharField(max_length=3, blank=True, null=True)
    is_mandatory = models.BooleanField(default=False)

    class Meta:
        db_table = 'insurance_requirements'
        verbose_name = 'Требование к страхованию'
        verbose_name_plural = 'Требования к страхованию'

    def __str__(self):
        ru = self.translations.filter(language__code='ru').first()
        return ru.title if ru else self.code


class InsuranceRequirementTranslation(models.Model):
    id = models.BigAutoField(primary_key=True)
    insurance_requirement = models.ForeignKey(
        InsuranceRequirement, on_delete=models.CASCADE,
        related_name='translations', db_column='insurance_requirement_id',
    )
    language = models.ForeignKey(
        'core.Language', on_delete=models.PROTECT, db_column='language_id',
    )
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'insurance_requirement_translations'
        unique_together = (('insurance_requirement', 'language'),)
        verbose_name = 'Перевод требования к страхованию'
        verbose_name_plural = 'Переводы требований к страхованию'

    def __str__(self):
        return f'{self.title} [{self.language.code}]'