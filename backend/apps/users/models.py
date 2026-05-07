from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.exceptions import ValidationError
from django.db import models


class Role(models.Model):
    class Nom(models.TextChoices):
        ADMIN_PRINCIPAL = "ADMIN_PRINCIPAL", "Administrateur principal"
        ADMIN_OPERATIONNEL = "ADMIN_OPERATIONNEL", "Administrateur operationnel"
        MENTOR = "MENTOR", "Mentor"
        MENTORE = "MENTORE", "Mentore"

    nom = models.CharField(max_length=50, unique=True, choices=Nom.choices)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["nom"]

    def __str__(self) -> str:
        return self.get_nom_display()


class NiveauAcademique(models.Model):
    nom = models.CharField(max_length=100, unique=True)
    ordre_niveau = models.PositiveSmallIntegerField(unique=True)
    est_premier_niveau = models.BooleanField(default=False)
    est_dernier_niveau = models.BooleanField(default=False)

    class Meta:
        ordering = ["ordre_niveau"]

    def __str__(self) -> str:
        return self.nom


class UtilisateurManager(BaseUserManager):
    def create_user(self, email: str, password: str | None = None, **extra_fields):
        if not email:
            raise ValueError("L'adresse email est obligatoire.")
        email = self.normalize_email(email)
        utilisateur = self.model(email=email, **extra_fields)
        if password:
            utilisateur.set_password(password)
        else:
            utilisateur.set_unusable_password()
        utilisateur.save(using=self._db)
        return utilisateur

    def create_superuser(self, email: str, password: str | None = None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("statut_compte", Utilisateur.StatutCompte.ACTIF)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Le superutilisateur doit avoir is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Le superutilisateur doit avoir is_superuser=True.")

        role, _ = Role.objects.get_or_create(
            nom=Role.Nom.ADMIN_PRINCIPAL,
            defaults={"description": "Acces complet a la plateforme."},
        )
        extra_fields.setdefault("role", role)
        return self.create_user(email, password, **extra_fields)


class Utilisateur(AbstractBaseUser, PermissionsMixin):
    class Langue(models.TextChoices):
        FR = "FR", "Francais"
        EN = "EN", "Anglais"

    class ProfilMentorat(models.TextChoices):
        MENTOR = "MENTOR", "Mentor"
        MENTORE = "MENTORE", "Mentore"
        MENTOR_ET_MENTORE = "MENTOR_ET_MENTORE", "Mentor et mentore"

    class StatutCompte(models.TextChoices):
        EN_ATTENTE = "EN_ATTENTE", "En attente"
        ACTIF = "ACTIF", "Actif"
        INACTIF = "INACTIF", "Inactif"
        REFUSE = "REFUSE", "Refuse"
        SUSPENDU = "SUSPENDU", "Suspendu"

    nom = models.CharField(max_length=150)
    prenom = models.CharField(max_length=150)
    email = models.EmailField(unique=True)
    telephone = models.CharField(max_length=30, blank=True)
    langue_preferee = models.CharField(max_length=2, choices=Langue.choices, default=Langue.FR)
    region = models.CharField(max_length=150, blank=True)
    disponibilite = models.TextField(blank=True)
    objectifs = models.TextField(blank=True)
    profil_mentorat = models.CharField(
        max_length=20,
        choices=ProfilMentorat.choices,
        blank=True,
        null=True,
    )
    capacite_mentorat = models.PositiveSmallIntegerField(default=0)
    nombre_mentores_actuels = models.PositiveSmallIntegerField(default=0)
    statut_compte = models.CharField(
        max_length=20,
        choices=StatutCompte.choices,
        default=StatutCompte.EN_ATTENTE,
    )
    role = models.ForeignKey(Role, on_delete=models.PROTECT, related_name="utilisateurs", null=True)
    niveau_academique = models.ForeignKey(
        NiveauAcademique,
        on_delete=models.SET_NULL,
        related_name="utilisateurs",
        null=True,
        blank=True,
    )
    cree_par = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        related_name="utilisateurs_crees",
        null=True,
        blank=True,
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UtilisateurManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["nom", "prenom"]

    class Meta:
        ordering = ["nom", "prenom"]

    def __str__(self) -> str:
        return f"{self.prenom} {self.nom} <{self.email}>"

    @property
    def nom_complet(self) -> str:
        return f"{self.prenom} {self.nom}".strip()

    @property
    def est_admin_principal(self) -> bool:
        return bool(self.is_superuser or self.role and self.role.nom == Role.Nom.ADMIN_PRINCIPAL)

    @property
    def est_admin_operationnel(self) -> bool:
        return bool(self.role and self.role.nom == Role.Nom.ADMIN_OPERATIONNEL)

    @property
    def est_administrateur(self) -> bool:
        return self.est_admin_principal or self.est_admin_operationnel

    @property
    def est_mentor(self) -> bool:
        return self.profil_mentorat in {
            self.ProfilMentorat.MENTOR,
            self.ProfilMentorat.MENTOR_ET_MENTORE,
        }

    @property
    def est_mentore(self) -> bool:
        return self.profil_mentorat in {
            self.ProfilMentorat.MENTORE,
            self.ProfilMentorat.MENTOR_ET_MENTORE,
        }

    def capacite_effective(self) -> int:
        from apps.parametres.models import ParametreSysteme

        limite_systeme = ParametreSysteme.get_int("MAX_MENTORES_PAR_MENTOR", 5)
        return min(self.capacite_mentorat, limite_systeme)

    def capacite_restante(self) -> int:
        if not self.est_mentor:
            return 0
        return max(self.capacite_effective() - self.nombre_mentores_actuels, 0)

    def clean(self):
        super().clean()
        if not self.niveau_academique or not self.profil_mentorat:
            return

        if (
            self.niveau_academique.est_premier_niveau
            and self.profil_mentorat != self.ProfilMentorat.MENTORE
        ):
            raise ValidationError(
                {"profil_mentorat": "Le premier niveau academique peut seulement etre mentore."}
            )

        if (
            self.niveau_academique.est_dernier_niveau
            and self.profil_mentorat != self.ProfilMentorat.MENTOR
        ):
            raise ValidationError(
                {"profil_mentorat": "Le dernier niveau academique peut seulement etre mentor."}
            )

        if (
            not self.niveau_academique.est_premier_niveau
            and not self.niveau_academique.est_dernier_niveau
            and self.profil_mentorat == self.ProfilMentorat.MENTORE
        ):
            raise ValidationError(
                {
                    "profil_mentorat": (
                        "Un niveau intermediaire doit etre mentor seulement "
                        "ou mentor et mentore."
                    )
                }
            )
