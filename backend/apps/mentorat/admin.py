from django.contrib import admin

from apps.mentorat.models import (
    MentorAvailability,
    MentorAvailabilityException,
    MentorProfile,
    Mentorat,
    SessionBooking,
)


@admin.register(Mentorat)
class MentoratAdmin(admin.ModelAdmin):
    list_display = ("mentor", "mentore", "statut_jumelage", "date_jumelage")
    list_filter = ("statut_jumelage",)
    search_fields = ("mentor__email", "mentore__email", "mentor__nom", "mentore__nom")


@admin.register(MentorProfile)
class MentorProfileAdmin(admin.ModelAdmin):
    list_display = ("mentor", "max_mentores", "max_sessions_per_week", "default_session_duration")
    list_filter = ("default_session_duration",)
    search_fields = ("mentor__email", "mentor__nom", "mentor__prenom")


@admin.register(MentorAvailability)
class MentorAvailabilityAdmin(admin.ModelAdmin):
    list_display = ("mentor", "weekday", "start_time", "end_time", "is_active")
    list_filter = ("weekday", "is_active")
    search_fields = ("mentor__email", "mentor__nom", "mentor__prenom")


@admin.register(MentorAvailabilityException)
class MentorAvailabilityExceptionAdmin(admin.ModelAdmin):
    list_display = ("mentor", "start_date", "end_date", "reason")
    list_filter = ("start_date", "end_date")
    search_fields = ("mentor__email", "mentor__nom", "mentor__prenom", "reason")


@admin.register(SessionBooking)
class SessionBookingAdmin(admin.ModelAdmin):
    list_display = ("mentor", "mentore", "starts_at", "ends_at", "status", "created_at")
    list_filter = ("status", "starts_at")
    search_fields = ("mentor__email", "mentore__email", "mentor__nom", "mentore__nom")
