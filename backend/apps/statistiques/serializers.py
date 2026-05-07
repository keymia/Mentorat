from rest_framework import serializers


class DashboardStatistiquesSerializer(serializers.Serializer):
    total_mentors = serializers.IntegerField()
    total_mentores = serializers.IntegerField()
    inscriptions_en_attente = serializers.IntegerField()
    jumelages_actifs = serializers.IntegerField()
    mentors_disponibles = serializers.IntegerField()
    mentors_satures = serializers.IntegerField()
    evenements_a_venir = serializers.IntegerField()
    partenaires_actifs = serializers.IntegerField()
