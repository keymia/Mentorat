from django.db import models


class Partenaire(models.Model):
    class TypePartenaire(models.TextChoices):
        ACADEMIQUE = "ACADEMIQUE", "Academique"
        FINANCIER = "FINANCIER", "Financier"
        COMMUNAUTAIRE = "COMMUNAUTAIRE", "Communautaire"
        TECHNOLOGIQUE = "TECHNOLOGIQUE", "Technologique"
        AUTRE = "AUTRE", "Autre"

    class Statut(models.TextChoices):
        ACTIF = "ACTIF", "Actif"
        INACTIF = "INACTIF", "Inactif"

    nom_partenaire = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to="partenaires/", blank=True, null=True)
    site_web = models.URLField(blank=True)
    type_partenaire = models.CharField(max_length=30, choices=TypePartenaire.choices, default=TypePartenaire.AUTRE)
    ordre_affichage = models.PositiveSmallIntegerField(default=0)
    statut = models.CharField(max_length=20, choices=Statut.choices, default=Statut.ACTIF)
    date_ajout = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["ordre_affichage", "nom_partenaire"]

    def __str__(self) -> str:
        return self.nom_partenaire
