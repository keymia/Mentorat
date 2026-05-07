from django.contrib import admin

from apps.parametres.models import ParametreSysteme


@admin.register(ParametreSysteme)
class ParametreSystemeAdmin(admin.ModelAdmin):
    list_display = ("cle", "valeur", "description")
    search_fields = ("cle", "description")
