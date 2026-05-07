from django.conf import settings
from django.db import models


class EmailAutomatique(models.Model):
    class TypeEmail(models.TextChoices):
        INSCRIPTION_RECUE = "INSCRIPTION_RECUE", "Inscription recue"
        INSCRIPTION_VALIDEE = "INSCRIPTION_VALIDEE", "Inscription validee"
        INSCRIPTION_REFUSEE = "INSCRIPTION_REFUSEE", "Inscription refusee"
        JUMELAGE = "JUMELAGE", "Jumelage"
        RAPPEL_EVENEMENT = "RAPPEL_EVENEMENT", "Rappel evenement"

    class StatutEnvoi(models.TextChoices):
        EN_ATTENTE = "EN_ATTENTE", "En attente"
        ENVOYE = "ENVOYE", "Envoye"
        ECHEC = "ECHEC", "Echec"

    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="emails_automatiques",
    )
    type_email = models.CharField(max_length=50, choices=TypeEmail.choices)
    sujet_fr = models.CharField(max_length=255)
    sujet_en = models.CharField(max_length=255, blank=True)
    contenu_fr = models.TextField()
    contenu_en = models.TextField(blank=True)
    date_envoi = models.DateTimeField(null=True, blank=True)
    statut_envoi = models.CharField(
        max_length=20,
        choices=StatutEnvoi.choices,
        default=StatutEnvoi.EN_ATTENTE,
    )

    class Meta:
        ordering = ["-date_envoi", "-id"]

    def __str__(self) -> str:
        return f"{self.type_email} - {self.utilisateur}"
