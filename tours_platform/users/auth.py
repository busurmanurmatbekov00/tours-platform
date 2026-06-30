from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from .models import User


class PlatformUser:
    """Обёртка над users.User, совместимая с request.user в DRF."""
    def __init__(self, user):
        self._user = user
        self.id = user.id
        self.pk = user.id
        self.is_authenticated = True
        self.is_anonymous = False

    def __getattr__(self, name):
        return getattr(self._user, name)


class PlatformJWTAuthentication(JWTAuthentication):
    """JWT-аутентификация против нашей таблицы users."""

    def get_user(self, validated_token):
        try:
            user_id = validated_token['user_id']
        except KeyError:
            raise InvalidToken('Token has no user_id claim')

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise AuthenticationFailed('User not found', code='user_not_found')

        if not user.is_active:
            raise AuthenticationFailed('User is inactive', code='user_inactive')
        if user.is_blocked:
            raise AuthenticationFailed('User is blocked', code='user_blocked')

        return PlatformUser(user)