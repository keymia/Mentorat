from django.contrib import admin

from apps.inscriptions.models import Inscription


@admin.register(Inscription)
class InscriptionAdmin(admin.ModelAdmin):
    list_display = ("utilisateur", "type_inscription", "statut_inscription", "mentor_choisi", "date_inscription")
    list_filter = ("type_inscription", "statut_inscription")
    search_fields = ("utilisateur__email", "utilisateur__nom", "utilisateur__prenom")
