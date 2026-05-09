from datetime import datetime, time, timedelta

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone

from apps.mentorat.models import (
    MentorAvailability,
    MentorAvailabilityException,
    MentorProfile,
    Mentorat,
    SessionBooking,
)
from apps.mentorat.services import generate_available_slots
from apps.users.models import NiveauAcademique, Role, Utilisateur


class MentorAvailabilityTests(TestCase):
    def setUp(self):
        self.role_mentor, _ = Role.objects.update_or_create(
            nom=Role.Nom.MENTOR,
            defaults={"description": "Mentor"},
        )
        self.role_mentore, _ = Role.objects.update_or_create(
            nom=Role.Nom.MENTORE,
            defaults={"description": "Mentore"},
        )
        self.level_mentore, _ = NiveauAcademique.objects.update_or_create(
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
        self.mentore = Utilisateur.objects.create_user(
            email="mentore@example.com",
            password="Testpass123!",
            nom="Barry",
            prenom="Moussa",
            role=self.role_mentore,
            profil_mentorat=Utilisateur.ProfilMentorat.MENTORE,
            niveau_academique=self.level_mentore,
            statut_compte=Utilisateur.StatutCompte.ACTIF,
            is_active=True,
        )
        MentorProfile.objects.create(
            mentor=self.mentor,
            max_mentores=5,
            max_sessions_per_week=5,
            default_session_duration=MentorProfile.SessionDuration.MIN_60,
        )

    def next_weekday(self, weekday: int):
        today = timezone.localdate()
        days_until = (weekday - today.weekday()) % 7
        if days_until == 0:
            days_until = 7
        return today + timedelta(days=days_until)

    def make_datetime(self, date_value, hour: int, minute: int = 0):
        return timezone.make_aware(
            datetime.combine(date_value, time(hour, minute)),
            timezone.get_current_timezone(),
        )

    def add_availability(self, date_value, start_hour=18, end_hour=21):
        return MentorAvailability.objects.create(
            mentor=self.mentor,
            weekday=date_value.weekday(),
            start_time=time(start_hour, 0),
            end_time=time(end_hour, 0),
            is_active=True,
        )

    def test_creation_disponibilite_hebdomadaire(self):
        slot_day = self.next_weekday(0)

        availability = self.add_availability(slot_day)

        self.assertEqual(availability.mentor, self.mentor)
        self.assertEqual(availability.weekday, slot_day.weekday())
        self.assertTrue(availability.is_active)

    def test_refus_disponibilite_qui_se_chevauche(self):
        slot_day = self.next_weekday(0)
        self.add_availability(slot_day, 18, 21)

        with self.assertRaises(ValidationError):
            MentorAvailability.objects.create(
                mentor=self.mentor,
                weekday=slot_day.weekday(),
                start_time=time(20, 0),
                end_time=time(22, 0),
                is_active=True,
            )

    def test_generation_des_creneaux_disponibles(self):
        slot_day = self.next_weekday(0)
        self.add_availability(slot_day, 18, 20)

        slots = generate_available_slots(self.mentor, slot_day, slot_day)

        self.assertEqual(len(slots), 2)
        self.assertEqual(slots[0]["starts_at"], self.make_datetime(slot_day, 18))
        self.assertEqual(slots[1]["starts_at"], self.make_datetime(slot_day, 19))

    def test_generation_exclut_les_exceptions(self):
        slot_day = self.next_weekday(0)
        self.add_availability(slot_day, 18, 20)
        MentorAvailabilityException.objects.create(
            mentor=self.mentor,
            start_date=slot_day,
            end_date=slot_day,
            reason="Examens",
        )

        slots = generate_available_slots(self.mentor, slot_day, slot_day)

        self.assertEqual(slots, [])

    def test_refus_double_reservation(self):
        slot_day = self.next_weekday(0)
        self.add_availability(slot_day, 18, 21)
        SessionBooking.objects.create(
            mentor=self.mentor,
            mentore=self.mentore,
            starts_at=self.make_datetime(slot_day, 18),
            ends_at=self.make_datetime(slot_day, 19),
            status=SessionBooking.Status.CONFIRMED,
        )

        with self.assertRaises(ValidationError):
            SessionBooking.objects.create(
                mentor=self.mentor,
                mentore=self.mentore,
                starts_at=self.make_datetime(slot_day, 18, 30),
                ends_at=self.make_datetime(slot_day, 19, 30),
                status=SessionBooking.Status.PENDING,
            )

    def test_refus_si_capacite_maximale_de_mentores_est_atteinte(self):
        MentorProfile.objects.filter(mentor=self.mentor).update(max_mentores=1)
        autre_mentore = Utilisateur.objects.create_user(
            email="autre.mentore@example.com",
            password="Testpass123!",
            nom="Diallo",
            prenom="Fatou",
            role=self.role_mentore,
            profil_mentorat=Utilisateur.ProfilMentorat.MENTORE,
            niveau_academique=self.level_mentore,
            statut_compte=Utilisateur.StatutCompte.ACTIF,
            is_active=True,
        )
        Mentorat.objects.create(
            mentor=self.mentor,
            mentore=autre_mentore,
            statut_jumelage=Mentorat.StatutJumelage.ACTIF,
        )
        slot_day = self.next_weekday(0)
        self.add_availability(slot_day, 18, 21)

        with self.assertRaises(ValidationError):
            SessionBooking.objects.create(
                mentor=self.mentor,
                mentore=self.mentore,
                starts_at=self.make_datetime(slot_day, 18),
                ends_at=self.make_datetime(slot_day, 19),
                status=SessionBooking.Status.PENDING,
            )

    def test_mentore_deja_jumele_peut_reserver_si_capacite_est_atteinte(self):
        MentorProfile.objects.filter(mentor=self.mentor).update(max_mentores=1)
        Mentorat.objects.create(
            mentor=self.mentor,
            mentore=self.mentore,
            statut_jumelage=Mentorat.StatutJumelage.ACTIF,
        )
        slot_day = self.next_weekday(0)
        self.add_availability(slot_day, 18, 21)

        booking = SessionBooking.objects.create(
            mentor=self.mentor,
            mentore=self.mentore,
            starts_at=self.make_datetime(slot_day, 18),
            ends_at=self.make_datetime(slot_day, 19),
            status=SessionBooking.Status.PENDING,
        )

        self.assertEqual(booking.mentor, self.mentor)
        self.assertEqual(booking.mentore, self.mentore)

    def test_refus_si_limite_de_seances_hebdomadaires_est_atteinte(self):
        MentorProfile.objects.filter(mentor=self.mentor).update(max_sessions_per_week=1)
        slot_day = self.next_weekday(0)
        self.add_availability(slot_day, 18, 22)
        SessionBooking.objects.create(
            mentor=self.mentor,
            mentore=self.mentore,
            starts_at=self.make_datetime(slot_day, 18),
            ends_at=self.make_datetime(slot_day, 19),
            status=SessionBooking.Status.CONFIRMED,
        )

        with self.assertRaises(ValidationError):
            SessionBooking.objects.create(
                mentor=self.mentor,
                mentore=self.mentore,
                starts_at=self.make_datetime(slot_day, 19),
                ends_at=self.make_datetime(slot_day, 20),
                status=SessionBooking.Status.PENDING,
            )
