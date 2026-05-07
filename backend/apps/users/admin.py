from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from apps.users.models import NiveauAcademique, Role, Utilisateur


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("nom", "description")
    search_fields = ("nom",)


@admin.register(NiveauAcademique)
class NiveauAcademiqueAdmin(admin.ModelAdmin):
    list_display = ("nom", "ordre_niveau", "est_premier_niveau", "est_dernier_niveau")
    list_editable = ("ordre_niveau", "est_premier_niveau", "est_dernier_niveau")
    ordering = ("ordre_niveau",)


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
        "is_staff",
    )
    list_filter = ("role", "profil_mentorat", "statut_compte", "niveau_academique")
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
                    "capacite_mentorat",
                    "nombre_mentores_actuels",
                )
            },
        ),
        ("Administration", {"fields": ("role", "statut_compte", "cree_par")}),
        ("Permissions Django", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Dates", {"fields": ("last_login", "date_creation")}),
    )
    readonly_fields = ("date_creation", "nombre_mentores_actuels")
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "nom", "prenom", "password1", "password2", "role", "is_staff", "is_superuser"),
            },
        ),
    )
