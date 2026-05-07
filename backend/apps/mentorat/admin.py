from django.contrib import admin

from apps.mentorat.models import Mentorat


@admin.register(Mentorat)
class MentoratAdmin(admin.ModelAdmin):
    list_display = ("mentor", "mentore", "statut_jumelage", "date_jumelage")
    list_filter = ("statut_jumelage",)
    search_fields = ("mentor__email", "mentore__email", "mentor__nom", "mentore__nom")
