from django.contrib.auth import authenticate
from rest_framework import serializers

from apps.parametres.models import ParametreSysteme
from apps.users.models import LoginVerificationCode, NiveauAcademique, Role, Utilisateur


def file_url(obj, field_name: str, request=None) -> str | None:
    field = getattr(obj, field_name, None)
    if not field:
        return None
    url = field.url
    return request.build_absolute_uri(url) if request else url


def validate_level_for_profile(niveau: NiveauAcademique | None, profil: str | None):
    if not niveau or not profil:
        return
    if Utilisateur.profil_inclut_mentor(profil) and not Utilisateur.niveau_autorise_pour_mentor(niveau):
        raise serializers.ValidationError(
            {"niveau_academique": "Ce niveau academique n'est pas autorise pour un mentor."}
        )
    if Utilisateur.profil_inclut_mentore(profil) and not Utilisateur.niveau_autorise_pour_mentore(niveau):
        raise serializers.ValidationError(
            {"niveau_academique": "Ce niveau academique n'est pas autorise pour un mentore."}
        )


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ["id", "nom", "description"]


class NiveauAcademiqueSerializer(serializers.ModelSerializer):
    class Meta:
        model = NiveauAcademique
        fields = ["id", "nom", "code", "ordre_niveau", "est_premier_niveau", "est_dernier_niveau"]


class UtilisateurLiteSerializer(serializers.ModelSerializer):
    niveau_academique_nom = serializers.CharField(source="niveau_academique.nom", read_only=True)
    niveau_academique_est_premier_niveau = serializers.BooleanField(
        source="niveau_academique.est_premier_niveau",
        read_only=True,
    )
    role_nom = serializers.CharField(source="role.nom", read_only=True)
    capacite_restante = serializers.IntegerField(read_only=True)
    profile_photo_url = serializers.SerializerMethodField()
    public_photo_url = serializers.SerializerMethodField()

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
            "mini_bio",
            "profile_photo",
            "profile_photo_url",
            "domaine_specialite",
            "wants_to_appear_on_team_page",
            "is_team_approved",
            "team_display_order",
            "can_appear_on_about_page",
            "public_title",
            "public_description",
            "public_photo",
            "public_photo_url",
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

    def get_profile_photo_url(self, obj: Utilisateur) -> str | None:
        return file_url(obj, "profile_photo", self.context.get("request"))

    def get_public_photo_url(self, obj: Utilisateur) -> str | None:
        return file_url(obj, "public_photo", self.context.get("request"))


class UtilisateurSerializer(serializers.ModelSerializer):
    mot_de_passe = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=8)
    role_nom = serializers.CharField(source="role.nom", read_only=True)
    niveau_academique_nom = serializers.CharField(source="niveau_academique.nom", read_only=True)
    niveau_academique_est_premier_niveau = serializers.BooleanField(
        source="niveau_academique.est_premier_niveau",
        read_only=True,
    )
    capacite_restante = serializers.IntegerField(read_only=True)
    profile_photo_url = serializers.SerializerMethodField()
    public_photo_url = serializers.SerializerMethodField()

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
            "mini_bio",
            "profile_photo",
            "profile_photo_url",
            "domaine_specialite",
            "wants_to_appear_on_team_page",
            "is_team_approved",
            "team_display_order",
            "can_appear_on_about_page",
            "public_title",
            "public_description",
            "public_photo",
            "public_photo_url",
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

    def get_profile_photo_url(self, obj: Utilisateur) -> str | None:
        return file_url(obj, "profile_photo", self.context.get("request"))

    def get_public_photo_url(self, obj: Utilisateur) -> str | None:
        return file_url(obj, "public_photo", self.context.get("request"))

    def validate(self, attrs):
        niveau = attrs.get("niveau_academique", getattr(self.instance, "niveau_academique", None))
        profil = attrs.get("profil_mentorat", getattr(self.instance, "profil_mentorat", None))
        validate_level_for_profile(niveau, profil)
        ancien_niveau = getattr(self.instance, "niveau_academique", None)
        if ancien_niveau and niveau and niveau.ordre_niveau < ancien_niveau.ordre_niveau:
            raise serializers.ValidationError(
                {"niveau_academique": "Le niveau academique ne peut pas diminuer."}
            )

        mini_bio = attrs.get("mini_bio", getattr(self.instance, "mini_bio", ""))
        wants_public = attrs.get(
            "wants_to_appear_on_team_page",
            getattr(self.instance, "wants_to_appear_on_team_page", False),
        )
        is_approved = attrs.get("is_team_approved", getattr(self.instance, "is_team_approved", False))
        display_order = attrs.get("team_display_order", getattr(self.instance, "team_display_order", 0))
        if wants_public and not mini_bio.strip():
            raise serializers.ValidationError(
                {"mini_bio": "La mini bio est obligatoire pour apparaitre sur la page Equipes."}
            )
        if is_approved and display_order < 1:
            raise serializers.ValidationError(
                {"team_display_order": "L'ordre d'affichage doit etre superieur a 0."}
            )
        if Utilisateur.profil_inclut_mentor(profil):
            limite_systeme = ParametreSysteme.get_int("MAX_MENTORES_PAR_MENTOR", 5)
            if not self.instance and "capacite_mentorat" not in attrs:
                attrs["capacite_mentorat"] = limite_systeme
            capacite = attrs.get("capacite_mentorat", getattr(self.instance, "capacite_mentorat", 0))
            if capacite > limite_systeme:
                raise serializers.ValidationError(
                    {
                        "capacite_mentorat": (
                            f"La capacite ne peut pas depasser le maximum autorise de "
                            f"{limite_systeme} mentores."
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
        if "statut_compte" in validated_data:
            instance.is_active = validated_data["statut_compte"] == Utilisateur.StatutCompte.ACTIF
        if mot_de_passe:
            instance.set_password(mot_de_passe)
        instance.save()
        return instance


class SelfProfileSerializer(serializers.ModelSerializer):
    role_nom = serializers.CharField(source="role.nom", read_only=True)
    niveau_academique_nom = serializers.CharField(source="niveau_academique.nom", read_only=True)
    capacite_restante = serializers.IntegerField(read_only=True)
    profile_photo_url = serializers.SerializerMethodField()

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
            "mini_bio",
            "profile_photo",
            "profile_photo_url",
            "domaine_specialite",
            "wants_to_appear_on_team_page",
            "is_team_approved",
            "team_display_order",
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
            "profile_photo_url",
            "is_team_approved",
            "team_display_order",
        ]

    def get_profile_photo_url(self, obj: Utilisateur) -> str | None:
        return file_url(obj, "profile_photo", self.context.get("request"))

    def validate(self, attrs):
        mini_bio = attrs.get("mini_bio", getattr(self.instance, "mini_bio", ""))
        wants_public = attrs.get(
            "wants_to_appear_on_team_page",
            getattr(self.instance, "wants_to_appear_on_team_page", False),
        )
        if wants_public and not mini_bio.strip():
            raise serializers.ValidationError(
                {"mini_bio": "La mini bio est obligatoire pour apparaitre sur la page Equipes."}
            )
        return attrs


class MentorDisponibleSerializer(UtilisateurLiteSerializer):
    capacite_restante = serializers.SerializerMethodField()

    class Meta(UtilisateurLiteSerializer.Meta):
        fields = UtilisateurLiteSerializer.Meta.fields + ["disponibilite", "objectifs"]

    def get_capacite_restante(self, obj: Utilisateur) -> int:
        return obj.capacite_restante()


class MentorProfileSerializer(serializers.ModelSerializer):
    niveau_academique_nom = serializers.CharField(source="niveau_academique.nom", read_only=True)
    profile_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Utilisateur
        fields = [
            "id",
            "nom",
            "prenom",
            "email",
            "mini_bio",
            "profile_photo",
            "profile_photo_url",
            "domaine_specialite",
            "niveau_academique",
            "niveau_academique_nom",
            "wants_to_appear_on_team_page",
            "is_team_approved",
            "team_display_order",
        ]
        read_only_fields = [
            "id",
            "nom",
            "prenom",
            "email",
            "niveau_academique",
            "niveau_academique_nom",
            "profile_photo_url",
            "is_team_approved",
            "team_display_order",
        ]

    def get_profile_photo_url(self, obj: Utilisateur) -> str | None:
        return file_url(obj, "profile_photo", self.context.get("request"))

    def validate(self, attrs):
        niveau = attrs.get("niveau_academique", getattr(self.instance, "niveau_academique", None))
        validate_level_for_profile(niveau, getattr(self.instance, "profil_mentorat", Utilisateur.ProfilMentorat.MENTOR))
        mini_bio = attrs.get("mini_bio", getattr(self.instance, "mini_bio", ""))
        domaine_specialite = attrs.get("domaine_specialite", getattr(self.instance, "domaine_specialite", ""))
        profile_photo = attrs.get("profile_photo", getattr(self.instance, "profile_photo", None))
        wants_public = attrs.get(
            "wants_to_appear_on_team_page",
            getattr(self.instance, "wants_to_appear_on_team_page", False),
        )
        errors = {}
        if not wants_public:
            errors["wants_to_appear_on_team_page"] = "L'accord d'apparition sur la page Equipes est obligatoire."
        if not niveau:
            errors["niveau_academique"] = "Le niveau academique du compte mentor est obligatoire."
        if not str(domaine_specialite).strip():
            errors["domaine_specialite"] = "Le domaine ou la specialite est obligatoire."
        if not profile_photo:
            errors["profile_photo"] = "La photo est obligatoire pour apparaitre sur la page Equipes."
        if not mini_bio.strip():
            errors["mini_bio"] = "La mini bio est obligatoire pour apparaitre sur la page Equipes."
        if errors:
            raise serializers.ValidationError(errors)
        return attrs


class PublicTeamMemberSerializer(serializers.ModelSerializer):
    nom_complet = serializers.CharField(read_only=True)
    academic_level = serializers.CharField(source="niveau_academique.nom", read_only=True)
    profile_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Utilisateur
        fields = [
            "id",
            "nom",
            "prenom",
            "nom_complet",
            "mini_bio",
            "profile_photo_url",
            "academic_level",
            "domaine_specialite",
            "team_display_order",
        ]

    def get_profile_photo_url(self, obj: Utilisateur) -> str | None:
        return file_url(obj, "profile_photo", self.context.get("request"))


class AdminTeamMemberSerializer(serializers.ModelSerializer):
    nom_complet = serializers.CharField(read_only=True)
    niveau_academique_nom = serializers.CharField(source="niveau_academique.nom", read_only=True)
    profile_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Utilisateur
        fields = [
            "id",
            "nom",
            "prenom",
            "email",
            "nom_complet",
            "mini_bio",
            "profile_photo_url",
            "domaine_specialite",
            "niveau_academique",
            "niveau_academique_nom",
            "wants_to_appear_on_team_page",
            "is_team_approved",
            "team_display_order",
        ]
        read_only_fields = [
            "id",
            "nom",
            "prenom",
            "email",
            "nom_complet",
            "mini_bio",
            "profile_photo_url",
            "domaine_specialite",
            "niveau_academique",
            "niveau_academique_nom",
            "wants_to_appear_on_team_page",
        ]

    def get_profile_photo_url(self, obj: Utilisateur) -> str | None:
        return file_url(obj, "profile_photo", self.context.get("request"))

    def validate(self, attrs):
        is_approved = attrs.get("is_team_approved", getattr(self.instance, "is_team_approved", False))
        display_order = attrs.get("team_display_order", getattr(self.instance, "team_display_order", 0))
        if is_approved and display_order < 1:
            raise serializers.ValidationError(
                {"team_display_order": "L'ordre d'affichage doit etre superieur a 0."}
            )
        if is_approved and not getattr(self.instance, "wants_to_appear_on_team_page", False):
            raise serializers.ValidationError(
                {"is_team_approved": "Le mentor doit d'abord accepter l'affichage public."}
            )
        if is_approved and not getattr(self.instance, "mini_bio", "").strip():
            raise serializers.ValidationError(
                {"mini_bio": "La mini bio est obligatoire avant validation publique."}
            )
        if is_approved and not getattr(self.instance, "domaine_specialite", "").strip():
            raise serializers.ValidationError(
                {"domaine_specialite": "Le domaine ou la specialite est obligatoire avant validation publique."}
            )
        if is_approved and not getattr(self.instance, "profile_photo", None):
            raise serializers.ValidationError(
                {"profile_photo": "La photo est obligatoire avant validation publique."}
            )
        if is_approved and not getattr(self.instance, "niveau_academique", None):
            raise serializers.ValidationError(
                {"niveau_academique": "Le niveau academique est obligatoire avant validation publique."}
            )
        return attrs


class OperationalAdminSerializer(serializers.ModelSerializer):
    mot_de_passe = serializers.CharField(write_only=True, required=False, allow_blank=True, min_length=8)
    role_nom = serializers.CharField(source="role.nom", read_only=True)
    public_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Utilisateur
        fields = [
            "id",
            "nom",
            "prenom",
            "email",
            "mot_de_passe",
            "telephone",
            "langue_preferee",
            "region",
            "statut_compte",
            "is_active",
            "role",
            "role_nom",
            "can_appear_on_about_page",
            "public_title",
            "public_description",
            "public_photo",
            "public_photo_url",
            "date_creation",
        ]
        read_only_fields = ["id", "is_active", "role", "role_nom", "date_creation", "public_photo_url"]

    def get_public_photo_url(self, obj: Utilisateur) -> str | None:
        return file_url(obj, "public_photo", self.context.get("request"))

    def validate(self, attrs):
        wants_public = attrs.get(
            "can_appear_on_about_page",
            getattr(self.instance, "can_appear_on_about_page", False),
        )
        public_title = attrs.get("public_title", getattr(self.instance, "public_title", ""))
        if wants_public and not public_title.strip():
            raise serializers.ValidationError(
                {"public_title": "Le titre public est obligatoire pour apparaitre sur la page A propos."}
            )
        return attrs

    def sync_active_status(self, validated_data):
        statut = validated_data.get("statut_compte", Utilisateur.StatutCompte.ACTIF)
        validated_data["is_active"] = statut == Utilisateur.StatutCompte.ACTIF
        return validated_data

    def create(self, validated_data):
        password = validated_data.pop("mot_de_passe", None)
        role, _ = Role.objects.get_or_create(
            nom=Role.Nom.ADMIN_OPERATIONNEL,
            defaults={"description": "Gestion operationnelle sans creation d'administrateur."},
        )
        validated_data = self.sync_active_status(validated_data)
        return Utilisateur.objects.create_user(
            password=password,
            role=role,
            is_staff=True,
            **validated_data,
        )

    def update(self, instance, validated_data):
        password = validated_data.pop("mot_de_passe", None)
        if "statut_compte" in validated_data:
            validated_data = self.sync_active_status(validated_data)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class PublicAboutTeamMemberSerializer(serializers.ModelSerializer):
    nom_complet = serializers.CharField(read_only=True)
    role_label = serializers.CharField(source="role.get_nom_display", read_only=True)
    public_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Utilisateur
        fields = [
            "id",
            "nom",
            "prenom",
            "nom_complet",
            "role_label",
            "public_title",
            "public_description",
            "public_photo_url",
        ]

    def get_public_photo_url(self, obj: Utilisateur) -> str | None:
        return file_url(obj, "public_photo", self.context.get("request"))


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


class LoginVerifyCodeSerializer(serializers.Serializer):
    challenge_id = serializers.UUIDField()
    code = serializers.CharField(min_length=6, max_length=6)

    def validate(self, attrs):
        challenge = (
            LoginVerificationCode.objects.select_related("user")
            .filter(challenge_id=attrs["challenge_id"])
            .first()
        )
        if not challenge or not challenge.check_code(attrs["code"]):
            raise serializers.ValidationError({"code": "Code invalide ou expire."})
        user = challenge.user
        if not user.is_active or user.statut_compte != Utilisateur.StatutCompte.ACTIF:
            raise serializers.ValidationError("Compte inactif ou en attente de validation.")
        attrs["challenge"] = challenge
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
