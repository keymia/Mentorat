from django.contrib import admin

from apps.partenaires.models import Partenaire


@admin.register(Partenaire)
class PartenaireAdmin(admin.ModelAdmin):
    list_display = ("nom_partenaire", "type_partenaire", "ordre_affichage", "statut", "date_ajout")
    list_filter = ("type_partenaire", "statut")
    search_fields = ("nom_partenaire", "description")
    ordering = ("ordre_affichage", "nom_partenaire")
