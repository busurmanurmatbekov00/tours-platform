from django.db import models


class Role(models.Model):
    """Роли пользователей (турист, гид, туроператор, турагент, администратор)."""
    id = models.BigAutoField(primary_key=True)
    code = models.CharField(unique=True, max_length=30)
    name_ru = models.CharField(max_length=60)
    name_en = models.CharField(max_length=60)
    is_provider = models.BooleanField(default=False)

    class Meta:
        db_table = 'roles'
        verbose_name = 'Роль'
        verbose_name_plural = 'Роли'

    def __str__(self):
        return self.name_ru


class User(models.Model):
    """Учётные записи исполнителей и администраторов."""
    id = models.BigAutoField(primary_key=True)
    role = models.ForeignKey(
        Role, on_delete=models.PROTECT, related_name='users', db_column='role_id'
    )
    preferred_language = models.ForeignKey(
        'core.Language',
        on_delete=models.SET_NULL,
        blank=True, null=True,
        related_name='users',
        db_column='preferred_language_id',
    )
    email = models.CharField(unique=True, max_length=255)
    phone = models.CharField(max_length=30, blank=True, null=True)
    password_hash = models.CharField(max_length=255)  # bcrypt/argon2
    full_name = models.CharField(max_length=150, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_blocked = models.BooleanField(default=False)
    email_verified_at = models.DateTimeField(blank=True, null=True)
    last_login_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'

    def __str__(self):
        return self.email


class PasswordResetToken(models.Model):
    """Токены сброса пароля."""
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='password_reset_tokens',
        db_column='user_id',
    )
    token_hash = models.CharField(unique=True, max_length=255)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'password_reset_tokens'
        verbose_name = 'Токен сброса пароля'
        verbose_name_plural = 'Токены сброса пароля'

    def __str__(self):
        return f'Token for {self.user.email}'