from rest_framework.permissions import BasePermission


class IsPlatformAdmin(BasePermission):
    """Доступ только пользователям с ролью admin."""
    message = 'Только администратор имеет доступ к этому ресурсу.'

    def has_permission(self, request, view):
        user = request.user
        if not user or not getattr(user, 'is_authenticated', False):
            return False
        role = getattr(user, 'role', None)
        return role is not None and role.code == 'admin'