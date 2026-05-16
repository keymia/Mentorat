from django.contrib import admin

from apps.mentorat.models import (
    MentorAvailability,
    MentorAvailabilityException,
    MentorProfile,
    MentoreeProgress,
    Mentorat,
    MentorshipAssignment,
    MentorshipPeriod,
    MentorshipPeriodExportLog,
    MentorshipSession,
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


@admin.register(MentorshipPeriod)
class MentorshipPeriodAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "start_date",
        "end_date",
        "required_sessions",
        "max_mentees_per_mentor",
        "status",
        "updated_at",
    )
    list_filter = ("status", "start_date", "end_date")
    search_fields = ("title", "description")


@admin.register(MentorshipPeriodExportLog)
class MentorshipPeriodExportLogAdmin(admin.ModelAdmin):
    list_display = ("period", "format", "file_name", "exported_by", "exported_at")
    list_filter = ("format", "exported_at", "period")
    search_fields = ("period__title", "file_name", "exported_by__email")
    autocomplete_fields = ("period", "exported_by")


@admin.register(MentorshipAssignment)
class MentorshipAssignmentAdmin(admin.ModelAdmin):
    list_display = ("mentor", "mentoree", "period", "status", "assigned_at")
    list_filter = ("period", "status", "assigned_at")
    search_fields = ("mentor__email", "mentoree__email", "mentor__nom", "mentoree__nom", "admin_notes")
    autocomplete_fields = ("mentor", "mentoree", "period")


@admin.register(MentorshipSession)
class MentorshipSessionAdmin(admin.ModelAdmin):
    list_display = ("assignment", "session_number", "scheduled_date", "start_time", "end_time", "status")
    list_filter = ("status", "scheduled_date", "assignment__period")
    search_fields = (
        "assignment__mentor__email",
        "assignment__mentoree__email",
        "summary",
        "mentor_comment",
    )
    autocomplete_fields = ("assignment",)


@admin.register(MentoreeProgress)
class MentoreeProgressAdmin(admin.ModelAdmin):
    list_display = ("assignment", "progress_status", "progress_percentage", "updated_at")
    list_filter = ("progress_status", "updated_at")
    search_fields = (
        "assignment__mentor__email",
        "assignment__mentoree__email",
        "difficulties",
        "achievements",
        "recommendations",
        "mentor_opinion",
    )
    autocomplete_fields = ("assignment",)
