import time
import random
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from users.models import User


def _domain_allowed(email: str) -> bool:
    try:
        domain = email.strip().lower().split('@')[1]
    except IndexError:
        return False
    return domain in settings.ALLOWED_EMAIL_DOMAINS


def _cooldown_key(user_id):
    return f'profile_email_cooldown:{user_id}'


def _code_key(user_id):
    return f'profile_email_code:{user_id}'


def _pending_email_key(user_id):
    return f'profile_email_pending:{user_id}'


class RequestEmailChangeView(APIView):
    """POST /api/providers/me/email-change/request/  body: {"new_email": "..."}"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        new_email = (request.data.get('new_email') or '').strip().lower()

        if not new_email or '@' not in new_email:
            return Response({'detail': 'Введите корректный email.'}, status=status.HTTP_400_BAD_REQUEST)

        if not _domain_allowed(new_email):
            return Response(
                {'detail': 'Пожалуйста, используйте надежный почтовый сервис (Gmail, Mail.ru и др.)'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(email__iexact=new_email).exclude(id=request.user.id).exists():
            return Response({'detail': 'Этот email уже используется другим аккаунтом.'}, status=status.HTTP_400_BAD_REQUEST)

        cooldown_key = _cooldown_key(request.user.id)
        started_at = cache.get(cooldown_key)
        if started_at:
            elapsed = time.time() - started_at
            remaining = int(settings.OTP_COOLDOWN_SECONDS - elapsed)
            if remaining > 0:
                return Response(
                    {'detail': f'Повторная отправка доступна через {remaining} сек.', 'retry_after': remaining},
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

        code = str(random.randint(10000, 99999))
        cache.set(_code_key(request.user.id), code, timeout=settings.OTP_TTL_SECONDS)
        cache.set(_pending_email_key(request.user.id), new_email, timeout=settings.OTP_TTL_SECONDS)
        cache.set(cooldown_key, time.time(), timeout=settings.OTP_COOLDOWN_SECONDS)

        try:
            send_mail(
                subject='Подтверждение смены email — Туры КР',
                message=f'Ваш код подтверждения: {code}\n\nКод действителен 5 минут.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[new_email],
                fail_silently=False,
            )
        except Exception as e:
            return Response({'detail': f'Не удалось отправить письмо: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'detail': 'Код отправлен на новую почту.'})


class VerifyEmailChangeView(APIView):
    """POST /api/providers/me/email-change/verify/  body: {"code": "12345"}"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        code = (request.data.get('code') or '').strip()
        stored_code = cache.get(_code_key(request.user.id))
        pending_email = cache.get(_pending_email_key(request.user.id))

        if not stored_code or not pending_email:
            return Response({'detail': 'Код истёк или не был запрошен.'}, status=status.HTTP_400_BAD_REQUEST)

        if code != stored_code:
            return Response({'detail': 'Неверный код подтверждения.'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user._user if hasattr(request.user, '_user') else User.objects.get(id=request.user.id)
        user.email = pending_email
        user.save(update_fields=['email'])

        cache.delete(_code_key(request.user.id))
        cache.delete(_pending_email_key(request.user.id))

        return Response({'detail': 'Email успешно изменён.', 'new_email': pending_email})