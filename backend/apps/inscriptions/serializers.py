from rest_framework import serializers

from apps.inscriptions.models import Inscription
from apps.mentorat.models import MentorshipPeriod
from apps.mentorat.services import validate_mentor_for_mentore_level
from apps.users.models import Role, Utilisateur
from apps.users.serializers import UtilisateurLiteSerializer, validate_level_for_profile, validate_phone_number


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
        read_only_fields = [
            "date_inscription",
            "registration_status",
            "completed_session_status",
        ]


class BasePublicInscriptionSerializer(serializers.Serializer):
    nom = serializers.CharField(max_length=150)
    prenom = serializers.CharField(max_length=150, required=False, allow_blank=True)
    email = serializers.EmailField()
    telephone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    langue_preferee = serializers.ChoiceField(choices=Utilisateur.Langue.choices, default=Utilisateur.Langue.FR)
    region = serializers.CharField(max_length=150, required=False, allow_blank=True)
    niveau_academique = serializers.PrimaryKeyRelatedField(queryset=Utilisateur._meta.get_field("niveau_academique").remote_field.model.objects.all())
    mentorship_period = serializers.PrimaryKeyRelatedField(
        queryset=MentorshipPeriod.objects.filter(
            status__in=[
                MentorshipPeriod.Status.DRAFT,
                MentorshipPeriod.Status.ACTIVE,
            ]
        ),
        required=False,
        allow_null=True,
    )
    consentement = serializers.BooleanField()

    profil_mentorat: str
    role_nom: str

    def validate_telephone(self, value: str) -> str:
        return validate_phone_number(value)

    def validate_email(self, value: str) -> str:
        email = Utilisateur.objects.normalize_email(value)
        if Utilisateur.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("Un compte existe déjà avec cette adresse courriel.")
        return email

    def validate_consentement(self, value: bool) -> bool:
        if not value:
            raise serializers.ValidationError("Le consentement est obligatoire pour finaliser l'inscription.")
        return value

    def validate(self, attrs):
        validate_level_for_profile(attrs.get("niveau_academique"), self.profil_mentorat)
        return attrs

    def get_role(self) -> Role:
        role, _ = Role.objects.get_or_create(nom=self.role_nom)
        return role

    def build_user_payload(self, validated_data):
        return {
            "nom": validated_data["nom"],
            "prenom": validated_data.get("prenom", ""),
            "email": validated_data["email"],
            "telephone": validated_data.get("telephone", ""),
            "langue_preferee": validated_data.get("langue_preferee", Utilisateur.Langue.FR),
            "region": validated_data.get("region", ""),
            "niveau_academique": validated_data["niveau_academique"],
            "profil_mentorat": self.profil_mentorat,
            "role": self.get_role(),
            "statut_compte": Utilisateur.StatutCompte.EN_ATTENTE,
            "is_active": True,
        }


class MentorInscriptionSerializer(BasePublicInscriptionSerializer):
    mini_bio = serializers.CharField(required=False, allow_blank=True)
    profil_mentorat = Utilisateur.ProfilMentorat.MENTOR
    role_nom = Role.Nom.MENTOR

    def create(self, validated_data):
        period = validated_data.get("mentorship_period")
        user_payload = self.build_user_payload(validated_data)
        user_payload["mini_bio"] = validated_data.get("mini_bio", "")
        user_payload["capacite_mentorat"] = period.max_mentees_per_mentor if period else 5
        utilisateur = Utilisateur.objects.create_user(**user_payload)
        return Inscription.objects.create(
            utilisateur=utilisateur,
            type_inscription=Inscription.TypeInscription.MENTOR,
            consentement=validated_data["consentement"],
            mentorship_period=period,
        )


class MentoreInscriptionSerializer(BasePublicInscriptionSerializer):
    mentor_choisi = serializers.PrimaryKeyRelatedField(
        queryset=Utilisateur.objects.filter(
            profil_mentorat__in=[
                Utilisateur.ProfilMentorat.MENTOR,
                Utilisateur.ProfilMentorat.MENTOR_ET_MENTORE,
            ]
        ),
        required=False,
        allow_null=True,
    )
    wants_association_assignment = serializers.BooleanField(required=False, default=False)
    profil_mentorat = Utilisateur.ProfilMentorat.MENTORE
    role_nom = Role.Nom.MENTORE

    def validate(self, attrs):
        attrs = super().validate(attrs)
        mentor = attrs.get("mentor_choisi")
        wants_association_assignment = attrs.get("wants_association_assignment", False)
        if mentor and wants_association_assignment:
            attrs["mentor_choisi"] = None
        if mentor:
            validate_mentor_for_mentore_level(mentor, attrs["niveau_academique"], attrs.get("mentorship_period"))
        return attrs

    def create(self, validated_data):
        period = validated_data.get("mentorship_period")
        mentor = validated_data.get("mentor_choisi")
        wants_association_assignment = bool(validated_data.get("wants_association_assignment") or not mentor)
        utilisateur = Utilisateur.objects.create_user(**self.build_user_payload(validated_data))
        return Inscription.objects.create(
            utilisateur=utilisateur,
            type_inscription=Inscription.TypeInscription.MENTORE,
            consentement=validated_data["consentement"],
            mentor_choisi=mentor,
            mentorship_period=period,
            wants_association_assignment=wants_association_assignment,
            needs_matching=wants_association_assignment,
            registration_status=(
                Inscription.RegistrationStatus.PENDING_MATCHING
                if wants_association_assignment
                else Inscription.RegistrationStatus.REGISTERED
            ),
        )
