import bcrypt
from django.core.cache import cache
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils.text import slugify
from django.db import transaction

from .models import User, Role
from providers.models import ProviderProfile, VerificationStatus


def hash_password(raw: str) -> str:
    return bcrypt.hashpw(raw.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(raw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(raw.encode('utf-8'), hashed.encode('utf-8'))
    except (ValueError, AttributeError):
        return False


def issue_tokens(user: User) -> dict:
    refresh = RefreshToken()
    refresh['user_id'] = user.id
    refresh['role'] = user.role.code
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


class ProviderRegistrationSerializer(serializers.Serializer):
    """Регистрация исполнителя: создаёт User + ProviderProfile одной транзакцией."""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    full_name = serializers.CharField(max_length=150)
    phone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    role_code = serializers.ChoiceField(choices=['guide', 'tour_operator', 'travel_agent'])
    display_name = serializers.CharField(max_length=150, required=False, allow_blank=True)

    def validate_email(self, value):
        value = value.lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Пользователь с таким email уже зарегистрирован.')
        # проверяем, что email прошёл OTP-подтверждение
        if not cache.get(f'otp_verified:{value}'):
            raise serializers.ValidationError('Email не подтверждён. Пройдите верификацию через код.')
        return value

    def validate_role_code(self, value):
        try:
            self._role = Role.objects.get(code=value, is_provider=True)
        except Role.DoesNotExist:
            raise serializers.ValidationError('Недопустимая роль.')
        return value

    def validate(self, attrs):
        role_code = attrs.get('role_code')
        display_name = (attrs.get('display_name') or '').strip()

        # для гида display_name не обязателен — сформируем автоматически
        if role_code == 'guide':
            return attrs

        # для оператора/агента — обязателен и уникален
        if not display_name:
            raise serializers.ValidationError(
                {'display_name': 'Это поле обязательно для туроператора/турагента.'}
            )

        if ProviderProfile.objects.filter(display_name__iexact=display_name).exists():
            raise serializers.ValidationError(
                {'display_name': 'Это название уже занято, выберите другое.'}
            )

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        # 1) учётка
        user = User.objects.create(
            role=self._role,
            email=validated_data['email'],
            phone=validated_data.get('phone') or None,
            password_hash=hash_password(validated_data['password']),
            full_name=validated_data['full_name'],
            is_active=True,
        )

        # 2) название для каталога
        role_code = validated_data['role_code']
        if role_code == 'guide':
            display_name = f"Гид {validated_data['full_name']}"
        else:
            display_name = validated_data['display_name'].strip()

        # 3) публичный профиль (статус — not_submitted)
        not_submitted = VerificationStatus.objects.get(code='not_submitted')
        base_slug = slugify(display_name) or f'provider-{user.id}'
        slug = base_slug
        n = 1
        while ProviderProfile.objects.filter(slug=slug).exists():
            n += 1
            slug = f'{base_slug}-{n}'

        ProviderProfile.objects.create(
            user=user,
            verification_status=not_submitted,
            slug=slug,
            display_name=display_name,
            is_published=False,
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        try:
            user = User.objects.get(email__iexact=attrs['email'])
        except User.DoesNotExist:
            raise serializers.ValidationError('Неверный email или пароль.')

        if not verify_password(attrs['password'], user.password_hash):
            raise serializers.ValidationError('Неверный email или пароль.')
        if not user.is_active:
            raise serializers.ValidationError('Учётная запись неактивна.')
        if user.is_blocked:
            raise serializers.ValidationError('Учётная запись заблокирована.')

        attrs['user'] = user
        return attrs