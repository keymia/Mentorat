from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers

from apps.mentorat.models import (
    MentorAvailability,
    MentorAvailabilityException,
    MentorProfile,
    Mentorat,
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
