import random
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


def _domain_allowed(email: str) -> bool:
    try:
        domain = email.strip().lower().split('@')[1]
    except IndexError:
        return False
    return domain in settings.ALLOWED_EMAIL_DOMAINS


def _cooldown_key(email):
    return f'otp_cooldown:{email.lower()}'


def _code_key(email):
    return f'otp_code:{email.lower()}'


def _verified_key(email):
    return f'otp_verified:{email.lower()}'


class RequestEmailOtpView(APIView):
    """POST /api/auth/email-otp/request/  body: {"email": "..."}"""
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip()

        if not email or '@' not in email:
            return Response(
                {'detail': 'Введите корректный email.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not _domain_allowed(email):
            return Response(
                {'detail': 'Пожалуйста, используйте надежный почтовый сервис (Gmail, Mail.ru и др.)'},
                status=status.HTTP_400_BAD_REQUEST,
            )
         # проверяем, не занят ли email уже зарегистрированным пользователем
        from .models import User
        if User.objects.filter(email__iexact=email).exists():
            return Response(
                {'detail': 'Пользователь с таким email уже зарегистрирован.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

       
       # защита от спама — проверяем cooldown в кэше
        cooldown_key = _cooldown_key(email)
        cooldown_data = cache.get(cooldown_key)
        if cooldown_data:
            import time
            elapsed = time.time() - cooldown_data
            remaining = int(settings.OTP_COOLDOWN_SECONDS - elapsed)
            if remaining > 0:
                return Response(
                    {
                        'detail': f'Повторная отправка доступна через {remaining} сек.',
                        'retry_after': remaining,
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

        # генерируем 5-значный код
        code = str(random.randint(10000, 99999))

        # сохраняем код на 5 минут
        cache.set(_code_key(email), code, timeout=settings.OTP_TTL_SECONDS)
        # ставим cooldown на 100 секунд
        cache.set(cooldown_key, True, timeout=settings.OTP_COOLDOWN_SECONDS)
        # сбрасываем предыдущую верификацию, если была
        cache.delete(_verified_key(email))

        try:
            send_mail(
                subject='Код подтверждения — Туры КР',
                message=f'Ваш код подтверждения: {code}\n\nКод действителен 5 минут.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as e:
            return Response(
                {'detail': f'Не удалось отправить письмо: {e}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({'detail': 'Код отправлен на вашу почту.'})


class VerifyEmailOtpView(APIView):
    """POST /api/auth/email-otp/verify/  body: {"email": "...", "code": "12345"}"""
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip()
        code = (request.data.get('code') or '').strip()

        if not email or not code:
            return Response(
                {'detail': 'Email и код обязательны.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        stored_code = cache.get(_code_key(email))

        if stored_code is None:
            return Response(
                {'detail': 'Код истёк или не был запрошен. Запросите новый код.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if code != stored_code:
            return Response(
                {'detail': 'Неверный код подтверждения.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # код верный — помечаем email как подтверждённый на 15 минут
        # (этого времени достаточно, чтобы пользователь завершил регистрацию)
        cache.set(_verified_key(email), True, timeout=900)
        cache.delete(_code_key(email))  # код одноразовый — использован

        return Response({'detail': 'Email успешно подтверждён.'})