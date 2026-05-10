from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers

from apps.mentorat.models import (
    MentorAvailability,
    MentorAvailabilityException,
    MentorProfile,
    MentoreeProgress,
    Mentorat,
    MentorshipAssignment,
    MentorshipPeriod,
    MentorshipSession,
    SessionBooking,
)
from apps.mentorat.services import generate_available_slots
from apps.users.models import Utilisateur
from apps.users.serializers import UtilisateurLiteSerializer


class MentoratSerializer(serializers.ModelSerializer):
    mentor_detail = UtilisateurLiteSerializer(source="mentor", read_only=True)
    mentore_detail = UtilisateurLiteSerializer(source="mentore", read_only=True)

    class Meta:
        model = Mentorat
        fields = [
            "id",
            "mentor",
            "mentor_detail",
            "mentore",
            "mentore_detail",
            "date_jumelage",
            "statut_jumelage",
        ]
        read_only_fields = ["date_jumelage"]

    def validate(self, attrs):
        data = {
            "mentor": attrs.get("mentor", getattr(self.instance, "mentor", None)),
            "mentore": attrs.get("mentore", getattr(self.instance, "mentore", None)),
            "statut_jumelage": attrs.get(
                "statut_jumelage",
                getattr(self.instance, "statut_jumelage", Mentorat.StatutJumelage.ACTIF),
            ),
        }
        instance = Mentorat(**data)
        if self.instance:
            instance.pk = self.instance.pk
        try:
            instance.clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict if hasattr(exc, "message_dict") else exc.messages)
        return attrs


class MentorProfileSerializer(serializers.ModelSerializer):
    mentor_detail = UtilisateurLiteSerializer(source="mentor", read_only=True)

    class Meta:
        model = MentorProfile
        fields = [
            "id",
            "mentor",
            "mentor_detail",
            "max_mentores",
            "max_sessions_per_week",
            "default_session_duration",
            "date_creation",
            "date_modification",
        ]
        read_only_fields = ["mentor", "date_creation", "date_modification"]

    def validate(self, attrs):
        mentor = self.context["request"].user
        instance = MentorProfile(
            mentor=mentor,
            max_mentores=attrs.get("max_mentores", getattr(self.instance, "max_mentores", 5)),
            max_sessions_per_week=attrs.get(
                "max_sessions_per_week",
                getattr(self.instance, "max_sessions_per_week", 3),
            ),
            default_session_duration=attrs.get(
                "default_session_duration",
                getattr(self.instance, "default_session_duration", MentorProfile.SessionDuration.MIN_60),
            ),
        )
        if self.instance:
            instance.pk = self.instance.pk
        try:
            instance.clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict if hasattr(exc, "message_dict") else exc.messages)
        return attrs


class MentorAvailabilitySerializer(serializers.ModelSerializer):
    weekday_label = serializers.CharField(source="get_weekday_display", read_only=True)

    class Meta:
        model = MentorAvailability
        fields = [
            "id",
            "mentor",
            "weekday",
            "weekday_label",
            "start_time",
            "end_time",
            "is_active",
            "date_creation",
            "date_modification",
        ]
        read_only_fields = ["mentor", "date_creation", "date_modification"]

    def validate(self, attrs):
        mentor = self.context["request"].user
        instance = MentorAvailability(
            mentor=mentor,
            weekday=attrs.get("weekday", getattr(self.instance, "weekday", None)),
            start_time=attrs.get("start_time", getattr(self.instance, "start_time", None)),
            end_time=attrs.get("end_time", getattr(self.instance, "end_time", None)),
            is_active=attrs.get("is_active", getattr(self.instance, "is_active", True)),
        )
        if self.instance:
            instance.pk = self.instance.pk
        try:
            instance.clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict if hasattr(exc, "message_dict") else exc.messages)
        return attrs


class MentorAvailabilityExceptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = MentorAvailabilityException
        fields = ["id", "mentor", "start_date", "end_date", "reason", "date_creation"]
        read_only_fields = ["mentor", "date_creation"]

    def validate(self, attrs):
        mentor = self.context["request"].user
        instance = MentorAvailabilityException(
            mentor=mentor,
            start_date=attrs.get("start_date", getattr(self.instance, "start_date", None)),
            end_date=attrs.get("end_date", getattr(self.instance, "end_date", None)),
            reason=attrs.get("reason", getattr(self.instance, "reason", "")),
        )
        if self.instance:
            instance.pk = self.instance.pk
        try:
            instance.clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict if hasattr(exc, "message_dict") else exc.messages)
        return attrs


class AvailableSlotQuerySerializer(serializers.Serializer):
    start_date = serializers.DateField()
    end_date = serializers.DateField()


class AvailableSlotSerializer(serializers.Serializer):
    mentor = serializers.IntegerField()
    starts_at = serializers.DateTimeField()
    ends_at = serializers.DateTimeField()
    duration_minutes = serializers.IntegerField()


class SessionBookingSerializer(serializers.ModelSerializer):
    mentor_detail = UtilisateurLiteSerializer(source="mentor", read_only=True)
    mentore_detail = UtilisateurLiteSerializer(source="mentore", read_only=True)

    class Meta:
        model = SessionBooking
        fields = [
            "id",
            "mentor",
            "mentor_detail",
            "mentore",
            "mentore_detail",
            "starts_at",
            "ends_at",
            "status",
            "created_at",
        ]
        read_only_fields = ["mentore", "status", "created_at"]

    def validate(self, attrs):
        request = self.context["request"]
        mentor = attrs.get("mentor", getattr(self.instance, "mentor", None))
        mentore = getattr(self.instance, "mentore", None) or request.user
        starts_at = attrs.get("starts_at", getattr(self.instance, "starts_at", None))
        ends_at = attrs.get("ends_at", getattr(self.instance, "ends_at", None))
        status = attrs.get("status", getattr(self.instance, "status", SessionBooking.Status.PENDING))

        instance = SessionBooking(
            mentor=mentor,
            mentore=mentore,
            starts_at=starts_at,
            ends_at=ends_at,
            status=status,
        )
        if self.instance:
            instance.pk = self.instance.pk
        try:
            instance.clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict if hasattr(exc, "message_dict") else exc.messages)
        return attrs


class BookingCreateSerializer(SessionBookingSerializer):
    class Meta(SessionBookingSerializer.Meta):
        read_only_fields = ["mentore", "status", "created_at"]

    def validate(self, attrs):
        mentor = attrs.get("mentor")
        starts_at = attrs.get("starts_at")
        ends_at = attrs.get("ends_at")
        if mentor and starts_at and ends_at:
            slot_date = timezone.localtime(starts_at).date()
            slots = generate_available_slots(mentor, slot_date, slot_date, self.context["request"].user)
            slot_exists = any(slot["starts_at"] == starts_at and slot["ends_at"] == ends_at for slot in slots)
            if not slot_exists:
                raise serializers.ValidationError({"starts_at": "Ce creneau n'est plus disponible."})
        return super().validate(attrs)

    def create(self, validated_data):
        return SessionBooking.objects.create(mentore=self.context["request"].user, **validated_data)


class AvailableSlotsRequestSerializer(AvailableSlotQuerySerializer):
    mentor_id = serializers.IntegerField()

    def validate_mentor_id(self, value):
        return get_object_or_404(
            Utilisateur.objects.filter(
                profil_mentorat__in=[
                    Utilisateur.ProfilMentorat.MENTOR,
                    Utilisateur.ProfilMentorat.MENTOR_ET_MENTORE,
                ]
            ),
            pk=value,
        ).id


def _raise_drf_validation(exc: DjangoValidationError):
    raise serializers.ValidationError(exc.message_dict if hasattr(exc, "message_dict") else exc.messages)


class CleanModelSerializer(serializers.ModelSerializer):
    def create(self, validated_data):
        try:
            return super().create(validated_data)
        except DjangoValidationError as exc:
            _raise_drf_validation(exc)

    def update(self, instance, validated_data):
        try:
            return super().update(instance, validated_data)
        except DjangoValidationError as exc:
            _raise_drf_validation(exc)


class MentorshipPeriodSerializer(CleanModelSerializer):
    assignments_count = serializers.IntegerField(read_only=True)
    sessions_count = serializers.IntegerField(read_only=True)
    completed_sessions_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = MentorshipPeriod
        fields = [
            "id",
            "title",
            "description",
            "start_date",
            "end_date",
            "required_sessions",
            "status",
            "assignments_count",
            "sessions_count",
            "completed_sessions_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate(self, attrs):
        instance = MentorshipPeriod(
            title=attrs.get("title", getattr(self.instance, "title", "")),
            description=attrs.get("description", getattr(self.instance, "description", "")),
            start_date=attrs.get("start_date", getattr(self.instance, "start_date", None)),
            end_date=attrs.get("end_date", getattr(self.instance, "end_date", None)),
            required_sessions=attrs.get(
                "required_sessions",
                getattr(self.instance, "required_sessions", None),
            ),
            status=attrs.get("status", getattr(self.instance, "status", MentorshipPeriod.Status.DRAFT)),
        )
        if self.instance:
            instance.pk = self.instance.pk
        try:
            instance.clean()
        except DjangoValidationError as exc:
            _raise_drf_validation(exc)
        return attrs


class MentorshipAssignmentSerializer(CleanModelSerializer):
    mentor_detail = UtilisateurLiteSerializer(source="mentor", read_only=True)
    mentoree_detail = UtilisateurLiteSerializer(source="mentoree", read_only=True)
    period_detail = MentorshipPeriodSerializer(source="period", read_only=True)
    required_sessions = serializers.IntegerField(source="period.required_sessions", read_only=True)
    scheduled_sessions_count = serializers.SerializerMethodField()
    completed_sessions_count = serializers.SerializerMethodField()
    remaining_sessions_count = serializers.SerializerMethodField()
    missing_sessions_count = serializers.SerializerMethodField()

    class Meta:
        model = MentorshipAssignment
        fields = [
            "id",
            "mentor",
            "mentor_detail",
            "mentoree",
            "mentoree_detail",
            "period",
            "period_detail",
            "required_sessions",
            "status",
            "admin_notes",
            "scheduled_sessions_count",
            "completed_sessions_count",
            "remaining_sessions_count",
            "missing_sessions_count",
            "assigned_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["assigned_at", "created_at", "updated_at"]

    def get_scheduled_sessions_count(self, obj: MentorshipAssignment) -> int:
        return obj.sessions.count()

    def get_completed_sessions_count(self, obj: MentorshipAssignment) -> int:
        return obj.sessions.filter(status=MentorshipSession.Status.COMPLETED).count()

    def get_remaining_sessions_count(self, obj: MentorshipAssignment) -> int:
        return max(obj.period.required_sessions - self.get_completed_sessions_count(obj), 0)

    def get_missing_sessions_count(self, obj: MentorshipAssignment) -> int:
        return max(obj.period.required_sessions - self.get_scheduled_sessions_count(obj), 0)

    def validate(self, attrs):
        instance = MentorshipAssignment(
            mentor=attrs.get("mentor", getattr(self.instance, "mentor", None)),
            mentoree=attrs.get("mentoree", getattr(self.instance, "mentoree", None)),
            period=attrs.get("period", getattr(self.instance, "period", None)),
            status=attrs.get("status", getattr(self.instance, "status", MentorshipAssignment.Status.ACTIVE)),
            admin_notes=attrs.get("admin_notes", getattr(self.instance, "admin_notes", "")),
        )
        if self.instance:
            instance.pk = self.instance.pk
            instance.assigned_at = self.instance.assigned_at
        try:
            instance.clean()
        except DjangoValidationError as exc:
            _raise_drf_validation(exc)
        return attrs


class MentorshipSessionSerializer(CleanModelSerializer):
    mentor_detail = UtilisateurLiteSerializer(source="assignment.mentor", read_only=True)
    mentoree_detail = UtilisateurLiteSerializer(source="assignment.mentoree", read_only=True)
    period_detail = MentorshipPeriodSerializer(source="assignment.period", read_only=True)

    class Meta:
        model = MentorshipSession
        fields = [
            "id",
            "assignment",
            "mentor_detail",
            "mentoree_detail",
            "period_detail",
            "session_number",
            "scheduled_date",
            "start_time",
            "end_time",
            "status",
            "summary",
            "mentor_comment",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate(self, attrs):
        instance = MentorshipSession(
            assignment=attrs.get("assignment", getattr(self.instance, "assignment", None)),
            session_number=attrs.get("session_number", getattr(self.instance, "session_number", None)),
            scheduled_date=attrs.get("scheduled_date", getattr(self.instance, "scheduled_date", None)),
            start_time=attrs.get("start_time", getattr(self.instance, "start_time", None)),
            end_time=attrs.get("end_time", getattr(self.instance, "end_time", None)),
            status=attrs.get("status", getattr(self.instance, "status", MentorshipSession.Status.SCHEDULED)),
            summary=attrs.get("summary", getattr(self.instance, "summary", "")),
            mentor_comment=attrs.get("mentor_comment", getattr(self.instance, "mentor_comment", "")),
        )
        if self.instance:
            instance.pk = self.instance.pk
        try:
            instance.clean()
        except DjangoValidationError as exc:
            _raise_drf_validation(exc)
        return attrs


class MentoreeProgressSerializer(CleanModelSerializer):
    mentor_detail = UtilisateurLiteSerializer(source="assignment.mentor", read_only=True)
    mentoree_detail = UtilisateurLiteSerializer(source="assignment.mentoree", read_only=True)
    period_detail = MentorshipPeriodSerializer(source="assignment.period", read_only=True)

    class Meta:
        model = MentoreeProgress
        fields = [
            "id",
            "assignment",
            "mentor_detail",
            "mentoree_detail",
            "period_detail",
            "progress_status",
            "progress_percentage",
            "difficulties",
            "achievements",
            "recommendations",
            "mentor_opinion",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]

    def validate(self, attrs):
        instance = MentoreeProgress(
            assignment=attrs.get("assignment", getattr(self.instance, "assignment", None)),
            progress_status=attrs.get(
                "progress_status",
                getattr(self.instance, "progress_status", MentoreeProgress.ProgressStatus.AVERAGE),
            ),
            progress_percentage=attrs.get(
                "progress_percentage",
                getattr(self.instance, "progress_percentage", None),
            ),
            difficulties=attrs.get("difficulties", getattr(self.instance, "difficulties", "")),
            achievements=attrs.get("achievements", getattr(self.instance, "achievements", "")),
            recommendations=attrs.get("recommendations", getattr(self.instance, "recommendations", "")),
            mentor_opinion=attrs.get("mentor_opinion", getattr(self.instance, "mentor_opinion", "")),
        )
        if self.instance:
            instance.pk = self.instance.pk
        try:
            instance.clean()
        except DjangoValidationError as exc:
            _raise_drf_validation(exc)
        return attrs
