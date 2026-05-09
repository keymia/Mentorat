from django.contrib import admin

from apps.evenements.models import Evenement, Participation


@admin.register(Evenement)
class EvenementAdmin(admin.ModelAdmin):
    list_display = (
        "titre",
        "date_evenement",
        "heure_evenement",
        "type_evenement",
        "statut_evenement",
        "image",
        "video",
    )
    list_filter = ("type_evenement", "statut_evenement")
    search_fields = ("titre", "description", "lieu")


@admin.register(Participation)
class ParticipationAdmin(admin.ModelAdmin):
    list_display = ("utilisateur", "evenement", "statut_participation", "date_reponse")
    list_filter = ("statut_participation",)
    search_fields = ("utilisateur__email", "evenement__titre")
