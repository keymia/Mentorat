from rest_framework import serializers

from apps.partenaires.models import Partenaire


class PartenaireSerializer(serializers.ModelSerializer):
    class Meta:
        model = Partenaire
        fields = [
            "id",
            "nom_partenaire",
            "description",
            "logo",
            "site_web",
            "type_partenaire",
            "ordre_affichage",
            "statut",
            "date_ajout",
        ]
        read_only_fields = ["date_ajout"]
