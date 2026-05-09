from datetime import date, datetime, time, timedelta

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Q
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
from apps.parametres.models import ParametreSysteme
from apps.users.models import NiveauAcademique, Utilisateur


MAX_SLOT_RANGE_DAYS = 120


def get_mentors_disponibles_for_niveau(niveau_id):
    niveau = get_object_or_404(NiveauAcademique, pk=niveau_id)
    ordre_mentor = niveau.ordre_niveau + 1
    candidats = (
        Utilisateur.objects.select_related("role", "niveau_academique")
        .filter(
            Q(profil_mentorat=Utilisateur.ProfilMentorat.MENTOR)
            | Q(profil_mentorat=Utilisateur.ProfilMentorat.MENTOR_ET_MENTORE),
            statut_compte=Utilisateur.StatutCompte.ACTIF,
            is_active=True,
            niveau_academique__ordre_niveau=ordre_mentor,
        )
        .order_by("nom", "prenom")
    )
    return [mentor for mentor in candidats if mentor.capacite_restante() > 0]


def validate_mentor_for_mentore_level(mentor: Utilisateur, niveau_mentore: NiveauAcademique):
    if not mentor.est_mentor:
        raise serializers.ValidationError({"mentor_choisi": "Le mentor choisi n'a pas un profil mentor."})
    if mentor.statut_compte != Utilisateur.StatutCompte.ACTIF:
        raise serializers.ValidationError({"mentor_choisi": "Le mentor choisi n'est pas actif."})
    if not mentor.niveau_academique_id:
        raise serializers.ValidationError({"mentor_choisi": "Le mentor choisi n'a pas de niveau academique."})
    if mentor.niveau_academique.ordre_niveau != niveau_mentore.ordre_niveau + 1:
        raise serializers.ValidationError(
            {"mentor_choisi": "Le mentor choisi doit etre au niveau superieur direct."}
        )
    if mentor.capacite_restante() <= 0:
        raise serializers.ValidationError({"mentor_choisi": "Le mentor choisi n'a plus de capacite disponible."})


def get_or_create_mentor_profile(mentor: Utilisateur) -> MentorProfile:
    default_capacity = mentor.capacite_effective() if mentor.capacite_mentorat else 5
    profile, _ = MentorProfile.objects.get_or_create(
        mentor=mentor,
        defaults={
            "max_mentores": max(default_capacity, 1),
            "max_sessions_per_week": 3,
            "default_session_duration": MentorProfile.SessionDuration.MIN_60,
        },
    )
    return profile


def mentor_has_mentee_capacity(
    mentor: Utilisateur,
    profile: MentorProfile | None = None,
    mentore: Utilisateur | None = None,
) -> bool:
    profile = profile or get_or_create_mentor_profile(mentor)
    active_mentore_queryset = Mentorat.objects.filter(
        mentor=mentor,
        statut_jumelage=Mentorat.StatutJumelage.ACTIF,
    )
    if mentore and active_mentore_queryset.filter(mentore=mentore).exists():
        return True

    active_mentore_count = active_mentore_queryset.count()
    system_limit = ParametreSysteme.get_int("MAX_MENTORES_PAR_MENTOR", 5)
    effective_capacity = min(profile.max_mentores, system_limit)
    return active_mentore_count < effective_capacity


def get_week_bounds(value: date) -> tuple[datetime, datetime]:
    week_start = value - timedelta(days=value.weekday())
    week_end = week_start + timedelta(days=7)
    tz = timezone.get_current_timezone()
    starts_at = timezone.make_aware(datetime.combine(week_start, time.min), tz)
    ends_at = timezone.make_aware(datetime.combine(week_end, time.min), tz)
    return starts_at, ends_at


def count_blocking_bookings_for_week(mentor: Utilisateur, value: date, exclude_booking_id: int | None = None) -> int:
    week_start, week_end = get_week_bounds(value)
    queryset = SessionBooking.objects.filter(
        mentor=mentor,
        status__in=SessionBooking.BLOCKING_STATUSES,
        starts_at__gte=week_start,
        starts_at__lt=week_end,
    )
    if exclude_booking_id:
        queryset = queryset.exclude(pk=exclude_booking_id)
    return queryset.count()


def has_exception_for_date(mentor: Utilisateur, value: date) -> bool:
    return MentorAvailabilityException.objects.filter(
        mentor=mentor,
        start_date__lte=value,
        end_date__gte=value,
    ).exists()


def overlaps_blocking_booking(
    mentor: Utilisateur,
    starts_at: datetime,
    ends_at: datetime,
    exclude_booking_id: int | None = None,
) -> bool:
    queryset = SessionBooking.objects.filter(
        mentor=mentor,
        status__in=SessionBooking.BLOCKING_STATUSES,
        starts_at__lt=ends_at,
        ends_at__gt=starts_at,
    )
    if exclude_booking_id:
        queryset = queryset.exclude(pk=exclude_booking_id)
    return queryset.exists()


def slot_is_inside_recurring_availability(mentor: Utilisateur, starts_at: datetime, ends_at: datetime) -> bool:
    local_start = timezone.localtime(starts_at)
    local_end = timezone.localtime(ends_at)
    if local_start.date() != local_end.date():
        return False

    return MentorAvailability.objects.filter(
        mentor=mentor,
        is_active=True,
        weekday=local_start.weekday(),
        start_time__lte=local_start.time(),
        end_time__gte=local_end.time(),
    ).exists()


def validate_slot_range(start_date: date, end_date: date):
    if start_date > end_date:
        raise serializers.ValidationError(
            {"end_date": "La date de fin doit etre posterieure ou egale a la date de debut."}
        )
    if (end_date - start_date).days > MAX_SLOT_RANGE_DAYS:
        raise serializers.ValidationError(
            {"end_date": f"La periode demandee ne doit pas depasser {MAX_SLOT_RANGE_DAYS} jours."}
        )


def generate_available_slots(
    mentor: Utilisateur,
    start_date: date,
    end_date: date,
    mentore: Utilisateur | None = None,
) -> list[dict]:
    validate_slot_range(start_date, end_date)
    profile = get_or_create_mentor_profile(mentor)
    if not mentor.est_mentor or not mentor_has_mentee_capacity(mentor, profile, mentore):
        return []

    duration = timedelta(minutes=profile.default_session_duration)
    tz = timezone.get_current_timezone()
    blocking_bookings = list(
        SessionBooking.objects.filter(
            mentor=mentor,
            status__in=SessionBooking.BLOCKING_STATUSES,
            starts_at__date__lte=end_date,
            ends_at__date__gte=start_date,
        )
    )
    weekly_counts: dict[date, int] = {}
    slots: list[dict] = []
    current_date = start_date

    while current_date <= end_date:
        if has_exception_for_date(mentor, current_date):
            current_date += timedelta(days=1)
            continue

        week_start = current_date - timedelta(days=current_date.weekday())
        if week_start not in weekly_counts:
            weekly_counts[week_start] = count_blocking_bookings_for_week(mentor, current_date)
        if weekly_counts[week_start] >= profile.max_sessions_per_week:
            current_date += timedelta(days=1)
            continue

        availabilities = MentorAvailability.objects.filter(
            mentor=mentor,
            weekday=current_date.weekday(),
            is_active=True,
        ).order_by("start_time")
        for availability in availabilities:
            cursor = timezone.make_aware(datetime.combine(current_date, availability.start_time), tz)
            availability_end = timezone.make_aware(datetime.combine(current_date, availability.end_time), tz)
            while cursor + duration <= availability_end:
                slot_end = cursor + duration
                overlaps = any(
                    booking.starts_at < slot_end and booking.ends_at > cursor for booking in blocking_bookings
                )
                if not overlaps and weekly_counts[week_start] < profile.max_sessions_per_week:
                    slots.append(
                        {
                            "mentor": mentor.id,
                            "starts_at": cursor,
                            "ends_at": slot_end,
                            "duration_minutes": profile.default_session_duration,
                        }
                    )
                cursor = slot_end
        current_date += timedelta(days=1)

    return slots


def validate_session_booking(booking: SessionBooking):
    if not booking.mentor.est_mentor:
        raise DjangoValidationError({"mentor": "L'utilisateur selectionne n'a pas un profil mentor."})
    if booking.mentor.statut_compte != Utilisateur.StatutCompte.ACTIF:
        raise DjangoValidationError({"mentor": "Le mentor doit etre actif."})
    if not booking.mentore.est_mentore:
        raise DjangoValidationError({"mentore": "L'utilisateur selectionne n'a pas un profil mentore."})
    if not booking.mentor.niveau_academique_id or not booking.mentore.niveau_academique_id:
        raise DjangoValidationError("Le mentor et le mentore doivent avoir un niveau academique.")
    if booking.mentor.niveau_academique.ordre_niveau != booking.mentore.niveau_academique.ordre_niveau + 1:
        raise DjangoValidationError({"mentor": "Le mentor doit etre au niveau academique superieur direct."})

    profile = get_or_create_mentor_profile(booking.mentor)
    if not mentor_has_mentee_capacity(booking.mentor, profile, booking.mentore):
        raise DjangoValidationError({"mentor": "Le mentor a atteint sa capacite maximale de mentores."})
    local_start = timezone.localtime(booking.starts_at)
    local_end = timezone.localtime(booking.ends_at)

    if has_exception_for_date(booking.mentor, local_start.date()):
        raise DjangoValidationError({"starts_at": "Le mentor est indisponible a cette date."})
    if not slot_is_inside_recurring_availability(booking.mentor, booking.starts_at, booking.ends_at):
        raise DjangoValidationError({"starts_at": "Ce creneau est hors des disponibilites du mentor."})
    if overlaps_blocking_booking(booking.mentor, booking.starts_at, booking.ends_at, booking.pk):
        raise DjangoValidationError({"starts_at": "Ce creneau chevauche deja une reservation."})
    week_count = count_blocking_bookings_for_week(booking.mentor, local_start.date(), booking.pk)
    if week_count >= profile.max_sessions_per_week:
        raise DjangoValidationError(
            {"mentor": "Le mentor a atteint son nombre maximal de seances pour cette semaine."}
        )
    if local_start.date() != local_end.date():
        raise DjangoValidationError({"ends_at": "Une seance doit commencer et terminer le meme jour."})
