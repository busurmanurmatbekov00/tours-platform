from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from .serializers import (
    ProviderRegistrationSerializer, LoginSerializer, issue_tokens
)
from .models import User


class RegisterProviderView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ProviderRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        tokens = issue_tokens(user)
        return Response(
            {
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'full_name': user.full_name,
                    'role': user.role.code,
                },
                **tokens,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user: User = serializer.validated_data['user']
        user.last_login_at = timezone.now()
        user.save(update_fields=['last_login_at'])
        tokens = issue_tokens(user)
        return Response({
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name,
                'role': user.role.code,
            },
            **tokens,
        })