from rest_framework import serializers

from apps.evenements.models import Evenement, Participation
from apps.users.serializers import UtilisateurLiteSerializer


class EvenementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evenement
        fields = [
            "id",
            "titre",
            "description",
            "date_evenement",
            "heure_evenement",
            "lieu",
            "image",
            "video",
            "type_evenement",
            "statut_evenement",
        ]


class ParticipationSerializer(serializers.ModelSerializer):
    utilisateur_detail = UtilisateurLiteSerializer(source="utilisateur", read_only=True)
    evenement_detail = EvenementSerializer(source="evenement", read_only=True)

    class Meta:
        model = Participation
        fields = [
            "id",
            "utilisateur",
            "utilisateur_detail",
            "evenement",
            "evenement_detail",
            "statut_participation",
            "date_reponse",
        ]
        read_only_fields = ["date_reponse"]
