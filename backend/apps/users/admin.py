from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from apps.users.models import LoginVerificationCode, NiveauAcademique, Role, Utilisateur


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("nom", "description")
    search_fields = ("nom",)


@admin.register(NiveauAcademique)
class NiveauAcademiqueAdmin(admin.ModelAdmin):
    list_display = ("nom", "code", "ordre_niveau", "est_premier_niveau", "est_dernier_niveau")
    list_editable = ("ordre_niveau", "est_premier_niveau", "est_dernier_niveau")
    ordering = ("ordre_niveau",)


@admin.register(LoginVerificationCode)
class LoginVerificationCodeAdmin(admin.ModelAdmin):
    list_display = ("user", "challenge_id", "expires_at", "used_at", "created_at")
    list_filter = ("used_at", "expires_at")
    search_fields = ("user__email", "challenge_id")
    readonly_fields = ("user", "challenge_id", "code_hash", "expires_at", "used_at", "created_at")


@admin.register(Utilisateur)
class UtilisateurAdmin(UserAdmin):
    model = Utilisateur
    list_display = (
        "email",
        "prenom",
        "nom",
        "role",
        "profil_mentorat",
        "niveau_academique",
        "statut_compte",
        "wants_to_appear_on_team_page",
        "is_team_approved",
        "can_appear_on_about_page",
        "pending_public_validation",
        "is_public_profile_approved",
        "public_profile_status",
        "public_appellation",
        "public_title",
        "team_display_order",
        "is_staff",
    )
    list_filter = (
        "role",
        "profil_mentorat",
        "statut_compte",
        "niveau_academique",
        "wants_to_appear_on_team_page",
        "is_team_approved",
        "can_appear_on_about_page",
        "pending_public_validation",
        "is_public_profile_approved",
        "public_profile_status",
    )
    search_fields = ("email", "nom", "prenom")
    ordering = ("email",)
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Identite", {"fields": ("nom", "prenom", "telephone", "langue_preferee", "region")}),
        (
            "Mentorat",
            {
                "fields": (
                    "niveau_academique",
                    "profil_mentorat",
                    "disponibilite",
                    "objectifs",
                    "mini_bio",
                    "profile_photo",
                    "domaine_specialite",
                    "wants_to_appear_on_team_page",
                    "is_team_approved",
                    "team_display_order",
                    "can_appear_on_about_page",
                    "pending_public_validation",
                    "is_public_profile_approved",
                    "public_profile_status",
                    "public_profile_updated_at",
                    "public_appellation",
                    "public_title",
                    "public_description",
                    "public_photo",
                    "approved_public_appellation",
                    "approved_public_prenom",
                    "approved_public_nom",
                    "approved_public_title",
                    "approved_public_description",
                    "approved_public_photo",
                    "capacite_mentorat",
                    "nombre_mentores_actuels",
                )
            },
        ),
        ("Administration", {"fields": ("role", "statut_compte", "cree_par")}),
        ("Permissions Django", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Dates", {"fields": ("last_login", "date_creation")}),
    )
    readonly_fields = ("date_creation", "nombre_mentores_actuels", "public_profile_updated_at")
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "nom", "prenom", "password1", "password2", "role", "is_staff", "is_superuser"),
            },
        ),
    )
