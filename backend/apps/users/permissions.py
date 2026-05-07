from rest_framework.permissions import BasePermission

from apps.users.models import Role


class IsAdminRole(BasePermission):
    message = "Permission reservee aux administrateurs."

    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(user and user.is_authenticated and user.est_administrateur)


class IsAdminPrincipal(BasePermission):
    message = "Permission reservee a l'administrateur principal."

    def has_permission(self, request, view) -> bool:
        user = request.user
        return bool(user and user.is_authenticated and user.est_admin_principal)


class CanCreateAdministrateur(BasePermission):
    message = "Seul l'administrateur principal peut creer un administrateur."

    def has_permission(self, request, view) -> bool:
        if request.method != "POST":
            return True

        role_id = request.data.get("role")
        role_nom = request.data.get("role_nom")
        if role_id:
            role_nom = Role.objects.filter(pk=role_id).values_list("nom", flat=True).first()

        if role_nom in {Role.Nom.ADMIN_PRINCIPAL, Role.Nom.ADMIN_OPERATIONNEL}:
            return bool(request.user and request.user.is_authenticated and request.user.est_admin_principal)

        return True
