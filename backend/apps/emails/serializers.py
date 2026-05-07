from rest_framework import serializers

from apps.emails.models import EmailAutomatique
from apps.users.serializers import UtilisateurLiteSerializer


class EmailAutomatiqueSerializer(serializers.ModelSerializer):
    utilisateur_detail = UtilisateurLiteSerializer(source="utilisateur", read_only=True)

    class Meta:
        model = EmailAutomatique
        fields = [
            "id",
            "utilisateur",
            "utilisateur_detail",
            "type_email",
            "sujet_fr",
            "sujet_en",
            "contenu_fr",
            "contenu_en",
            "date_envoi",
            "statut_envoi",
        ]
