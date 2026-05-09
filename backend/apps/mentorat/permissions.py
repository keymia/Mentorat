from rest_framework.permissions import BasePermission


class IsMentorUser(BasePermission):
    message = "Permission reservee aux mentors."

    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(user and user.is_authenticated and user.est_mentor)


class IsMentoreUser(BasePermission):
    message = "Permission reservee aux mentores."

    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(user and user.is_authenticated and user.est_mentore)
