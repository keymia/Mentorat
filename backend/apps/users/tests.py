import re
from datetime import date

from django.core import mail
from django.test import override_settings
from rest_framework.test import APITestCase

from apps.inscriptions.models import Inscription
from apps.mentorat.models import MentoreeProgress, MentorshipAssignment, MentorshipPeriod, MentorshipSession
from apps.parametres.models import ParametreSysteme
from apps.users.models import NiveauAcademique, Role, Utilisateur


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend", LOGIN_2FA_ENABLED=True)
class AuthAndRoleRulesTests(APITestCase):
    def setUp(self):
        self.role_admin_principal, _ = Role.objects.update_or_create(
            nom=Role.Nom.ADMIN_PRINCIPAL,
            defaults={"description": "Acces complet."},
        )
        self.role_admin_operationnel, _ = Role.objects.update_or_create(
            nom=Role.Nom.ADMIN_OPERATIONNEL,
            defaults={"description": "Gestion operationnelle."},
        )
        self.role_mentor, _ = Role.objects.update_or_create(
            nom=Role.Nom.MENTOR,
            defaults={"description": "Mentor."},
        )
        self.role_mentore, _ = Role.objects.update_or_create(
            nom=Role.Nom.MENTORE,
            defaults={"description": "Mentore."},
        )
        self.level_mentoree, _ = NiveauAcademique.objects.update_or_create(
            ordre_niveau=1,
            defaults={
                "nom": "Je suis au secondaire",
                "code": "mentoree_secondary",
                "est_premier_niveau": True,
                "est_dernier_niveau": False,
            },
        )
        self.level_mentor_1, _ = NiveauAcademique.objects.update_or_create(
            ordre_niveau=2,
            defaults={
                "nom": "Je suis etudiant(e) au college ou en 1ere / 2e annee de baccalaureat",
                "code": "mentor_level_1",
                "est_premier_niveau": False,
                "est_dernier_niveau": False,
            },
        )
        self.level_mentor_2, _ = NiveauAcademique.objects.update_or_create(
            ordre_niveau=3,
            defaults={
                "nom": "Je suis etudiant(e) en 3e / 4e annee de baccalaureat ou a la maitrise",
                "code": "mentor_level_2",
                "est_premier_niveau": False,
                "est_dernier_niveau": False,
            },
        )
        self.level_medicine, _ = NiveauAcademique.objects.update_or_create(
            ordre_niveau=4,
            defaults={
                "nom": "Je suis etudiant(e) en medecine",
                "code": "mentor_medicine",
                "est_premier_niveau": False,
                "est_dernier_niveau": True,
            },
        )

        self.admin_principal = Utilisateur.objects.create_user(
            email="principal@example.com",
            password="Testpass123!",
            nom="Principal",
            prenom="Admin",
            role=self.role_admin_principal,
            statut_compte=Utilisateur.StatutCompte.ACTIF,
            is_active=True,
            is_staff=True,
            is_superuser=True,
        )
        self.admin_operationnel = Utilisateur.objects.create_user(
            email="operationnel@example.com",
            password="Testpass123!",
            nom="Operationnel",
            prenom="Admin",
            role=self.role_admin_operationnel,
            statut_compte=Utilisateur.StatutCompte.ACTIF,
            is_active=True,
            is_staff=True,
        )
        self.mentor = Utilisateur.objects.create_user(
            email="mentor.auth@example.com",
            password="Testpass123!",
            nom="Mentor",
            prenom="Mina",
            role=self.role_mentor,
            profil_mentorat=Utilisateur.ProfilMentorat.MENTOR,
            niveau_academique=self.level_mentor_2,
            statut_compte=Utilisateur.StatutCompte.ACTIF,
            is_active=True,
            capacite_mentorat=5,
        )
        self.mentoree = Utilisateur.objects.create_user(
            email="mentoree.auth@example.com",
            password="Testpass123!",
            nom="Mentoree",
            prenom="Moussa",
            role=self.role_mentore,
            profil_mentorat=Utilisateur.ProfilMentorat.MENTORE,
            niveau_academique=self.level_mentoree,
            statut_compte=Utilisateur.StatutCompte.ACTIF,
            is_active=True,
        )
        self.max_param, _ = ParametreSysteme.objects.update_or_create(
            cle="MAX_MENTORES_PAR_MENTOR",
            defaults={
                "valeur": "5",
                "description": "Limite maximale globale de mentores par mentor.",
            },
        )

    def _login_and_extract_code(self, email: str):
        mail.outbox.clear()
        response = self.client.post(
            "/api/auth/login/",
            {"email": email, "mot_de_passe": "Testpass123!"},
            format="json",
        )
        self.assertEqual(response.status_code, 202)
        self.assertTrue(response.data["requires_2fa"])
        self.assertEqual(len(mail.outbox), 1)
        match = re.search(r"\b(\d{6})\b", mail.outbox[0].body)
        self.assertIsNotNone(match)
        return response.data["challenge_id"], match.group(1)

    def _create_compatible_assignment(self):
        mentor = Utilisateur.objects.create_user(
            email="mentor.compatible@example.com",
            password="Testpass123!",
            nom="Compatible",
            prenom="Maya",
            role=self.role_mentor,
            profil_mentorat=Utilisateur.ProfilMentorat.MENTOR,
            niveau_academique=self.level_mentor_1,
            statut_compte=Utilisateur.StatutCompte.ACTIF,
            is_active=True,
            capacite_mentorat=5,
        )
        period = MentorshipPeriod.objects.create(
            title="Session suppression 2026",
            start_date=date(2026, 1, 1),
            end_date=date(2026, 6, 30),
            required_sessions=4,
            max_mentees_per_mentor=5,
            status=MentorshipPeriod.Status.ACTIVE,
        )
        inscription = Inscription.objects.create(
            utilisateur=self.mentoree,
            type_inscription=Inscription.TypeInscription.MENTORE,
            statut_inscription=Inscription.StatutInscription.VALIDEE,
            consentement=True,
            mentor_choisi=mentor,
            mentorship_period=period,
            needs_matching=False,
            registration_status=Inscription.RegistrationStatus.MATCHED,
        )
        assignment = MentorshipAssignment.objects.create(
            mentor=mentor,
            mentoree=self.mentoree,
            period=period,
            status=MentorshipAssignment.Status.ACTIVE,
        )
        session = MentorshipSession.objects.create(
            assignment=assignment,
            session_number=1,
            scheduled_date=date(2026, 2, 1),
            status=MentorshipSession.Status.COMPLETED,
            summary="Seance conservee.",
        )
        progress = MentoreeProgress.objects.create(
            assignment=assignment,
            progress_percentage=40,
            achievements="Progression conservee.",
        )
        return mentor, period, inscription, assignment, session, progress

    def test_admin_principal_login_requiert_code_temporaire(self):
        challenge_id, code = self._login_and_extract_code(self.admin_principal.email)

        response = self.client.post(
            "/api/auth/login/verify-code/",
            {"challenge_id": challenge_id, "code": code},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

        response = self.client.post(
            "/api/auth/login/verify-code/",
            {"challenge_id": challenge_id, "code": code},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_mentor_login_requiert_code_temporaire(self):
        challenge_id, code = self._login_and_extract_code(self.mentor.email)

        response = self.client.post(
            "/api/auth/login/verify-code/",
            {"challenge_id": challenge_id, "code": code},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["user"]["email"], self.mentor.email)

    def test_mentoree_login_ne_requiert_pas_double_authentification(self):
        response = self.client.post(
            "/api/auth/login/",
            {"email": self.mentoree.email, "mot_de_passe": "Testpass123!"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertEqual(len(mail.outbox), 0)

    def test_admin_operationnel_ne_peut_pas_creer_periode(self):
        payload = {
            "title": "Session printemps 2026",
            "description": "Periode reservee au principal.",
            "start_date": date(2026, 3, 1).isoformat(),
            "end_date": date(2026, 5, 30).isoformat(),
            "required_sessions": 6,
            "max_mentees_per_mentor": 7,
            "status": MentorshipPeriod.Status.ACTIVE,
        }

        self.client.force_authenticate(self.admin_operationnel)
        response = self.client.post("/api/mentorship-periods/", payload, format="json")
        self.assertEqual(response.status_code, 403)

        self.client.force_authenticate(self.admin_principal)
        response = self.client.post("/api/mentorship-periods/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["max_mentees_per_mentor"], 7)

    def test_admin_operationnel_ne_modifie_pas_limite_maximale_mentores(self):
        self.client.force_authenticate(self.admin_operationnel)
        response = self.client.patch(
            f"/api/parametres/{self.max_param.id}/",
            {"valeur": "8"},
            format="json",
        )
        self.assertEqual(response.status_code, 403)

        self.client.force_authenticate(self.admin_principal)
        response = self.client.patch(
            f"/api/parametres/{self.max_param.id}/",
            {"valeur": "8"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.max_param.refresh_from_db()
        self.assertEqual(self.max_param.valeur, "8")

    def test_admin_operationnel_infos_publiques_repassent_en_validation(self):
        self.client.force_authenticate(self.admin_operationnel)
        response = self.client.patch(
            "/api/account/me/",
            {
                "prenom": "Admina",
                "nom": "Operations",
                "public_title": "Responsable operations",
                "public_description": "Coordination des operations de mentorat.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["pending_public_validation"])
        self.assertFalse(response.data["is_public_profile_approved"])
        self.assertEqual(response.data["public_profile_status"], Utilisateur.StatutProfilPublic.EN_ATTENTE)

        self.admin_operationnel.refresh_from_db()
        self.assertTrue(self.admin_operationnel.pending_public_validation)
        self.assertFalse(self.admin_operationnel.is_public_profile_approved)

        self.client.force_authenticate(self.admin_principal)
        response = self.client.get("/api/admin/action-alerts/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["pending_public_admin_count"], 1)

        response = self.client.patch(
            f"/api/admin/operational-admins/{self.admin_operationnel.id}/approve-public-profile/",
            {},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["pending_public_validation"])
        self.assertTrue(response.data["is_public_profile_approved"])
        self.assertEqual(response.data["public_profile_status"], Utilisateur.StatutProfilPublic.VALIDE)

        self.client.force_authenticate(user=None)
        response = self.client.get("/api/public/about-team/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["nom_complet"], "Admina Operations")

    def test_admin_principal_apparait_en_premiere_position_sur_a_propos(self):
        self.admin_operationnel.can_appear_on_about_page = True
        self.admin_operationnel.public_title = "Coordination"
        self.admin_operationnel.public_description = "Coordination operationnelle."
        self.admin_operationnel.approve_public_profile()
        self.admin_operationnel.save()

        self.client.force_authenticate(self.admin_principal)
        response = self.client.patch(
            "/api/account/me/",
            {
                "can_appear_on_about_page": True,
                "public_appellation": "Dr",
                "public_title": "MD, PhD",
                "public_description": "Pilotage du programme de mentorat.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["can_appear_on_about_page"])
        self.assertTrue(response.data["is_public_profile_approved"])
        self.assertFalse(response.data["pending_public_validation"])

        self.client.force_authenticate(user=None)
        response = self.client.get("/api/public/about-team/")
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 2)
        self.assertEqual(response.data[0]["nom_complet"], "Admin Principal")
        self.assertEqual(response.data[0]["public_display_name"], "Dr Admin Principal, MD, PhD")
        self.assertEqual(response.data[0]["public_title"], "MD, PhD")

    def test_admin_principal_peut_refuser_validation_publique_operationnelle(self):
        self.client.force_authenticate(self.admin_operationnel)
        response = self.client.patch(
            "/api/account/me/",
            {
                "public_title": "Coordination publique",
                "public_description": "Description a reviser.",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)

        self.client.force_authenticate(self.admin_principal)
        response = self.client.patch(
            f"/api/admin/operational-admins/{self.admin_operationnel.id}/reject-public-profile/",
            {},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["pending_public_validation"])
        self.assertFalse(response.data["is_public_profile_approved"])
        self.assertEqual(response.data["public_profile_status"], Utilisateur.StatutProfilPublic.REFUSE)

    def test_niveau_academique_ne_peut_pas_diminuer(self):
        self.client.force_authenticate(self.admin_principal)
        response = self.client.patch(
            f"/api/users/{self.mentor.id}/",
            {"niveau_academique": self.level_mentor_1.id},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("niveau_academique", response.data)

    def test_admin_ne_peut_pas_rendre_secondaire_mentor(self):
        self.client.force_authenticate(self.admin_principal)
        response = self.client.patch(
            f"/api/users/{self.mentoree.id}/",
            {
                "profil_mentorat": Utilisateur.ProfilMentorat.MENTOR,
                "role": self.role_mentor.id,
                "niveau_academique": self.level_mentoree.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("niveau_academique", response.data)
        self.assertIn("secondaire", str(response.data["niveau_academique"]).lower())

    def test_admin_transforme_mentore_intermediaire_en_mentor_et_mentore(self):
        self.client.force_authenticate(self.admin_principal)
        utilisateur_count = Utilisateur.objects.count()

        response = self.client.patch(
            f"/api/users/{self.mentoree.id}/",
            {
                "profil_mentorat": Utilisateur.ProfilMentorat.MENTOR_ET_MENTORE,
                "role": self.role_mentor.id,
                "niveau_academique": self.level_mentor_1.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.mentoree.refresh_from_db()
        self.assertEqual(Utilisateur.objects.count(), utilisateur_count)
        self.assertEqual(self.mentoree.profil_mentorat, Utilisateur.ProfilMentorat.MENTOR_ET_MENTORE)
        self.assertEqual(self.mentoree.capacite_mentorat, 5)

    def test_admin_ne_peut_pas_rendre_medecine_mentore(self):
        self.client.force_authenticate(self.admin_principal)
        response = self.client.patch(
            f"/api/users/{self.mentor.id}/",
            {
                "profil_mentorat": Utilisateur.ProfilMentorat.MENTOR_ET_MENTORE,
                "role": self.role_mentor.id,
                "niveau_academique": self.level_medicine.id,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("niveau_academique", response.data)
        self.assertIn("medecine", str(response.data["niveau_academique"]).lower())

    def test_admin_operationnel_ne_peut_pas_supprimer_mentor(self):
        self.client.force_authenticate(self.admin_operationnel)
        response = self.client.delete(f"/api/users/{self.mentor.id}/?delete_mode=mentor")

        self.assertEqual(response.status_code, 403)

    def test_supprimer_mentor_conserve_mentores_et_reouvre_jumelage(self):
        mentor, _, inscription, assignment, session, progress = self._create_compatible_assignment()

        self.client.force_authenticate(self.admin_principal)
        response = self.client.delete(f"/api/users/{mentor.id}/?delete_mode=mentor")

        self.assertEqual(response.status_code, 200)
        mentor.refresh_from_db()
        assignment.refresh_from_db()
        inscription.refresh_from_db()

        self.assertFalse(mentor.is_active)
        self.assertEqual(mentor.statut_compte, Utilisateur.StatutCompte.INACTIF)
        self.assertIsNone(mentor.profil_mentorat)
        self.assertEqual(assignment.status, MentorshipAssignment.Status.SUSPENDED)
        self.assertTrue(Utilisateur.objects.filter(pk=self.mentoree.pk).exists())
        self.assertTrue(MentorshipSession.objects.filter(pk=session.pk).exists())
        self.assertTrue(MentoreeProgress.objects.filter(pk=progress.pk).exists())
        self.assertIsNone(inscription.mentor_choisi)
        self.assertTrue(inscription.needs_matching)
        self.assertTrue(inscription.wants_association_assignment)
        self.assertEqual(inscription.registration_status, Inscription.RegistrationStatus.PENDING_MATCHING)

    def test_supprimer_mentore_supprime_ses_donnees_liees(self):
        _, _, inscription, assignment, session, progress = self._create_compatible_assignment()

        self.client.force_authenticate(self.admin_principal)
        response = self.client.delete(f"/api/users/{self.mentoree.id}/?delete_mode=mentee")

        self.assertEqual(response.status_code, 200)
        self.assertFalse(Utilisateur.objects.filter(pk=self.mentoree.pk).exists())
        self.assertFalse(Inscription.objects.filter(pk=inscription.pk).exists())
        self.assertFalse(MentorshipAssignment.objects.filter(pk=assignment.pk).exists())
        self.assertFalse(MentorshipSession.objects.filter(pk=session.pk).exists())
        self.assertFalse(MentoreeProgress.objects.filter(pk=progress.pk).exists())

    def test_admin_principal_gere_admin_operationnel_et_affichage_public(self):
        self.client.force_authenticate(self.admin_principal)
        response = self.client.post(
            "/api/admin/operational-admins/",
            {
                "prenom": "Omar",
                "nom": "Ops",
                "email": "omar.ops@example.com",
                "mot_de_passe": "Testpass123!",
                "statut_compte": Utilisateur.StatutCompte.ACTIF,
                "can_appear_on_about_page": True,
                "public_appellation": "Mme",
                "public_title": "MD, Chercheuse en santé publique",
                "public_description": "Coordination operationnelle du programme.",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        admin_id = response.data["id"]

        self.client.force_authenticate(user=None)
        response = self.client.get("/api/public/about-team/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["nom_complet"], "Omar Ops")
        self.assertEqual(response.data[0]["public_display_name"], "Mme Omar Ops, MD, Chercheuse en santé publique")
        self.assertEqual(response.data[0]["public_title"], "MD, Chercheuse en santé publique")

        self.client.force_authenticate(self.admin_operationnel)
        response = self.client.patch(
            f"/api/admin/operational-admins/{admin_id}/",
            {"statut_compte": Utilisateur.StatutCompte.INACTIF},
            format="json",
        )
        self.assertEqual(response.status_code, 403)
