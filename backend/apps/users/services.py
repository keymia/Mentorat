from django.core.exceptions import ValidationError
from django.db import transaction

from apps.inscriptions.models import Inscription
from apps.mentorat.models import (
    MentorAvailability,
    Mentorat,
    MentorshipAssignment,
    SessionBooking,
)
from apps.users.models import Role, Utilisateur


@transaction.atomic
def deactivate_mentor_and_release_mentees(mentor: Utilisateur) -> dict[str, int]:
    if not mentor.est_mentor:
        raise ValidationError("Ce compte n'a pas de profil mentor.")

    active_assignments = MentorshipAssignment.objects.select_for_update().filter(
        mentor=mentor,
        status=MentorshipAssignment.Status.ACTIVE,
    )
    assignment_pairs = list(active_assignments.values_list("mentoree_id", "period_id"))
    suspended_assignments = active_assignments.update(status=MentorshipAssignment.Status.SUSPENDED)

    released_inscriptions = 0
    for mentoree_id, period_id in assignment_pairs:
        released_inscriptions += Inscription.objects.filter(
            utilisateur_id=mentoree_id,
            mentorship_period_id=period_id,
            type_inscription=Inscription.TypeInscription.MENTORE,
        ).update(
            mentor_choisi=None,
            needs_matching=True,
            wants_association_assignment=True,
            registration_status=Inscription.RegistrationStatus.PENDING_MATCHING,
        )

    suspended_legacy = Mentorat.objects.filter(
        mentor=mentor,
        statut_jumelage=Mentorat.StatutJumelage.ACTIF,
    ).update(statut_jumelage=Mentorat.StatutJumelage.SUSPENDU)

    cancelled_bookings = SessionBooking.objects.filter(
        mentor=mentor,
        status__in=SessionBooking.BLOCKING_STATUSES,
    ).update(status=SessionBooking.Status.CANCELLED)

    disabled_availabilities = MentorAvailability.objects.filter(mentor=mentor, is_active=True).update(is_active=False)

    if mentor.profil_mentorat == Utilisateur.ProfilMentorat.MENTOR_ET_MENTORE:
        mentor.profil_mentorat = Utilisateur.ProfilMentorat.MENTORE
        mentor.role = Role.objects.filter(nom=Role.Nom.MENTORE).first()
        update_fields = ["profil_mentorat", "role", "nombre_mentores_actuels"]
    else:
        mentor.profil_mentorat = None
        mentor.role = None
        mentor.statut_compte = Utilisateur.StatutCompte.INACTIF
        mentor.is_active = False
        mentor.wants_to_appear_on_team_page = False
        mentor.is_team_approved = False
        mentor.team_display_order = 0
        update_fields = [
            "profil_mentorat",
            "role",
            "statut_compte",
            "is_active",
            "wants_to_appear_on_team_page",
            "is_team_approved",
            "team_display_order",
            "nombre_mentores_actuels",
        ]

    mentor.nombre_mentores_actuels = 0
    mentor.save(update_fields=update_fields)

    return {
        "suspended_assignments": suspended_assignments,
        "released_inscriptions": released_inscriptions,
        "suspended_legacy_mentorats": suspended_legacy,
        "cancelled_bookings": cancelled_bookings,
        "disabled_availabilities": disabled_availabilities,
    }


@transaction.atomic
def delete_mentee_with_related_data(mentee: Utilisateur) -> dict[str, int]:
    if not mentee.est_mentore:
        raise ValidationError("Ce compte n'a pas de profil mentore.")

    if mentee.est_mentor and mentee.mentorship_assignments_as_mentor.exists():
        raise ValidationError(
            "Ce profil est aussi mentor avec des mentores. Reassignez ses mentores ou supprimez d'abord son role mentor."
        )

    deleted_summary = mentee.delete()
    return {"deleted_objects": deleted_summary[0]}
