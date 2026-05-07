from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from apps.mentorat.models import Mentorat
from apps.users.serializers import UtilisateurLiteSerializer


class MentoratSerializer(serializers.ModelSerializer):
    mentor_detail = UtilisateurLiteSerializer(source="mentor", read_only=True)
    mentore_detail = UtilisateurLiteSerializer(source="mentore", read_only=True)

    class Meta:
        model = Mentorat
        fields = [
            "id",
            "mentor",
            "mentor_detail",
            "mentore",
            "mentore_detail",
            "date_jumelage",
            "statut_jumelage",
        ]
        read_only_fields = ["date_jumelage"]

    def validate(self, attrs):
        data = {
            "mentor": attrs.get("mentor", getattr(self.instance, "mentor", None)),
            "mentore": attrs.get("mentore", getattr(self.instance, "mentore", None)),
            "statut_jumelage": attrs.get(
                "statut_jumelage",
                getattr(self.instance, "statut_jumelage", Mentorat.StatutJumelage.ACTIF),
            ),
        }
        instance = Mentorat(**data)
        if self.instance:
            instance.pk = self.instance.pk
        try:
            instance.clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.message_dict if hasattr(exc, "message_dict") else exc.messages)
        return attrs
