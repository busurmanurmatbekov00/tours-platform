from django.db import models


class Language(models.Model):
    """Языки интерфейса и контента (RU/EN, расширяемо)."""
    id = models.BigAutoField(primary_key=True)
    code = models.CharField(unique=True, max_length=2)  # ISO 639-1
    name_native = models.CharField(max_length=50)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = 'languages'
        verbose_name = 'Язык'
        verbose_name_plural = 'Языки'
        ordering = ['sort_order']

    def __str__(self):
        return f'{self.name_native} ({self.code})'