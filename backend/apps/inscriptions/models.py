from django.conf import settings
from django.db import models


class Inscription(models.Model):
    class TypeInscription(models.TextChoices):
        MENTOR = "MENTOR", "Mentor"
        MENTORE = "MENTORE", "Mentore"

    class StatutInscription(models.TextChoices):
        EN_ATTENTE = "EN_ATTENTE", "En attente"
        VALIDEE = "VALIDEE", "Validee"
        REFUSEE = "REFUSEE", "Refusee"

    class RegistrationStatus(models.TextChoices):
        REGISTERED = "registered", "Inscrit"
        PENDING_MATCHING = "pending_matching", "Jumelage requis"
        MATCHED = "matched", "Jumele"
        COMPLETED = "completed", "Termine"

    class CompletedSessionStatus(models.TextChoices):
        NONE = "none", "Non termine"
        COMPLETED = "completed", "Session terminee"

    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="inscriptions",
    )
    type_inscription = models.CharField(max_length=20, choices=TypeInscription.choices)
    statut_inscription = models.CharField(
        max_length=20,
        choices=StatutInscription.choices,
        default=StatutInscription.EN_ATTENTE,
    )
    consentement = models.BooleanField(default=False)
    date_inscription = models.DateTimeField(auto_now_add=True)
    mentor_choisi = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="inscriptions_choisies",
        null=True,
        blank=True,
    )
    mentorship_period = models.ForeignKey(
        "mentorat.MentorshipPeriod",
        on_delete=models.SET_NULL,
        related_name="inscriptions",
        null=True,
        blank=True,
    )
    wants_association_assignment = models.BooleanField(default=False)
    needs_matching = models.BooleanField(default=False)
    registration_status = models.CharField(
        max_length=30,
        choices=RegistrationStatus.choices,
        default=RegistrationStatus.REGISTERED,
    )
    completed_session_status = models.CharField(
        max_length=20,
        choices=CompletedSessionStatus.choices,
        default=CompletedSessionStatus.NONE,
    )

    class Meta:
        ordering = ["-date_inscription"]

    def __str__(self) -> str:
        return f"{self.type_inscription} - {self.utilisateur}"
