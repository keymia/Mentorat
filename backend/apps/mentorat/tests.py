from datetime import date, time

from django.core.exceptions import ValidationError
from django.test import TestCase
from rest_framework.test import APITestCase

from apps.mentorat.models import (
    MentoreeProgress,
    MentorshipAssignment,
    MentorshipPeriod,
    MentorshipSession,
)
from apps.users.models import NiveauAcademique, Role, Utilisateur


class MentorshipSetupMixin:
    def setUp(self):
        self.role_admin, _ = Role.objects.update_or_create(
            nom=Role.Nom.ADMIN_PRINCIPAL,
            defaults={"description": "Admin"},
        )
        self.role_mentor, _ = Role.objects.update_or_create(
            nom=Role.Nom.MENTOR,
            defaults={"description": "Mentor"},
        )
        self.role_mentore, _ = Role.objects.update_or_create(
            nom=Role.Nom.MENTORE,
            defaults={"description": "Mentore"},
        )
        self.level_mentoree, _ = NiveauAcademique.objects.update_or_create(
            ordre_niveau=1,
            defaults={
                "nom": "12e annee",
                "est_premier_niveau": True,
                "est_dernier_niveau": False,
            },
        )
        self.level_mentor, _ = NiveauAcademique.objects.update_or_create(
            ordre_niveau=2,
            defaults={
                "nom": "Niveau 1",
                "est_premier_niveau": False,
                "est_dernier_niveau": True,
            },
        )
        self.admin = Utilisateur.objects.create_user(
            email="admin@example.com",
            password="Testpass123!",
            nom="Admin",
            prenom="Awa",
            role=self.role_admin,
            statut_compte=Utilisateur.StatutCompte.ACTIF,
            is_active=True,
            is_staff=True,
            is_superuser=True,
        )
        self.mentor = Utilisateur.objects.create_user(
            email="mentor@example.com",
            password="Testpass123!",
            nom="Diop",
            prenom="Aminata",
            role=self.role_mentor,
            profil_mentorat=Utilisateur.ProfilMentorat.MENTOR,
            niveau_academique=self.level_mentor,
            statut_compte=Utilisateur.StatutCompte.ACTIF,
            is_active=True,
            capacite_mentorat=5,
        )
        self.other_mentor = Utilisateur.objects.create_user(
            email="other.mentor@example.com",
            password="Testpass123!",
            nom="Fall",
            prenom="Ibra",
            role=self.role_mentor,
            profil_mentorat=Utilisateur.ProfilMentorat.MENTOR,
            niveau_academique=self.level_mentor,
            statut_compte=Utilisateur.StatutCompte.ACTIF,
            is_active=True,
            capacite_mentorat=5,
        )
        self.mentoree = Utilisateur.objects.create_user(
            email="mentoree@example.com",
            password="Testpass123!",
            nom="Barry",
            prenom="Moussa",
            role=self.role_mentore,
            profil_mentorat=Utilisateur.ProfilMentorat.MENTORE,
            niveau_academique=self.level_mentoree,
            statut_compte=Utilisateur.StatutCompte.ACTIF,
            is_active=True,
        )
        self.period = MentorshipPeriod.objects.create(
            title="Session hiver 2026",
            description="Periode de test",
            start_date=date(2026, 1, 15),
            end_date=date(2026, 4, 30),
            required_sessions=8,
            status=MentorshipPeriod.Status.ACTIVE,
        )


class MentorshipModelTests(MentorshipSetupMixin, TestCase):
    def test_creation_periode_valide(self):
        period = MentorshipPeriod.objects.create(
            title="Session ete 2026",
            start_date=date(2026, 6, 1),
            end_date=date(2026, 8, 31),
            required_sessions=4,
            status=MentorshipPeriod.Status.DRAFT,
        )

        self.assertEqual(period.required_sessions, 4)
        self.assertEqual(period.status, MentorshipPeriod.Status.DRAFT)

    def test_refus_periode_avec_date_debut_apres_date_fin(self):
        with self.assertRaises(ValidationError):
            MentorshipPeriod.objects.create(
                title="Periode invalide",
                start_date=date(2026, 5, 1),
                end_date=date(2026, 4, 1),
                required_sessions=3,
            )

    def test_creation_affectation_mentor_mentore(self):
        assignment = MentorshipAssignment.objects.create(
            mentor=self.mentor,
            mentoree=self.mentoree,
            period=self.period,
        )

        self.assertEqual(assignment.status, MentorshipAssignment.Status.ACTIVE)
        self.mentor.refresh_from_db()
        self.assertEqual(self.mentor.nombre_mentores_actuels, 1)

    def test_refus_double_affectation_active_meme_periode(self):
        MentorshipAssignment.objects.create(
            mentor=self.mentor,
            mentoree=self.mentoree,
            period=self.period,
        )

        with self.assertRaises(ValidationError):
            MentorshipAssignment.objects.create(
                mentor=self.other_mentor,
                mentoree=self.mentoree,
                period=self.period,
            )

    def test_creation_seance_dans_la_periode(self):
        assignment = MentorshipAssignment.objects.create(
            mentor=self.mentor,
            mentoree=self.mentoree,
            period=self.period,
        )

        session = MentorshipSession.objects.create(
            assignment=assignment,
            session_number=1,
            scheduled_date=date(2026, 2, 10),
            start_time=time(17, 0),
            end_time=time(18, 0),
        )

        self.assertEqual(session.status, MentorshipSession.Status.SCHEDULED)

    def test_refus_seance_hors_periode(self):
        assignment = MentorshipAssignment.objects.create(
            mentor=self.mentor,
            mentoree=self.mentoree,
            period=self.period,
        )

        with self.assertRaises(ValidationError):
            MentorshipSession.objects.create(
                assignment=assignment,
                session_number=1,
                scheduled_date=date(2026, 5, 10),
            )

    def test_refus_numero_seance_superieur_nombre_prevu(self):
        assignment = MentorshipAssignment.objects.create(
            mentor=self.mentor,
            mentoree=self.mentoree,
            period=self.period,
        )

        with self.assertRaises(ValidationError):
            MentorshipSession.objects.create(
                assignment=assignment,
                session_number=9,
                scheduled_date=date(2026, 2, 10),
            )


class MentorshipApiTests(MentorshipSetupMixin, APITestCase):
    def test_mise_a_jour_suivi_mentore_par_mentor(self):
        assignment = MentorshipAssignment.objects.create(
            mentor=self.mentor,
            mentoree=self.mentoree,
            period=self.period,
        )
        self.client.force_authenticate(self.mentor)

        response = self.client.patch(
            f"/api/mentor/assignments/{assignment.id}/progress/",
            {
                "progress_status": MentoreeProgress.ProgressStatus.GOOD,
                "progress_percentage": 70,
                "achievements": "Bonne participation.",
                "mentor_opinion": "Progression solide.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        progress = MentoreeProgress.objects.get(assignment=assignment)
        self.assertEqual(progress.progress_percentage, 70)
        self.assertEqual(progress.progress_status, MentoreeProgress.ProgressStatus.GOOD)

    def test_permissions_admin_et_mentor(self):
        assignment = MentorshipAssignment.objects.create(
            mentor=self.mentor,
            mentoree=self.mentoree,
            period=self.period,
        )
        session = MentorshipSession.objects.create(
            assignment=assignment,
            session_number=1,
            scheduled_date=date(2026, 2, 10),
        )

        response = self.client.get("/api/mentor/dashboard/")
        self.assertIn(response.status_code, [401, 403])

        self.client.force_authenticate(self.admin)
        response = self.client.get("/api/mentorship-periods/")
        self.assertEqual(response.status_code, 200)

        self.client.force_authenticate(self.mentor)
        response = self.client.get("/api/mentorship-periods/")
        self.assertEqual(response.status_code, 403)

        response = self.client.patch(
            f"/api/mentor/sessions/{session.id}/complete/",
            {"summary": "Seance realisee."},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        session.refresh_from_db()
        self.assertEqual(session.status, MentorshipSession.Status.COMPLETED)

        self.client.force_authenticate(self.other_mentor)
        response = self.client.patch(
            f"/api/mentor/sessions/{session.id}/",
            {"summary": "Acces non autorise."},
            format="json",
        )
        self.assertEqual(response.status_code, 404)

    def test_ancien_endpoint_disponibilites_est_desactive(self):
        response = self.client.get(f"/api/mentors/{self.mentor.id}/available-slots/")

        self.assertEqual(response.status_code, 410)

    def test_mentor_peut_reconduire_affectation_sur_nouvelle_periode(self):
        assignment = MentorshipAssignment.objects.create(
            mentor=self.mentor,
            mentoree=self.mentoree,
            period=self.period,
        )
        next_period = MentorshipPeriod.objects.create(
            title="Session 2027",
            start_date=date(2027, 1, 15),
            end_date=date(2027, 4, 30),
            required_sessions=6,
            status=MentorshipPeriod.Status.DRAFT,
        )
        self.client.force_authenticate(self.mentor)

        response = self.client.post(
            f"/api/mentor/assignments/{assignment.id}/continue/",
            {"period": next_period.id},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            MentorshipAssignment.objects.filter(
                mentor=self.mentor,
                mentoree=self.mentoree,
                period=next_period,
                status=MentorshipAssignment.Status.ACTIVE,
            ).exists()
        )
