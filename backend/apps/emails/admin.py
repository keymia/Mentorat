from django.contrib import admin

from apps.emails.models import EmailAutomatique


@admin.register(EmailAutomatique)
class EmailAutomatiqueAdmin(admin.ModelAdmin):
    list_display = ("utilisateur", "type_email", "statut_envoi", "date_envoi")
    list_filter = ("type_email", "statut_envoi")
    search_fields = ("utilisateur__email", "sujet_fr", "sujet_en")
