from datetime import date

from rest_framework.test import APITestCase

from apps.inscriptions.models import Inscription
from apps.mentorat.models import MentorshipAssignment, MentorshipPeriod
from apps.users.models import NiveauAcademique, Role, Utilisateur


class InscriptionMatchingSetupMixin:
    def setUp(self):
        self.role_admin, _ = Role.objects.update_or_create(
            nom=Role.Nom.ADMIN_PRINCIPAL,
            defaults={"description": "Admin principal."},
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
            defaults={"nom": "Je suis au secondaire", "code": "mentoree_secondary", "est_premier_niveau": True},
        )
        self.level_mentor, _ = NiveauAcademique.objects.update_or_create(
            ordre_niveau=2,
            defaults={"nom": "Mentor niveau 1", "code": "mentor_level_1", "est_premier_niveau": False},
        )
        self.admin = Utilisateur.objects.create_user(
            email="admin.matching@example.com",
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
            email="mentor.matching@example.com",
            password="Testpass123!",
            nom="Sow",
            prenom="Mina",
            role=self.role_mentor,
            profil_mentorat=Utilisateur.ProfilMentorat.MENTOR,
            niveau_academique=self.level_mentor,
            statut_compte=Utilisateur.StatutCompte.ACTIF,
            is_active=True,
            capacite_mentorat=5,
        )
        self.period = MentorshipPeriod.objects.create(
            title="Session test",
            start_date=date(2026, 1, 1),
            end_date=date(2026, 5, 31),
            required_sessions=4,
            status=MentorshipPeriod.Status.ACTIVE,
        )

    def mentoree_payload(self, **overrides):
        payload = {
            "nom": "Diallo",
            "prenom": "Fatou",
            "email": overrides.pop("email", "fatou.matching@example.com"),
            "telephone": "",
            "langue_preferee": "FR",
            "region": "",
            "niveau_academique": self.level_mentoree.id,
            "mentorship_period": self.period.id,
            "objectifs": "Trouver un mentor.",
            "consentement": True,
        }
        payload.update(overrides)
        return payload


class InscriptionMatchingApiTests(InscriptionMatchingSetupMixin, APITestCase):
    def test_mentoree_avec_mentor_choisi_est_jumelee_automatiquement(self):
        response = self.client.post(
            "/api/inscriptions/mentore/",
            self.mentoree_payload(mentor_choisi=self.mentor.id),
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        inscription = Inscription.objects.get(id=response.data["id"])
        self.assertEqual(inscription.statut_inscription, Inscription.StatutInscription.VALIDEE)
        self.assertEqual(inscription.registration_status, Inscription.RegistrationStatus.MATCHED)
        self.assertFalse(inscription.needs_matching)
        self.assertTrue(
            MentorshipAssignment.objects.filter(
                mentoree=inscription.utilisateur,
                mentor=self.mentor,
                period=self.period,
                status=MentorshipAssignment.Status.ACTIVE,
            ).exists()
        )

    def test_mentoree_demande_association_apparait_dans_jumelage(self):
        response = self.client.post(
            "/api/inscriptions/mentore/",
            self.mentoree_payload(
                email="association.matching@example.com",
                wants_association_assignment=True,
            ),
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        inscription = Inscription.objects.get(id=response.data["id"])
        self.assertTrue(inscription.needs_matching)

        self.client.force_authenticate(self.admin)
        response = self.client.get(f"/api/admin/matching/?period={self.period.id}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["mentee"]["email"], "association.matching@example.com")

    def test_mentoree_en_attente_de_jumelage_apparait_et_peut_etre_assignee(self):
        mentoree = Utilisateur.objects.create_user(
            email="pending.matching@example.com",
            password="Testpass123!",
            nom="Pending",
            prenom="Mentee",
            role=self.role_mentore,
            profil_mentorat=Utilisateur.ProfilMentorat.MENTORE,
            niveau_academique=self.level_mentoree,
            statut_compte=Utilisateur.StatutCompte.EN_ATTENTE,
            is_active=True,
        )
        Inscription.objects.create(
            utilisateur=mentoree,
            type_inscription=Inscription.TypeInscription.MENTORE,
            statut_inscription=Inscription.StatutInscription.EN_ATTENTE,
            mentorship_period=self.period,
            wants_association_assignment=True,
            needs_matching=True,
            registration_status=Inscription.RegistrationStatus.PENDING_MATCHING,
            consentement=True,
        )
        self.client.force_authenticate(self.admin)

        response = self.client.get(f"/api/admin/matching/?period={self.period.id}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["mentee"]["email"], "pending.matching@example.com")

        response = self.client.post(
            f"/api/admin/matching/{mentoree.id}/assign/",
            {"mentor": self.mentor.id, "period": self.period.id},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        mentoree.refresh_from_db()
        inscription = mentoree.inscriptions.get(mentorship_period=self.period)
        self.assertEqual(mentoree.statut_compte, Utilisateur.StatutCompte.ACTIF)
        self.assertEqual(inscription.statut_inscription, Inscription.StatutInscription.VALIDEE)
        self.assertFalse(inscription.needs_matching)
        self.assertEqual(inscription.registration_status, Inscription.RegistrationStatus.MATCHED)

    def test_mentoree_avec_mentor_choisi_apparait_dans_jumelage(self):
        mentoree = Utilisateur.objects.create_user(
            email="already.has.mentor@example.com",
            password="Testpass123!",
            nom="Already",
            prenom="Matched",
            role=self.role_mentore,
            profil_mentorat=Utilisateur.ProfilMentorat.MENTORE,
            niveau_academique=self.level_mentoree,
            statut_compte=Utilisateur.StatutCompte.ACTIF,
            is_active=True,
        )
        Inscription.objects.create(
            utilisateur=mentoree,
            type_inscription=Inscription.TypeInscription.MENTORE,
            statut_inscription=Inscription.StatutInscription.VALIDEE,
            mentor_choisi=self.mentor,
            mentorship_period=self.period,
            needs_matching=False,
            registration_status=Inscription.RegistrationStatus.MATCHED,
            consentement=True,
        )
        self.client.force_authenticate(self.admin)

        response = self.client.get(f"/api/admin/matching/?period={self.period.id}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["results"]), 1)
        row = response.data["results"][0]
        self.assertEqual(row["mentee"]["email"], "already.has.mentor@example.com")
        self.assertEqual(row["matching_status"], "assigned")
        self.assertEqual(row["current_mentor"]["email"], self.mentor.email)

    def test_admin_assigne_un_mentor_depuis_jumelage(self):
        response = self.client.post(
            "/api/inscriptions/mentore/",
            self.mentoree_payload(
                email="manual.matching@example.com",
                wants_association_assignment=True,
            ),
            format="json",
        )
        inscription = Inscription.objects.get(id=response.data["id"])
        self.client.force_authenticate(self.admin)

        response = self.client.post(
            f"/api/admin/matching/{inscription.utilisateur_id}/assign/",
            {"mentor": self.mentor.id, "period": self.period.id},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        inscription.refresh_from_db()
        self.assertFalse(inscription.needs_matching)
        self.assertEqual(inscription.registration_status, Inscription.RegistrationStatus.MATCHED)

    def test_admin_reassigne_un_mentor_et_conserve_historique(self):
        new_mentor = Utilisateur.objects.create_user(
            email="new.mentor.matching@example.com",
            password="Testpass123!",
            nom="Ndiaye",
            prenom="Aly",
            role=self.role_mentor,
            profil_mentorat=Utilisateur.ProfilMentorat.MENTOR,
            niveau_academique=self.level_mentor,
            statut_compte=Utilisateur.StatutCompte.ACTIF,
            is_active=True,
            capacite_mentorat=5,
        )
        mentoree = Utilisateur.objects.create_user(
            email="reassign.matching@example.com",
            password="Testpass123!",
            nom="Reassign",
            prenom="Mentee",
            role=self.role_mentore,
            profil_mentorat=Utilisateur.ProfilMentorat.MENTORE,
            niveau_academique=self.level_mentoree,
            statut_compte=Utilisateur.StatutCompte.ACTIF,
            is_active=True,
        )
        old_assignment = MentorshipAssignment.objects.create(
            mentor=self.mentor,
            mentoree=mentoree,
            period=self.period,
        )
        inscription = Inscription.objects.create(
            utilisateur=mentoree,
            type_inscription=Inscription.TypeInscription.MENTORE,
            statut_inscription=Inscription.StatutInscription.VALIDEE,
            mentor_choisi=self.mentor,
            mentorship_period=self.period,
            needs_matching=False,
            registration_status=Inscription.RegistrationStatus.MATCHED,
            consentement=True,
        )
        self.client.force_authenticate(self.admin)

        response = self.client.post(
            f"/api/admin/matching/{mentoree.id}/reassign/",
            {"new_mentor_id": new_mentor.id, "session_id": self.period.id},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        old_assignment.refresh_from_db()
        inscription.refresh_from_db()
        self.assertEqual(old_assignment.status, MentorshipAssignment.Status.SUSPENDED)
        self.assertEqual(inscription.mentor_choisi, new_mentor)
        self.assertEqual(response.data["matching_status"], "assigned")
        self.assertEqual(len(response.data["assignment_history"]), 2)
        self.assertTrue(
            MentorshipAssignment.objects.filter(
                mentor=new_mentor,
                mentoree=mentoree,
                period=self.period,
                status=MentorshipAssignment.Status.ACTIVE,
            ).exists()
        )

    def test_admin_reassign_refuse_mentor_sature(self):
        saturated_mentor = Utilisateur.objects.create_user(
            email="saturated.mentor.matching@example.com",
            password="Testpass123!",
            nom="Sature",
            prenom="Mentor",
            role=self.role_mentor,
            profil_mentorat=Utilisateur.ProfilMentorat.MENTOR,
            niveau_academique=self.level_mentor,
            statut_compte=Utilisateur.StatutCompte.ACTIF,
            is_active=True,
            capacite_mentorat=1,
        )
        other_mentoree = Utilisateur.objects.create_user(
            email="capacity.owner@example.com",
            password="Testpass123!",
            nom="Capacity",
            prenom="Owner",
            role=self.role_mentore,
            profil_mentorat=Utilisateur.ProfilMentorat.MENTORE,
            niveau_academique=self.level_mentoree,
            statut_compte=Utilisateur.StatutCompte.ACTIF,
            is_active=True,
        )
        MentorshipAssignment.objects.create(mentor=saturated_mentor, mentoree=other_mentoree, period=self.period)
        target_mentoree = Utilisateur.objects.create_user(
            email="capacity.target@example.com",
            password="Testpass123!",
            nom="Capacity",
            prenom="Target",
            role=self.role_mentore,
            profil_mentorat=Utilisateur.ProfilMentorat.MENTORE,
            niveau_academique=self.level_mentoree,
            statut_compte=Utilisateur.StatutCompte.ACTIF,
            is_active=True,
        )
        Inscription.objects.create(
            utilisateur=target_mentoree,
            type_inscription=Inscription.TypeInscription.MENTORE,
            statut_inscription=Inscription.StatutInscription.VALIDEE,
            mentorship_period=self.period,
            wants_association_assignment=True,
            needs_matching=True,
            registration_status=Inscription.RegistrationStatus.PENDING_MATCHING,
            consentement=True,
        )
        self.client.force_authenticate(self.admin)

        response = self.client.post(
            f"/api/admin/matching/{target_mentoree.id}/reassign/",
            {"new_mentor_id": saturated_mentor.id, "session_id": self.period.id},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(
            MentorshipAssignment.objects.filter(
                mentor=saturated_mentor,
                mentoree=target_mentoree,
                period=self.period,
                status=MentorshipAssignment.Status.ACTIVE,
            ).exists()
        )

    def test_mentor_inscription_n_attend_pas_validation_admin(self):
        response = self.client.post(
            "/api/inscriptions/mentor/",
            {
                "nom": "Ba",
                "prenom": "Aminata",
                "email": "new.mentor@example.com",
                "telephone": "",
                "langue_preferee": "FR",
                "region": "",
                "niveau_academique": self.level_mentor.id,
                "mentorship_period": self.period.id,
                "mini_bio": "Mentore engagee.",
                "capacite_mentorat": 2,
                "consentement": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        inscription = Inscription.objects.get(id=response.data["id"])
        self.assertEqual(inscription.statut_inscription, Inscription.StatutInscription.VALIDEE)
        self.assertEqual(inscription.utilisateur.statut_compte, Utilisateur.StatutCompte.ACTIF)

    def test_mentor_inscription_accepte_absence_capacite(self):
        response = self.client.post(
            "/api/inscriptions/mentor/",
            {
                "nom": "Ba",
                "prenom": "Aminata",
                "email": "new.mentor.no.capacity@example.com",
                "telephone": "",
                "langue_preferee": "FR",
                "region": "",
                "niveau_academique": self.level_mentor.id,
                "mentorship_period": self.period.id,
                "mini_bio": "Mentore engagee.",
                "consentement": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        inscription = Inscription.objects.get(id=response.data["id"])
        self.assertEqual(inscription.utilisateur.capacite_mentorat, 5)


class SessionAutoCompletionTests(InscriptionMatchingSetupMixin, APITestCase):
    def test_session_expiree_termine_affectations_et_inscriptions(self):
        expired_period = MentorshipPeriod.objects.create(
            title="Session expiree",
            start_date=date(2025, 1, 1),
            end_date=date(2025, 1, 31),
            required_sessions=3,
            status=MentorshipPeriod.Status.ACTIVE,
        )
        mentoree = Utilisateur.objects.create_user(
            email="expired.mentoree@example.com",
            password="Testpass123!",
            nom="Expired",
            prenom="Mentee",
            role=self.role_mentore,
            profil_mentorat=Utilisateur.ProfilMentorat.MENTORE,
            niveau_academique=self.level_mentoree,
            statut_compte=Utilisateur.StatutCompte.ACTIF,
            is_active=True,
        )
        assignment = MentorshipAssignment.objects.create(
            mentor=self.mentor,
            mentoree=mentoree,
            period=expired_period,
        )
        inscription = Inscription.objects.create(
            utilisateur=mentoree,
            type_inscription=Inscription.TypeInscription.MENTORE,
            statut_inscription=Inscription.StatutInscription.VALIDEE,
            mentorship_period=expired_period,
            registration_status=Inscription.RegistrationStatus.MATCHED,
        )

        self.client.force_authenticate(self.admin)
        response = self.client.get("/api/admin/sessions/")

        self.assertEqual(response.status_code, 200)
        expired_period.refresh_from_db()
        assignment.refresh_from_db()
        inscription.refresh_from_db()
        self.assertEqual(expired_period.status, MentorshipPeriod.Status.COMPLETED)
        self.assertEqual(assignment.status, MentorshipAssignment.Status.COMPLETED)
        self.assertEqual(inscription.registration_status, Inscription.RegistrationStatus.COMPLETED)
        self.assertEqual(inscription.completed_session_status, Inscription.CompletedSessionStatus.COMPLETED)
