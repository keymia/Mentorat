from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q


class Mentorat(models.Model):
    class StatutJumelage(models.TextChoices):
        ACTIF = "ACTIF", "Actif"
        TERMINE = "TERMINE", "Termine"
        ANNULE = "ANNULE", "Annule"
        SUSPENDU = "SUSPENDU", "Suspendu"

    mentor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mentorats_comme_mentor",
    )
    mentore = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mentorats_comme_mentore",
    )
    date_jumelage = models.DateTimeField(auto_now_add=True)
    statut_jumelage = models.CharField(
        max_length=20,
        choices=StatutJumelage.choices,
        default=StatutJumelage.ACTIF,
    )

    class Meta:
        ordering = ["-date_jumelage"]
        constraints = [
            models.UniqueConstraint(
                fields=["mentore"],
                condition=Q(statut_jumelage="ACTIF"),
                name="unique_mentorat_actif_par_mentore",
            )
        ]

    def __str__(self) -> str:
        return f"{self.mentor} -> {self.mentore}"

    def clean(self):
        super().clean()
        from apps.users.models import Utilisateur

        if self.mentor_id and self.mentore_id and self.mentor_id == self.mentore_id:
            raise ValidationError("Un utilisateur ne peut pas etre son propre mentor.")

        if not self.mentor_id or not self.mentore_id:
            return

        if not self.mentor.est_mentor:
            raise ValidationError({"mentor": "Le mentor doit avoir le profil MENTOR ou MENTOR_ET_MENTORE."})

        if self.mentor.statut_compte != Utilisateur.StatutCompte.ACTIF:
            raise ValidationError({"mentor": "Le mentor doit etre actif."})

        if not self.mentor.niveau_academique_id or not self.mentore.niveau_academique_id:
            raise ValidationError("Le mentor et le mentore doivent avoir un niveau academique.")

        ordre_attendu = self.mentore.niveau_academique.ordre_niveau + 1
        if self.mentor.niveau_academique.ordre_niveau != ordre_attendu:
            raise ValidationError(
                {"mentor": "Le mentor doit appartenir au niveau academique superieur direct."}
            )

        if self.statut_jumelage == self.StatutJumelage.ACTIF:
            mentorats_actifs = (
                Mentorat.objects.filter(mentor=self.mentor, statut_jumelage=self.StatutJumelage.ACTIF)
                .exclude(pk=self.pk)
                .count()
            )
            if mentorats_actifs >= self.mentor.capacite_effective():
                raise ValidationError({"mentor": "Le mentor a atteint sa capacite maximale."})

            existe_deja = (
                Mentorat.objects.filter(mentore=self.mentore, statut_jumelage=self.StatutJumelage.ACTIF)
                .exclude(pk=self.pk)
                .exists()
            )
            if existe_deja:
                raise ValidationError({"mentore": "Ce mentore a deja un mentorat actif."})

    def save(self, *args, **kwargs):
        ancien_mentor_id = None
        if self.pk:
            ancien_mentor_id = (
                Mentorat.objects.filter(pk=self.pk).values_list("mentor_id", flat=True).first()
            )
        self.full_clean()
        super().save(*args, **kwargs)
        self.actualiser_nombre_mentores(self.mentor_id)
        if ancien_mentor_id and ancien_mentor_id != self.mentor_id:
            self.actualiser_nombre_mentores(ancien_mentor_id)

    def delete(self, *args, **kwargs):
        mentor_id = self.mentor_id
        result = super().delete(*args, **kwargs)
        self.actualiser_nombre_mentores(mentor_id)
        return result

    @classmethod
    def actualiser_nombre_mentores(cls, mentor_id: int | None):
        if not mentor_id:
            return
        from apps.users.models import Utilisateur

        total = cls.objects.filter(mentor_id=mentor_id, statut_jumelage=cls.StatutJumelage.ACTIF).count()
        Utilisateur.objects.filter(pk=mentor_id).update(nombre_mentores_actuels=total)
