from django.db import models


class VerificationStatus(models.Model):
    """Статусы верификации (not_submitted, pending, approved, rejected)."""
    id = models.BigAutoField(primary_key=True)
    code = models.CharField(unique=True, max_length=30)
    name_ru = models.CharField(max_length=60)
    name_en = models.CharField(max_length=60)

    class Meta:
        db_table = 'verification_statuses'
        verbose_name = 'Статус верификации'
        verbose_name_plural = 'Статусы верификации'

    def __str__(self):
        return self.name_ru


class VerificationDocumentType(models.Model):
    """Типы документов верификации (паспорт, лицензия гида и т. д.)."""
    id = models.BigAutoField(primary_key=True)
    code = models.CharField(unique=True, max_length=40)
    name_ru = models.CharField(max_length=80)
    name_en = models.CharField(max_length=80)

    class Meta:
        db_table = 'verification_document_types'
        verbose_name = 'Тип документа верификации'
        verbose_name_plural = 'Типы документов верификации'

    def __str__(self):
        return self.name_ru


class CertificateType(models.Model):
    """Типы сертификатов / квалификаций исполнителя."""
    id = models.BigAutoField(primary_key=True)
    code = models.CharField(unique=True, max_length=40)
    name_ru = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100)

    class Meta:
        db_table = 'certificate_types'
        verbose_name = 'Тип сертификата'
        verbose_name_plural = 'Типы сертификатов'

    def __str__(self):
        return self.name_ru


class ProviderProfile(models.Model):
    """Публичные профили исполнителей (1:1 с User)."""
    id = models.BigAutoField(primary_key=True)
    user = models.OneToOneField(
        'users.User', on_delete=models.CASCADE,
        related_name='provider_profile', db_column='user_id',
    )
    verification_status = models.ForeignKey(
        VerificationStatus, on_delete=models.PROTECT,
        related_name='provider_profiles', db_column='verification_status_id',
    )
    slug = models.CharField(unique=True, max_length=160)
    display_name = models.CharField(max_length=150)
    avatar_path = models.CharField(max_length=255, blank=True, null=True)
    contact_email = models.CharField(max_length=255, blank=True, null=True)
    contact_phone = models.CharField(max_length=30, blank=True, null=True)
    website_url = models.CharField(max_length=255, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'provider_profiles'
        verbose_name = 'Профиль исполнителя'
        verbose_name_plural = 'Профили исполнителей'

    def __str__(self):
        return self.display_name


class ProviderProfileTranslation(models.Model):
    """Переводы профиля исполнителя (headline, bio)."""
    id = models.BigAutoField(primary_key=True)
    provider_profile = models.ForeignKey(
        ProviderProfile, on_delete=models.CASCADE,
        related_name='translations', db_column='provider_profile_id',
    )
    language = models.ForeignKey(
        'core.Language', on_delete=models.PROTECT, db_column='language_id',
    )
    headline = models.CharField(max_length=255, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'provider_profile_translations'
        unique_together = (('provider_profile', 'language'),)
        verbose_name = 'Перевод профиля исполнителя'
        verbose_name_plural = 'Переводы профилей исполнителей'

    def __str__(self):
        return f'{self.provider_profile} [{self.language.code}]'


class Certificate(models.Model):
    """Сертификаты и квалификации исполнителя."""
    id = models.BigAutoField(primary_key=True)
    provider_profile = models.ForeignKey(
        ProviderProfile, on_delete=models.CASCADE,
        related_name='certificates', db_column='provider_profile_id',
    )
    certificate_type = models.ForeignKey(
        CertificateType, on_delete=models.SET_NULL,
        blank=True, null=True, db_column='certificate_type_id',
    )
    title = models.CharField(max_length=200)
    issuer = models.CharField(max_length=200, blank=True, null=True)
    certificate_number = models.CharField(max_length=100, blank=True, null=True)
    issued_date = models.DateField(blank=True, null=True)
    expiry_date = models.DateField(blank=True, null=True)
    file_path = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'certificates'
        verbose_name = 'Сертификат'
        verbose_name_plural = 'Сертификаты'

    def __str__(self):
        return self.title


class VerificationRequest(models.Model):
    """Заявки на верификацию (история подач)."""
    id = models.BigAutoField(primary_key=True)
    provider_profile = models.ForeignKey(
        ProviderProfile, on_delete=models.CASCADE,
        related_name='verification_requests', db_column='provider_profile_id',
    )
    status = models.ForeignKey(
        VerificationStatus, on_delete=models.PROTECT,
        related_name='requests', db_column='status_id',
    )
    reviewed_by_admin = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL,
        blank=True, null=True, related_name='reviewed_verifications',
        db_column='reviewed_by_admin_id',
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(blank=True, null=True)
    admin_comment = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'verification_requests'
        verbose_name = 'Заявка на верификацию'
        verbose_name_plural = 'Заявки на верификацию'

    def __str__(self):
        return f'Request #{self.id} for {self.provider_profile}'


class VerificationDocument(models.Model):
    """Документы, приложенные к заявке на верификацию."""
    id = models.BigAutoField(primary_key=True)
    verification_request = models.ForeignKey(
        VerificationRequest, on_delete=models.CASCADE,
        related_name='documents', db_column='verification_request_id',
    )
    document_type = models.ForeignKey(
        VerificationDocumentType, on_delete=models.PROTECT,
        db_column='document_type_id',
    )
    file_path = models.CharField(max_length=255)
    original_filename = models.CharField(max_length=255, blank=True, null=True)
    mime_type = models.CharField(max_length=100, blank=True, null=True)
    file_size = models.PositiveIntegerField(blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'verification_documents'
        verbose_name = 'Документ верификации'
        verbose_name_plural = 'Документы верификации'

    def __str__(self):
        return self.original_filename or self.file_path