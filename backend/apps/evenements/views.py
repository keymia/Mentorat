from rest_framework import viewsets

from apps.evenements.models import Evenement, Participation
from apps.evenements.serializers import EvenementSerializer, ParticipationSerializer
from apps.users.permissions import IsAdminRole


class EvenementViewSet(viewsets.ModelViewSet):
    queryset = Evenement.objects.all()
    serializer_class = EvenementSerializer
    permission_classes = [IsAdminRole]


class ParticipationViewSet(viewsets.ModelViewSet):
    queryset = Participation.objects.select_related(
        "utilisateur",
        "utilisateur__role",
        "utilisateur__niveau_academique",
        "evenement",
    ).all()
    serializer_class = ParticipationSerializer
    permission_classes = [IsAdminRole]
