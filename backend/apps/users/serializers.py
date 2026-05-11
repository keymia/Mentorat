from django.contrib.auth import authenticate
from rest_framework import serializers

from apps.users.models import NiveauAcademique, Role, Utilisateur


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ["id", "nom", "description"]


class NiveauAcademiqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = NiveauAcademique
        fields = ["id", "nom", "ordre_niveau", "est_premier_niveau", "est_dernier_niveau"]


class UtilisateurLiteSerializer(serializers.ModelSerializer):
    niveau_academique_nom = serializers.CharField(source="niveau_academique.nom", read_only=True)
    niveau_academique_est_premier_niveau = serializers.BooleanField(
        source="niveau_academique.est_premier_niveau",
        read_only=True,
    )
    role_nom = serializers.CharField(source="role.nom", read_only=True)
    capacite_restante = serializers.IntegerField(read_only=True)

    class Meta:
        model = Utilisateur
        fields = [
            "id",
            "nom",
            "prenom",
            "email",
            "telephone",
            "langue_preferee",
            "region",
            "profil_mentorat",
            "capacite_mentorat",
            "nombre_mentores_actuels",
            "capacite_restante",
            "statut_compte",
            "role",
            "role_nom",
            "niveau_academique",
            "niveau_academique_nom",
            "niveau_academique_est_premier_niveau",
        ]


class UtilisateurSerializer(serializers.ModelSerializer):
    mot_de_passe = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=8)
    role_nom = serializers.CharField(source="role.nom", read_only=True)
    niveau_academique_nom = serializers.CharField(source="niveau_academique.nom", read_only=True)
    niveau_academique_est_premier_niveau = serializers.BooleanField(
        source="niveau_academique.est_premier_niveau",
        read_only=True,
    )
    capacite_restante = serializers.IntegerField(read_only=True)

    class Meta:
        model = Utilisateur
        fields = [
            "id",
            "nom",
            "prenom",
            "email",
            "telephone",
            "mot_de_passe",
            "langue_preferee",
            "region",
            "disponibilite",
            "objectifs",
            "profil_mentorat",
            "capacite_mentorat",
            "nombre_mentores_actuels",
            "capacite_restante",
            "statut_compte",
            "role",
            "role_nom",
            "niveau_academique",
            "niveau_academique_nom",
            "niveau_academique_est_premier_niveau",
            "cree_par",
            "date_creation",
            "is_active",
        ]
        read_only_fields = ["nombre_mentores_actuels", "cree_par", "date_creation"]

    def validate(self, attrs):
        niveau = attrs.get("niveau_academique", getattr(self.instance, "niveau_academique", None))
        profil = attrs.get("profil_mentorat", getattr(self.instance, "profil_mentorat", None))
        if niveau and profil:
            if niveau.est_premier_niveau and Utilisateur.profil_inclut_mentor(profil):
                raise serializers.ValidationError(
                    {"niveau_academique": "Un mentor ne peut pas etre en 12e annee."}
                )
            if niveau.est_dernier_niveau and profil != Utilisateur.ProfilMentorat.MENTOR:
                raise serializers.ValidationError(
                    {"profil_mentorat": "Le dernier niveau academique peut seulement etre mentor."}
                )
            if (
                not niveau.est_premier_niveau
                and not niveau.est_dernier_niveau
                and profil == Utilisateur.ProfilMentorat.MENTORE
            ):
                raise serializers.ValidationError(
                    {
                        "profil_mentorat": (
                            "Un niveau intermediaire doit etre mentor seulement "
                            "ou mentor et mentore."
                        )
                    }
                )
        return attrs

    def create(self, validated_data):
        mot_de_passe = validated_data.pop("mot_de_passe", None)
        request = self.context.get("request")
        if request and request.user.is_authenticated and not validated_data.get("cree_par"):
            validated_data["cree_par"] = request.user
        return Utilisateur.objects.create_user(password=mot_de_passe, **validated_data)

    def update(self, instance, validated_data):
        mot_de_passe = validated_data.pop("mot_de_passe", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if mot_de_passe:
            instance.set_password(mot_de_passe)
        instance.save()
        return instance


class SelfProfileSerializer(serializers.ModelSerializer):
    role_nom = serializers.CharField(source="role.nom", read_only=True)
    niveau_academique_nom = serializers.CharField(source="niveau_academique.nom", read_only=True)
    capacite_restante = serializers.IntegerField(read_only=True)

    class Meta:
        model = Utilisateur
        fields = [
            "id",
            "nom",
            "prenom",
            "email",
            "telephone",
            "langue_preferee",
            "region",
            "objectifs",
            "profil_mentorat",
            "capacite_mentorat",
            "nombre_mentores_actuels",
            "capacite_restante",
            "statut_compte",
            "role_nom",
            "niveau_academique_nom",
        ]
        read_only_fields = [
            "id",
            "profil_mentorat",
            "capacite_mentorat",
            "nombre_mentores_actuels",
            "capacite_restante",
            "statut_compte",
            "role_nom",
            "niveau_academique_nom",
        ]


class MentorDisponibleSerializer(UtilisateurLiteSerializer):
    capacite_restante = serializers.SerializerMethodField()

    class Meta(UtilisateurLiteSerializer.Meta):
        fields = UtilisateurLiteSerializer.Meta.fields + ["disponibilite", "objectifs"]

    def get_capacite_restante(self, obj: Utilisateur) -> int:
        return obj.capacite_restante()


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    mot_de_passe = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs["email"]
        mot_de_passe = attrs["mot_de_passe"]
        user = authenticate(
            request=self.context.get("request"),
            username=email,
            password=mot_de_passe,
        )
        if not user:
            raise serializers.ValidationError("Identifiants invalides.")
        if not user.is_active or user.statut_compte != Utilisateur.StatutCompte.ACTIF:
            raise serializers.ValidationError("Compte inactif ou en attente de validation.")
        attrs["user"] = user
        return attrs


class PasswordUpdateSerializer(serializers.Serializer):
    ancien_mot_de_passe = serializers.CharField(write_only=True)
    mot_de_passe = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        user = self.context["request"].user
        if not user.est_mentor:
            raise serializers.ValidationError(
                {"mot_de_passe": "Le mot de passe sera activable lorsque ce compte deviendra mentor."}
            )
        if not user.check_password(attrs["ancien_mot_de_passe"]):
            raise serializers.ValidationError({"ancien_mot_de_passe": "Ancien mot de passe incorrect."})
        return attrs
