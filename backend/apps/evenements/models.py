from django.conf import settings
from django.db import models


class Evenement(models.Model):
    class TypeEvenement(models.TextChoices):
        ATELIER = "ATELIER", "Atelier"
        CONFERENCE = "CONFERENCE", "Conference"
        RESEAUTAGE = "RESEAUTAGE", "Reseautage"
        AUTRE = "AUTRE", "Autre"

    class StatutEvenement(models.TextChoices):
        PLANIFIE = "PLANIFIE", "Planifie"
        ANNULE = "ANNULE", "Annule"
        TERMINE = "TERMINE", "Termine"

    titre = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    date_evenement = models.DateField()
    heure_evenement = models.TimeField()
    lieu = models.CharField(max_length=255, blank=True)
    type_evenement = models.CharField(max_length=30, choices=TypeEvenement.choices, default=TypeEvenement.ATELIER)
    statut_evenement = models.CharField(
        max_length=30,
        choices=StatutEvenement.choices,
        default=StatutEvenement.PLANIFIE,
    )

    class Meta:
        ordering = ["date_evenement", "heure_evenement"]

    def __str__(self) -> str:
        return self.titre


class Participation(models.Model):
    class StatutParticipation(models.TextChoices):
        INSCRIT = "INSCRIT", "Inscrit"
        PRESENT = "PRESENT", "Present"
        ABSENT = "ABSENT", "Absent"
        ANNULE = "ANNULE", "Annule"

    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="participations",
    )
    evenement = models.ForeignKey(Evenement, on_delete=models.CASCADE, related_name="participations")
    statut_participation = models.CharField(
        max_length=30,
        choices=StatutParticipation.choices,
        default=StatutParticipation.INSCRIT,
    )
    date_reponse = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("utilisateur", "evenement")
        ordering = ["-date_reponse"]

    def __str__(self) -> str:
        return f"{self.utilisateur} - {self.evenement}"
