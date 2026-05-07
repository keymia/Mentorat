from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.users.views import (
    LoginView,
    LogoutView,
    MeView,
    MentorViewSet,
    NiveauAcademiqueViewSet,
    RoleViewSet,
    UtilisateurViewSet,
)

router = DefaultRouter()
router.register("users", UtilisateurViewSet, basename="users")
router.register("roles", RoleViewSet, basename="roles")
router.register("niveaux", NiveauAcademiqueViewSet, basename="niveaux")
router.register("mentors", MentorViewSet, basename="mentors")

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/me/", MeView.as_view(), name="auth-me"),
    path("", include(router.urls)),
]
