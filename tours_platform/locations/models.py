from django.db import models


class Region(models.Model):
    """Области (регионы) Кыргызской Республики."""
    id = models.BigAutoField(primary_key=True)
    code = models.CharField(unique=True, max_length=30)
    name_ru = models.CharField(max_length=80)
    name_en = models.CharField(max_length=80)

    class Meta:
        db_table = 'regions'
        verbose_name = 'Регион'
        verbose_name_plural = 'Регионы'

    def __str__(self):
        return self.name_ru


class Location(models.Model):
    """Переиспользуемые точки на карте."""
    id = models.BigAutoField(primary_key=True)
    region = models.ForeignKey(
        Region, on_delete=models.SET_NULL,
        blank=True, null=True, related_name='locations', db_column='region_id',
    )
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    elevation_m = models.PositiveSmallIntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'locations'
        verbose_name = 'Локация'
        verbose_name_plural = 'Локации'

    def __str__(self):
        ru = self.translations.filter(language__code='ru').first()
        return ru.name if ru else f'Location #{self.id}'


class LocationTranslation(models.Model):
    """Названия и описания локаций на разных языках."""
    id = models.BigAutoField(primary_key=True)
    location = models.ForeignKey(
        Location, on_delete=models.CASCADE,
        related_name='translations', db_column='location_id',
    )
    language = models.ForeignKey(
        'core.Language', on_delete=models.PROTECT, db_column='language_id',
    )
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'location_translations'
        unique_together = (('location', 'language'),)
        verbose_name = 'Перевод локации'
        verbose_name_plural = 'Переводы локаций'

    def __str__(self):
        return f'{self.name} [{self.language.code}]'