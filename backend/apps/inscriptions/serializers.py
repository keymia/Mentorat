from rest_framework import serializers

from apps.inscriptions.models import Inscription
from apps.mentorat.services import validate_mentor_for_mentore_level
from apps.parametres.models import ParametreSysteme
from apps.users.models import NiveauAcademique, Role, Utilisateur
from apps.users.serializers import UtilisateurLiteSerializer


class InscriptionSerializer(serializers.ModelSerializer):
    utilisateur_detail = UtilisateurLiteSerializer(source="utilisateur", read_only=True)
    mentor_choisi_detail = UtilisateurLiteSerializer(source="mentor_choisi", read_only=True)

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
        ]
        read_only_fields = ["date_inscription"]


class MentorInscriptionSerializer(serializers.Serializer):
    nom = serializers.CharField(max_length=150)
    prenom = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    telephone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    langue_preferee = serializers.ChoiceField(choices=Utilisateur.Langue.choices, default=Utilisateur.Langue.FR)
    region = serializers.CharField(max_length=150, required=False, allow_blank=True)
    niveau_academique = serializers.PrimaryKeyRelatedField(queryset=NiveauAcademique.objects.all())
    disponibilite = serializers.CharField(required=False, allow_blank=True)
    objectifs = serializers.CharField(required=False, allow_blank=True)
    capacite_mentorat = serializers.IntegerField(min_value=1)
    consentement = serializers.BooleanField()

    def validate(self, attrs):
        if not attrs["consentement"]:
            raise serializers.ValidationError({"consentement": "Le consentement est obligatoire."})
        if Utilisateur.objects.filter(email=attrs["email"]).exists():
            raise serializers.ValidationError({"email": "Un utilisateur avec cet email existe deja."})
        niveau = attrs["niveau_academique"]
        if niveau.est_premier_niveau:
            raise serializers.ValidationError(
                {"niveau_academique": "Les eleves du premier niveau peuvent seulement etre mentores."}
            )
        limite_systeme = ParametreSysteme.get_int("MAX_MENTORES_PAR_MENTOR", 5)
        if attrs["capacite_mentorat"] > limite_systeme:
            raise serializers.ValidationError(
                {
                    "capacite_mentorat": (
                        f"La capacite ne peut pas depasser la limite systeme de {limite_systeme}."
                    )
                }
            )
        return attrs

    def create(self, validated_data):
        consentement = validated_data.pop("consentement")
        role, _ = Role.objects.get_or_create(
            nom=Role.Nom.MENTOR,
            defaults={"description": "Utilisateur mentor."},
        )
        utilisateur = Utilisateur.objects.create_user(
            role=role,
            profil_mentorat=Utilisateur.ProfilMentorat.MENTOR,
            statut_compte=Utilisateur.StatutCompte.EN_ATTENTE,
            **validated_data,
        )
        return Inscription.objects.create(
            utilisateur=utilisateur,
            type_inscription=Inscription.TypeInscription.MENTOR,
            consentement=consentement,
        )


class MentoreInscriptionSerializer(serializers.Serializer):
    nom = serializers.CharField(max_length=150)
    prenom = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    telephone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    langue_preferee = serializers.ChoiceField(choices=Utilisateur.Langue.choices, default=Utilisateur.Langue.FR)
    region = serializers.CharField(max_length=150, required=False, allow_blank=True)
    niveau_academique = serializers.PrimaryKeyRelatedField(queryset=NiveauAcademique.objects.all())
    objectifs = serializers.CharField(required=False, allow_blank=True)
    mentor_choisi = serializers.PrimaryKeyRelatedField(queryset=Utilisateur.objects.all())
    consentement = serializers.BooleanField()

    def validate(self, attrs):
        if not attrs["consentement"]:
            raise serializers.ValidationError({"consentement": "Le consentement est obligatoire."})
        if Utilisateur.objects.filter(email=attrs["email"]).exists():
            raise serializers.ValidationError({"email": "Un utilisateur avec cet email existe deja."})
        niveau = attrs["niveau_academique"]
        if niveau.est_dernier_niveau:
            raise serializers.ValidationError(
                {"niveau_academique": "Le dernier niveau peut seulement etre mentor."}
            )
        mentor = attrs["mentor_choisi"]
        validate_mentor_for_mentore_level(mentor, niveau)
        return attrs

    def create(self, validated_data):
        consentement = validated_data.pop("consentement")
        mentor_choisi = validated_data.pop("mentor_choisi", None)
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
            statut_compte=Utilisateur.StatutCompte.EN_ATTENTE,
            capacite_mentorat=0,
            **validated_data,
        )
        return Inscription.objects.create(
            utilisateur=utilisateur,
            type_inscription=Inscription.TypeInscription.MENTORE,
            consentement=consentement,
            mentor_choisi=mentor_choisi,
        )
