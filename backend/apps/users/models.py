import secrets
import uuid
from datetime import timedelta

from django.contrib.auth.hashers import check_password, make_password
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


DEFAULT_MENTORAT_PASSWORD = "mentor123"
MENTOR_ACADEMIC_LEVEL_ORDERS = {2, 3, 4}
MENTOREE_ACADEMIC_LEVEL_ORDERS = {1, 2, 3}


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
    code = models.CharField(max_length=50, unique=True, null=True, blank=True)
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
        if not password and extra_fields.get("profil_mentorat"):
            password = DEFAULT_MENTORAT_PASSWORD
        utilisateur = self.model(email=email, **extra_fields)
        if password:
            utilisateur.set_password(password)
        else:
            utilisateur.set_unusable_password()
        utilisateur.full_clean()
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
        SUSPENDU = "SUSPENDU", "Suspendu"

    class StatutProfilPublic(models.TextChoices):
        NON_SOUMIS = "NON_SOUMIS", "Non soumis"
        EN_ATTENTE = "EN_ATTENTE", "En attente"
        VALIDE = "VALIDE", "Valide"
        REFUSE = "REFUSE", "Refuse"

    nom = models.CharField(max_length=150)
    prenom = models.CharField(max_length=150, blank=True)
    email = models.EmailField(unique=True)
    telephone = models.CharField(max_length=30, blank=True)
    langue_preferee = models.CharField(max_length=2, choices=Langue.choices, default=Langue.FR)
    region = models.CharField(max_length=150, blank=True)
    disponibilite = models.TextField(blank=True)
    objectifs = models.TextField(blank=True)
    mini_bio = models.TextField(blank=True)
    profile_photo = models.ImageField(upload_to="mentor_profiles/", blank=True, null=True)
    domaine_specialite = models.CharField(max_length=180, blank=True)
    wants_to_appear_on_team_page = models.BooleanField(default=False)
    is_team_approved = models.BooleanField(default=False)
    team_display_order = models.PositiveSmallIntegerField(default=0)
    can_appear_on_about_page = models.BooleanField(default=False)
    public_title = models.CharField(max_length=120, blank=True)
    public_description = models.TextField(blank=True)
    public_photo = models.ImageField(upload_to="admin_profiles/", blank=True, null=True)
    is_public_profile_approved = models.BooleanField(default=False)
    public_profile_updated_at = models.DateTimeField(null=True, blank=True)
    pending_public_validation = models.BooleanField(default=False)
    public_profile_status = models.CharField(
        max_length=20,
        choices=StatutProfilPublic.choices,
        default=StatutProfilPublic.NON_SOUMIS,
    )
    approved_public_prenom = models.CharField(max_length=150, blank=True)
    approved_public_nom = models.CharField(max_length=150, blank=True)
    approved_public_title = models.CharField(max_length=120, blank=True)
    approved_public_description = models.TextField(blank=True)
    approved_public_photo = models.ImageField(upload_to="admin_profiles/approved/", blank=True, null=True)
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
    REQUIRED_FIELDS = ["nom"]

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

    @property
    def requiert_double_authentification(self) -> bool:
        return self.est_administrateur or self.est_mentor

    def snapshot_public_profile(self):
        self.approved_public_prenom = self.prenom
        self.approved_public_nom = self.nom
        self.approved_public_title = self.public_title
        self.approved_public_description = self.public_description
        self.approved_public_photo = self.public_photo

    def mark_public_profile_pending(self):
        self.pending_public_validation = True
        self.is_public_profile_approved = False
        self.public_profile_status = self.StatutProfilPublic.EN_ATTENTE
        self.public_profile_updated_at = timezone.now()
        self.can_appear_on_about_page = True

    def approve_public_profile(self):
        self.snapshot_public_profile()
        self.pending_public_validation = False
        self.is_public_profile_approved = True
        self.can_appear_on_about_page = True
        self.public_profile_status = self.StatutProfilPublic.VALIDE
        self.public_profile_updated_at = timezone.now()

    def reject_public_profile(self):
        self.pending_public_validation = False
        self.is_public_profile_approved = False
        self.can_appear_on_about_page = False
        self.public_profile_status = self.StatutProfilPublic.REFUSE
        self.public_profile_updated_at = timezone.now()

    @classmethod
    def profil_inclut_mentor(cls, profil: str | None) -> bool:
        return profil in {
            cls.ProfilMentorat.MENTOR,
            cls.ProfilMentorat.MENTOR_ET_MENTORE,
        }

    @classmethod
    def profil_inclut_mentore(cls, profil: str | None) -> bool:
        return profil in {
            cls.ProfilMentorat.MENTORE,
            cls.ProfilMentorat.MENTOR_ET_MENTORE,
        }

    @staticmethod
    def niveau_autorise_pour_mentor(niveau: NiveauAcademique | None) -> bool:
        return bool(niveau and niveau.ordre_niveau in MENTOR_ACADEMIC_LEVEL_ORDERS)

    @staticmethod
    def niveau_autorise_pour_mentore(niveau: NiveauAcademique | None) -> bool:
        return bool(niveau and niveau.ordre_niveau in MENTOREE_ACADEMIC_LEVEL_ORDERS)

    def capacite_effective(self, period=None) -> int:
        if period is not None and getattr(period, "max_mentees_per_mentor", None):
            limite_systeme = max(int(period.max_mentees_per_mentor), 1)
        else:
            from apps.parametres.models import ParametreSysteme

            limite_systeme = ParametreSysteme.get_int("MAX_MENTORES_PAR_MENTOR", 5)
        capacite_personnelle = self.capacite_mentorat or limite_systeme
        return min(capacite_personnelle, limite_systeme)

    def capacite_restante(self, period=None) -> int:
        if not self.est_mentor:
            return 0
        if period is not None:
            from apps.mentorat.models import MentorshipAssignment

            active_count = MentorshipAssignment.objects.filter(
                mentor=self,
                period=period,
                status=MentorshipAssignment.Status.ACTIVE,
            ).count()
        else:
            active_count = self.nombre_mentores_actuels
        return max(self.capacite_effective(period) - active_count, 0)

    def clean(self):
        super().clean()
        if self.pk and self.niveau_academique_id:
            ancien_niveau_id = (
                type(self)
                .objects.filter(pk=self.pk)
                .values_list("niveau_academique_id", flat=True)
                .first()
            )
            if ancien_niveau_id and ancien_niveau_id != self.niveau_academique_id:
                ancien_niveau = NiveauAcademique.objects.filter(pk=ancien_niveau_id).first()
                if ancien_niveau and self.niveau_academique.ordre_niveau < ancien_niveau.ordre_niveau:
                    raise ValidationError(
                        {"niveau_academique": "Le niveau academique ne peut pas diminuer."}
                    )

        if self.can_appear_on_about_page and not self.public_title.strip():
            raise ValidationError(
                {"public_title": "Le titre public est obligatoire pour apparaitre sur la page A propos."}
            )

        if not self.niveau_academique or not self.profil_mentorat:
            return

        if self.profil_inclut_mentor(self.profil_mentorat) and not self.niveau_autorise_pour_mentor(
            self.niveau_academique
        ):
            message = (
                "Impossible de rendre mentor une personne au secondaire."
                if self.niveau_academique.est_premier_niveau or self.niveau_academique.ordre_niveau == 1
                else "Ce niveau academique n'est pas autorise pour un mentor."
            )
            raise ValidationError(
                {"niveau_academique": message}
            )
        if self.profil_inclut_mentore(self.profil_mentorat) and not self.niveau_autorise_pour_mentore(
            self.niveau_academique
        ):
            message = (
                "Impossible de rendre mentore une personne en medecine."
                if self.niveau_academique.est_dernier_niveau or self.niveau_academique.ordre_niveau == 4
                else "Ce niveau academique n'est pas autorise pour un mentore."
            )
            raise ValidationError(
                {"niveau_academique": message}
            )

        if self.wants_to_appear_on_team_page:
            errors = {}
            if not self.niveau_academique:
                errors["niveau_academique"] = "Le niveau academique est obligatoire pour apparaitre sur la page Equipes."
            if not self.domaine_specialite.strip():
                errors["domaine_specialite"] = "Le domaine ou la specialite est obligatoire."
            if not self.profile_photo:
                errors["profile_photo"] = "La photo est obligatoire pour apparaitre sur la page Equipes."
            if not self.mini_bio.strip():
                errors["mini_bio"] = "La mini bio est obligatoire pour apparaitre sur la page Equipes."
            if errors:
                raise ValidationError(errors)

        if self.is_team_approved and self.team_display_order < 1:
            raise ValidationError(
                {"team_display_order": "L'ordre d'affichage doit etre superieur a 0."}
            )


class LoginVerificationCode(models.Model):
    CODE_TTL_MINUTES = 15

    user = models.ForeignKey(
        Utilisateur,
        on_delete=models.CASCADE,
        related_name="login_verification_codes",
    )
    challenge_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    code_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["challenge_id", "used_at", "expires_at"]),
            models.Index(fields=["user", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"Code de connexion pour {self.user.email}"

    @property
    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    @property
    def is_used(self) -> bool:
        return self.used_at is not None

    @classmethod
    def create_for_user(cls, user: Utilisateur) -> tuple["LoginVerificationCode", str]:
        code = f"{secrets.randbelow(1_000_000):06d}"
        challenge = cls.objects.create(
            user=user,
            code_hash=make_password(code),
            expires_at=timezone.now() + timedelta(minutes=cls.CODE_TTL_MINUTES),
        )
        return challenge, code

    def check_code(self, code: str) -> bool:
        return not self.is_used and not self.is_expired and check_password(code, self.code_hash)

    def mark_used(self):
        self.used_at = timezone.now()
        self.save(update_fields=["used_at"])
