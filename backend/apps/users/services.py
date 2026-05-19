from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from apps.inscriptions.models import Inscription
from apps.mentorat.models import Mentorat, MentorshipAssignment
from apps.users.models import Role, Utilisateur


@transaction.atomic
def deactivate_mentor_and_release_mentees(mentor: Utilisateur) -> dict[str, int]:
    if not mentor.est_mentor:
        raise ValidationError("L'utilisateur selectionne n'a pas de profil mentor.")

    active_assignments = (
        MentorshipAssignment.objects.select_for_update()
        .filter(mentor=mentor, status=MentorshipAssignment.Status.ACTIVE)
        .select_related("period", "mentoree")
    )
    assignment_ids = list(active_assignments.values_list("id", flat=True))
    mentoree_ids = list(active_assignments.values_list("mentoree_id", flat=True))
    period_ids = list(active_assignments.values_list("period_id", flat=True))

    suspended_assignments = active_assignments.update(
        status=MentorshipAssignment.Status.SUSPENDED,
        updated_at=timezone.now(),
    )

    released_inscriptions = 0
    if mentoree_ids:
        inscriptions = Inscription.objects.filter(
            utilisateur_id__in=mentoree_ids,
            type_inscription=Inscription.TypeInscription.MENTORE,
        )
        if period_ids:
            inscriptions = inscriptions.filter(mentorship_period_id__in=period_ids)
        released_inscriptions = inscriptions.update(
            mentor_choisi=None,
            wants_association_assignment=True,
            needs_matching=True,
            registration_status=Inscription.RegistrationStatus.PENDING_MATCHING,
        )

    suspended_legacy_mentorats = Mentorat.objects.filter(
        mentor=mentor,
        statut_jumelage=Mentorat.StatutJumelage.ACTIF,
    ).update(statut_jumelage=Mentorat.StatutJumelage.SUSPENDU)

    if mentor.profil_mentorat == Utilisateur.ProfilMentorat.MENTOR_ET_MENTORE:
        mentor_profile = Utilisateur.ProfilMentorat.MENTORE
        is_active = mentor.is_active
        statut_compte = mentor.statut_compte
        role = Role.objects.filter(nom=Role.Nom.MENTORE).first() or mentor.role
    else:
        mentor_profile = None
        is_active = False
        statut_compte = Utilisateur.StatutCompte.INACTIF
        role = mentor.role

    Utilisateur.objects.filter(pk=mentor.pk).update(
        profil_mentorat=mentor_profile,
        role_id=role.id if role else None,
        capacite_mentorat=0,
        nombre_mentores_actuels=0,
        is_active=is_active,
        statut_compte=statut_compte,
        wants_to_appear_on_team_page=False,
        is_team_approved=False,
    )

    for old_mentor_id in [mentor.pk]:
        MentorshipAssignment.actualiser_nombre_mentores(old_mentor_id)
        Mentorat.actualiser_nombre_mentores(old_mentor_id)

    return {
        "suspended_assignments": suspended_assignments,
        "released_mentees": len(set(mentoree_ids)),
        "released_inscriptions": released_inscriptions,
        "suspended_legacy_mentorats": suspended_legacy_mentorats,
        "assignment_ids": len(assignment_ids),
    }


@transaction.atomic
def delete_mentee_with_related_data(mentee: Utilisateur) -> dict[str, int]:
    if not mentee.est_mentore:
        raise ValidationError("L'utilisateur selectionne n'a pas de profil mentore.")

    assignments = MentorshipAssignment.objects.filter(mentoree=mentee)
    assignment_count = assignments.count()
    session_count = sum(assignment.sessions.count() for assignment in assignments)
    progress_count = sum(1 for assignment in assignments if hasattr(assignment, "progress"))
    inscription_count = Inscription.objects.filter(
        utilisateur=mentee,
        type_inscription=Inscription.TypeInscription.MENTORE,
    ).count()

    if mentee.profil_mentorat == Utilisateur.ProfilMentorat.MENTOR_ET_MENTORE:
        assignments.delete()
        Inscription.objects.filter(
            utilisateur=mentee,
            type_inscription=Inscription.TypeInscription.MENTORE,
        ).delete()
        Mentorat.objects.filter(mentore=mentee).delete()
        role = Role.objects.filter(nom=Role.Nom.MENTOR).first() or mentee.role
        Utilisateur.objects.filter(pk=mentee.pk).update(
            profil_mentorat=Utilisateur.ProfilMentorat.MENTOR,
            role_id=role.id if role else None,
        )
        deleted_user = 0
    else:
        mentee.delete()
        deleted_user = 1

    return {
        "deleted_user": deleted_user,
        "deleted_assignments": assignment_count,
        "deleted_sessions": session_count,
        "deleted_progress_records": progress_count,
        "deleted_inscriptions": inscription_count,
    }
