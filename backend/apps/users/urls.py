from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.users.views import (
    AdminTeamMemberDetailView,
    AdminTeamMemberListView,
    LoginRequestCodeView,
    LoginView,
    LoginVerifyCodeView,
    LogoutView,
    MeView,
    MentorViewSet,
    MentorProfileView,
    NiveauAcademiqueViewSet,
    OperationalAdminDetailView,
    OperationalAdminListView,
    PasswordUpdateView,
    PublicAvailableMentorsView,
    PublicAboutTeamView,
    MentorRegistrationConfigView,
    PublicTeamView,
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
    path("auth/login/request-code/", LoginRequestCodeView.as_view(), name="auth-login-request-code"),
    path("auth/login/verify-code/", LoginVerifyCodeView.as_view(), name="auth-login-verify-code"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/me/", MeView.as_view(), name="auth-me"),
    path("auth/password/", PasswordUpdateView.as_view(), name="auth-password"),
    path("public/team/", PublicTeamView.as_view(), name="public-team"),
    path("public/about-team/", PublicAboutTeamView.as_view(), name="public-about-team"),
    path("public/available-mentors/", PublicAvailableMentorsView.as_view(), name="public-available-mentors"),
    path("public/mentor-registration-config/", MentorRegistrationConfigView.as_view(), name="public-mentor-registration-config"),
    path("mentor/profile/", MentorProfileView.as_view(), name="mentor-profile"),
    path("admin/team-members/", AdminTeamMemberListView.as_view(), name="admin-team-members"),
    path("admin/team-members/<int:pk>/", AdminTeamMemberDetailView.as_view(), name="admin-team-member-detail"),
    path("admin/operational-admins/", OperationalAdminListView.as_view(), name="admin-operational-admins"),
    path(
        "admin/operational-admins/<int:pk>/",
        OperationalAdminDetailView.as_view(),
        name="admin-operational-admin-detail",
    ),
    path("", include(router.urls)),
]
