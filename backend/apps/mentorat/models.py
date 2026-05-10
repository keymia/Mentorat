from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from django.utils import timezone


class MentorProfile(models.Model):
    class SessionDuration(models.IntegerChoices):
        MIN_30 = 30, "30 minutes"
        MIN_45 = 45, "45 minutes"
        MIN_60 = 60, "60 minutes"
        MIN_90 = 90, "90 minutes"

    mentor = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mentor_profile",
    )
    max_mentores = models.PositiveSmallIntegerField(default=5)
    max_sessions_per_week = models.PositiveSmallIntegerField(default=3)
    default_session_duration = models.PositiveSmallIntegerField(
        choices=SessionDuration.choices,
        default=SessionDuration.MIN_60,
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["mentor__nom", "mentor__prenom"]

    def __str__(self) -> str:
        return f"Profil disponibilites de {self.mentor}"

    def clean(self):
        super().clean()
        if self.mentor_id and not self.mentor.est_mentor:
            raise ValidationError({"mentor": "Le profil doit etre lie a un utilisateur mentor."})
        if self.max_mentores < 1:
            raise ValidationError({"max_mentores": "La capacite maximale doit etre superieure a 0."})
        if self.max_sessions_per_week < 1:
            raise ValidationError(
                {"max_sessions_per_week": "Le nombre maximal de seances par semaine doit etre superieur a 0."}
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class MentorAvailability(models.Model):
    class Weekday(models.IntegerChoices):
        MONDAY = 0, "Lundi"
        TUESDAY = 1, "Mardi"
        WEDNESDAY = 2, "Mercredi"
        THURSDAY = 3, "Jeudi"
        FRIDAY = 4, "Vendredi"
        SATURDAY = 5, "Samedi"
        SUNDAY = 6, "Dimanche"

    mentor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="weekly_availabilities",
    )
    weekday = models.PositiveSmallIntegerField(choices=Weekday.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_active = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["mentor__nom", "weekday", "start_time"]
        indexes = [
            models.Index(fields=["mentor", "weekday", "is_active"]),
        ]

    def __str__(self) -> str:
        return f"{self.mentor} - {self.get_weekday_display()} {self.start_time}-{self.end_time}"

    def clean(self):
        super().clean()
        if self.mentor_id and not self.mentor.est_mentor:
            raise ValidationError({"mentor": "La disponibilite doit etre liee a un utilisateur mentor."})
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError({"end_time": "L'heure de fin doit etre posterieure a l'heure de debut."})
        if not self.mentor_id or self.weekday is None or not self.start_time or not self.end_time:
            return

        chevauchement = (
            MentorAvailability.objects.filter(
                mentor=self.mentor,
                weekday=self.weekday,
                start_time__lt=self.end_time,
                end_time__gt=self.start_time,
            )
            .exclude(pk=self.pk)
            .exists()
        )
        if chevauchement:
            raise ValidationError(
                {"start_time": "Cette plage chevauche deja une disponibilite du meme mentor pour ce jour."}
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class MentorAvailabilityException(models.Model):
    mentor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="availability_exceptions",
    )
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-start_date", "-end_date"]
        indexes = [
            models.Index(fields=["mentor", "start_date", "end_date"]),
        ]

    def __str__(self) -> str:
        return f"{self.mentor} indisponible du {self.start_date} au {self.end_date}"

    def clean(self):
        super().clean()
        if self.mentor_id and not self.mentor.est_mentor:
            raise ValidationError({"mentor": "L'exception doit etre liee a un utilisateur mentor."})
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValidationError({"end_date": "La date de fin doit etre posterieure ou egale a la date de debut."})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class SessionBooking(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "En attente"
        CONFIRMED = "confirmed", "Confirmee"
        CANCELLED = "cancelled", "Annulee"
        COMPLETED = "completed", "Terminee"

    BLOCKING_STATUSES = [Status.PENDING, Status.CONFIRMED]

    mentor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="session_bookings_as_mentor",
    )
    mentore = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="session_bookings_as_mentore",
    )
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-starts_at"]
        indexes = [
            models.Index(fields=["mentor", "starts_at", "ends_at", "status"]),
            models.Index(fields=["mentore", "starts_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.mentor} / {self.mentore} - {self.starts_at}"

    def clean(self):
        super().clean()
        if self.starts_at and timezone.is_naive(self.starts_at):
            self.starts_at = timezone.make_aware(self.starts_at, timezone.get_current_timezone())
        if self.ends_at and timezone.is_naive(self.ends_at):
            self.ends_at = timezone.make_aware(self.ends_at, timezone.get_current_timezone())

        if self.starts_at and self.ends_at and self.starts_at >= self.ends_at:
            raise ValidationError({"ends_at": "La fin de seance doit etre posterieure au debut."})
        if self.mentor_id and self.mentore_id and self.mentor_id == self.mentore_id:
            raise ValidationError("Un mentor ne peut pas reserver une seance avec lui-meme.")
        if self.mentor_id and not self.mentor.est_mentor:
            raise ValidationError({"mentor": "L'utilisateur selectionne n'a pas un profil mentor."})
        if self.mentore_id and not self.mentore.est_mentore:
            raise ValidationError({"mentore": "L'utilisateur selectionne n'a pas un profil mentore."})
        if not self.mentor_id or not self.mentore_id or not self.starts_at or not self.ends_at:
            return

        if self.status in self.BLOCKING_STATUSES:
            from apps.mentorat.services import validate_session_booking

            validate_session_booking(self)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class MentorshipPeriod(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Brouillon"
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Terminee"
        ARCHIVED = "archived", "Archivee"

    title = models.CharField(max_length=180)
    description = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    required_sessions = models.PositiveSmallIntegerField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-start_date", "title"]
        indexes = [
            models.Index(fields=["status", "start_date", "end_date"]),
        ]

    def __str__(self) -> str:
        return f"{self.title} ({self.start_date} - {self.end_date})"

    def clean(self):
        super().clean()
        if self.start_date and self.end_date and self.start_date >= self.end_date:
            raise ValidationError({"end_date": "La date de fin doit etre posterieure a la date de debut."})
        if self.required_sessions is not None and self.required_sessions <= 0:
            raise ValidationError({"required_sessions": "Le nombre de seances obligatoires doit etre superieur a 0."})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class MentorshipAssignment(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        COMPLETED = "completed", "Terminee"
        SUSPENDED = "suspended", "Suspendue"

    mentor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mentorship_assignments_as_mentor",
    )
    mentoree = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mentorship_assignments_as_mentoree",
    )
    period = models.ForeignKey(
        MentorshipPeriod,
        on_delete=models.PROTECT,
        related_name="assignments",
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    admin_notes = models.TextField(blank=True)
    assigned_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-assigned_at"]
        indexes = [
            models.Index(fields=["mentor", "period", "status"]),
            models.Index(fields=["mentoree", "period", "status"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["mentoree", "period"],
                condition=Q(status="active"),
                name="unique_active_assignment_per_mentoree_period",
            )
        ]

    def __str__(self) -> str:
        return f"{self.mentor} -> {self.mentoree} ({self.period})"

    def clean(self):
        super().clean()
        from apps.users.models import Utilisateur

        if self.mentor_id and self.mentoree_id and self.mentor_id == self.mentoree_id:
            raise ValidationError("Un utilisateur ne peut pas etre son propre mentor.")

        if not self.mentor_id or not self.mentoree_id or not self.period_id:
            return

        if not self.mentor.est_mentor:
            raise ValidationError({"mentor": "Le mentor doit avoir le profil MENTOR ou MENTOR_ET_MENTORE."})
        if self.mentor.statut_compte != Utilisateur.StatutCompte.ACTIF or not self.mentor.is_active:
            raise ValidationError({"mentor": "Le mentor doit etre actif."})
        if not self.mentoree.est_mentore:
            raise ValidationError({"mentoree": "Le mentore doit avoir le profil MENTORE ou MENTOR_ET_MENTORE."})
        if self.mentoree.statut_compte != Utilisateur.StatutCompte.ACTIF or not self.mentoree.is_active:
            raise ValidationError({"mentoree": "Le mentore doit etre actif."})

        if not self.mentor.niveau_academique_id or not self.mentoree.niveau_academique_id:
            raise ValidationError("Le mentor et le mentore doivent avoir un niveau academique.")

        ordre_attendu = self.mentoree.niveau_academique.ordre_niveau + 1
        if self.mentor.niveau_academique.ordre_niveau != ordre_attendu:
            raise ValidationError({"mentor": "Le mentor doit appartenir au niveau academique superieur direct."})

        if self.status == self.Status.ACTIVE:
            existe_deja = (
                MentorshipAssignment.objects.filter(
                    mentoree=self.mentoree,
                    period=self.period,
                    status=self.Status.ACTIVE,
                )
                .exclude(pk=self.pk)
                .exists()
            )
            if existe_deja:
                raise ValidationError({"mentoree": "Ce mentore a deja une affectation active pour cette periode."})

            active_count = (
                MentorshipAssignment.objects.filter(
                    mentor=self.mentor,
                    period=self.period,
                    status=self.Status.ACTIVE,
                )
                .exclude(pk=self.pk)
                .count()
            )
            if active_count >= self.mentor.capacite_effective():
                raise ValidationError({"mentor": "Le mentor a atteint sa capacite maximale."})

    def save(self, *args, **kwargs):
        old_mentor_id = None
        if self.pk:
            old_mentor_id = (
                MentorshipAssignment.objects.filter(pk=self.pk).values_list("mentor_id", flat=True).first()
            )
        self.full_clean()
        super().save(*args, **kwargs)
        self.actualiser_nombre_mentores(self.mentor_id)
        if old_mentor_id and old_mentor_id != self.mentor_id:
            self.actualiser_nombre_mentores(old_mentor_id)

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

        total = cls.objects.filter(mentor_id=mentor_id, status=cls.Status.ACTIVE).count()
        Utilisateur.objects.filter(pk=mentor_id).update(nombre_mentores_actuels=total)


class MentorshipSession(models.Model):
    class Status(models.TextChoices):
        SCHEDULED = "scheduled", "Programmee"
        COMPLETED = "completed", "Realisee"
        CANCELLED = "cancelled", "Annulee"
        POSTPONED = "postponed", "Reportee"
        ABSENT = "absent", "Absente"

    assignment = models.ForeignKey(
        MentorshipAssignment,
        on_delete=models.CASCADE,
        related_name="sessions",
    )
    session_number = models.PositiveSmallIntegerField()
    scheduled_date = models.DateField()
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED)
    summary = models.TextField(blank=True)
    mentor_comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["scheduled_date", "start_time", "session_number"]
        indexes = [
            models.Index(fields=["assignment", "status"]),
            models.Index(fields=["scheduled_date", "status"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["assignment", "session_number"],
                name="unique_session_number_per_assignment",
            )
        ]

    def __str__(self) -> str:
        return f"Seance {self.session_number} - {self.assignment}"

    def clean(self):
        super().clean()
        if self.session_number is not None and self.session_number <= 0:
            raise ValidationError({"session_number": "Le numero de seance doit etre superieur a 0."})
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError({"end_time": "L'heure de fin doit etre posterieure a l'heure de debut."})
        if not self.assignment_id:
            return
        period = self.assignment.period
        if self.scheduled_date and not (period.start_date <= self.scheduled_date <= period.end_date):
            raise ValidationError({"scheduled_date": "La seance doit etre planifiee dans la periode de mentorat."})
        if self.session_number and self.session_number > period.required_sessions:
            raise ValidationError({"session_number": "Le numero de seance depasse le nombre prevu pour la periode."})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class MentoreeProgress(models.Model):
    class ProgressStatus(models.TextChoices):
        EXCELLENT = "excellent", "Excellent"
        GOOD = "good", "Bon"
        AVERAGE = "average", "Moyen"
        WATCH = "watch", "A surveiller"
        DIFFICULTY = "difficulty", "En difficulte"

    assignment = models.OneToOneField(
        MentorshipAssignment,
        on_delete=models.CASCADE,
        related_name="progress",
    )
    progress_status = models.CharField(
        max_length=20,
        choices=ProgressStatus.choices,
        default=ProgressStatus.AVERAGE,
    )
    progress_percentage = models.PositiveSmallIntegerField(null=True, blank=True)
    difficulties = models.TextField(blank=True)
    achievements = models.TextField(blank=True)
    recommendations = models.TextField(blank=True)
    mentor_opinion = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["assignment__mentoree__nom", "assignment__mentoree__prenom"]

    def __str__(self) -> str:
        return f"Suivi - {self.assignment}"

    def clean(self):
        super().clean()
        if (
            self.progress_percentage is not None
            and not 0 <= self.progress_percentage <= 100
        ):
            raise ValidationError({"progress_percentage": "La progression doit etre entre 0 et 100."})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


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
