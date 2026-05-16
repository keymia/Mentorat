from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from apps.inscriptions.models import Inscription
from apps.mentorat.models import MentorshipAssignment, MentorshipPeriod
from apps.mentorat.services import get_mentors_disponibles_for_niveau, validate_mentor_for_mentore_level
from apps.users.models import NiveauAcademique, Role, Utilisateur
from apps.users.serializers import UtilisateurLiteSerializer, validate_phone_number


class InscriptionSerializer(serializers.ModelSerializer):
    utilisateur_detail = UtilisateurLiteSerializer(source="utilisateur", read_only=True)
    mentor_choisi_detail = UtilisateurLiteSerializer(source="mentor_choisi", read_only=True)
    mentorship_period_title = serializers.CharField(source="mentorship_period.title", read_only=True)

    class Meta:
        model = Inscription
        fields = [
            "id",
            "utilisateur",
            "utilisateur_detail",
            "type_inscription",
            "statut_inscription",
            "consentement",
            "date_inscription",
            "mentor_choisi",
            "mentor_choisi_detail",
            "mentorship_period",
            "mentorship_period_title",
            "wants_association_assignment",
            "needs_matching",
            "registration_status",
            "completed_session_status",
        ]
        read_only_fields = ["date_inscription"]


def available_periods_queryset():
    return MentorshipPeriod.objects.filter(
        status__in=[MentorshipPeriod.Status.DRAFT, MentorshipPeriod.Status.ACTIVE]
    )


class MentorInscriptionSerializer(serializers.Serializer):
    nom = serializers.CharField(max_length=150)
    prenom = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    telephone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    langue_preferee = serializers.ChoiceField(choices=Utilisateur.Langue.choices, default=Utilisateur.Langue.FR)
    region = serializers.CharField(max_length=150, required=False, allow_blank=True)
    niveau_academique = serializers.PrimaryKeyRelatedField(
        queryset=NiveauAcademique.objects.filter(ordre_niveau__in=[2, 3, 4])
    )
    disponibilite = serializers.CharField(required=False, allow_blank=True)
    mini_bio = serializers.CharField(required=False, allow_blank=True)
    capacite_mentorat = serializers.IntegerField(min_value=1, required=False)
    mentorship_period = serializers.PrimaryKeyRelatedField(queryset=available_periods_queryset())
    consentement = serializers.BooleanField()

    def validate_telephone(self, value):
        return validate_phone_number(value)

    def validate(self, attrs):
        if not attrs["consentement"]:
            raise serializers.ValidationError({"consentement": "Le consentement est obligatoire."})
        if Utilisateur.objects.filter(email=attrs["email"]).exists():
            raise serializers.ValidationError({"email": "Un utilisateur avec cet email existe deja."})
        niveau = attrs["niveau_academique"]
        if not Utilisateur.niveau_autorise_pour_mentor(niveau):
            raise serializers.ValidationError(
                {"niveau_academique": "Ce niveau academique n'est pas autorise pour un mentor."}
            )
        limite_systeme = attrs["mentorship_period"].max_mentees_per_mentor
        attrs["capacite_mentorat"] = attrs.get("capacite_mentorat") or limite_systeme
        if attrs["capacite_mentorat"] > limite_systeme:
            raise serializers.ValidationError(
                {
                    "capacite_mentorat": (
                        f"La capacite ne peut pas depasser le maximum autorise de {limite_systeme} mentores."
                    )
                }
            )
        return attrs

    def create(self, validated_data):
        consentement = validated_data.pop("consentement")
        mentorship_period = validated_data.pop("mentorship_period")
        role, _ = Role.objects.get_or_create(
            nom=Role.Nom.MENTOR,
            defaults={"description": "Utilisateur mentor."},
        )
        utilisateur = Utilisateur.objects.create_user(
            role=role,
            profil_mentorat=Utilisateur.ProfilMentorat.MENTOR,
            statut_compte=Utilisateur.StatutCompte.ACTIF,
            is_active=True,
            **validated_data,
        )
        return Inscription.objects.create(
            utilisateur=utilisateur,
            type_inscription=Inscription.TypeInscription.MENTOR,
            statut_inscription=Inscription.StatutInscription.VALIDEE,
            consentement=consentement,
            mentorship_period=mentorship_period,
            registration_status=Inscription.RegistrationStatus.REGISTERED,
        )


class MentoreInscriptionSerializer(serializers.Serializer):
    nom = serializers.CharField(max_length=150)
    prenom = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    telephone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    langue_preferee = serializers.ChoiceField(choices=Utilisateur.Langue.choices, default=Utilisateur.Langue.FR)
    region = serializers.CharField(max_length=150, required=False, allow_blank=True)
    niveau_academique = serializers.PrimaryKeyRelatedField(
        queryset=NiveauAcademique.objects.filter(ordre_niveau__in=[1, 2, 3])
    )
    objectifs = serializers.CharField(required=False, allow_blank=True)
    mentor_choisi = serializers.PrimaryKeyRelatedField(
        queryset=Utilisateur.objects.all(),
        required=False,
        allow_null=True,
    )
    mentorship_period = serializers.PrimaryKeyRelatedField(queryset=available_periods_queryset())
    wants_association_assignment = serializers.BooleanField(default=False)
    consentement = serializers.BooleanField()

    def validate_telephone(self, value):
        return validate_phone_number(value)

    def validate(self, attrs):
        if not attrs["consentement"]:
            raise serializers.ValidationError({"consentement": "Le consentement est obligatoire."})
        if Utilisateur.objects.filter(email=attrs["email"]).exists():
            raise serializers.ValidationError({"email": "Un utilisateur avec cet email existe deja."})
        niveau = attrs["niveau_academique"]
        if not Utilisateur.niveau_autorise_pour_mentore(niveau):
            raise serializers.ValidationError(
                {"niveau_academique": "Ce niveau academique n'est pas autorise pour un mentore."}
            )
        mentor = attrs.get("mentor_choisi")
        wants_association_assignment = attrs.get("wants_association_assignment", False)
        if mentor:
            validate_mentor_for_mentore_level(mentor, niveau, attrs["mentorship_period"])
        elif not wants_association_assignment:
            compatible_mentors = get_mentors_disponibles_for_niveau(niveau.id, attrs["mentorship_period"].id)
            if compatible_mentors:
                raise serializers.ValidationError(
                    {
                            "mentor_choisi": (
                            "Choisissez un mentor disponible ou l'option "
                            "Laisser l'association choisir mon mentor."
                        )
                    }
                )
        return attrs

    def create(self, validated_data):
        consentement = validated_data.pop("consentement")
        mentor_choisi = validated_data.pop("mentor_choisi", None)
        mentorship_period = validated_data.pop("mentorship_period")
        wants_association_assignment = validated_data.pop("wants_association_assignment", False)
        niveau = validated_data["niveau_academique"]
        profil = (
            Utilisateur.ProfilMentorat.MENTORE
            if niveau.est_premier_niveau
            else Utilisateur.ProfilMentorat.MENTOR_ET_MENTORE
        )
        role, _ = Role.objects.get_or_create(
            nom=Role.Nom.MENTORE,
            defaults={"description": "Utilisateur mentore."},
        )
        utilisateur = Utilisateur.objects.create_user(
            role=role,
            profil_mentorat=profil,
            statut_compte=Utilisateur.StatutCompte.ACTIF,
            is_active=True,
            capacite_mentorat=0,
            **validated_data,
        )
        needs_matching = bool(wants_association_assignment or not mentor_choisi)
        registration_status = (
            Inscription.RegistrationStatus.PENDING_MATCHING
            if needs_matching
            else Inscription.RegistrationStatus.MATCHED
        )
        inscription = Inscription.objects.create(
            utilisateur=utilisateur,
            type_inscription=Inscription.TypeInscription.MENTORE,
            statut_inscription=Inscription.StatutInscription.VALIDEE,
            consentement=consentement,
            mentor_choisi=mentor_choisi,
            mentorship_period=mentorship_period,
            wants_association_assignment=wants_association_assignment,
            needs_matching=needs_matching,
            registration_status=registration_status,
        )
        if mentor_choisi:
            try:
                MentorshipAssignment.objects.create(
                    mentor=mentor_choisi,
                    mentoree=utilisateur,
                    period=mentorship_period,
                    status=MentorshipAssignment.Status.ACTIVE,
                    admin_notes="Affectation creee automatiquement a l'inscription.",
                )
            except DjangoValidationError as exc:
                inscription.needs_matching = True
                inscription.registration_status = Inscription.RegistrationStatus.PENDING_MATCHING
                inscription.save(update_fields=["needs_matching", "registration_status"])
                raise serializers.ValidationError(
                    exc.message_dict if hasattr(exc, "message_dict") else exc.messages
                ) from exc
            inscription.needs_matching = False
            inscription.registration_status = Inscription.RegistrationStatus.MATCHED
            inscription.save(update_fields=["needs_matching", "registration_status"])
        return inscription
