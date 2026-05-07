from rest_framework import serializers

from apps.parametres.models import ParametreSysteme


class ParametreSystemeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParametreSysteme
        fields = ["id", "cle", "valeur", "description"]
        read_only_fields = ["cle"]
