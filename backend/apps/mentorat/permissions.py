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


class IsMentorAssignmentOwner(BasePermission):
    message = "Permission reservee au mentor responsable de cette affectation."

    def has_object_permission(self, request, view, obj) -> bool:
        return bool(request.user and request.user.is_authenticated and obj.mentor_id == request.user.id)


class IsMentorSessionOwner(BasePermission):
    message = "Permission reservee au mentor responsable de cette seance."

    def has_object_permission(self, request, view, obj) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and obj.assignment.mentor_id == request.user.id
        )


class IsMentorProgressOwner(BasePermission):
    message = "Permission reservee au mentor responsable de ce suivi."

    def has_object_permission(self, request, view, obj) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and obj.assignment.mentor_id == request.user.id
        )
