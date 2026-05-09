from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.evenements.models import Evenement, Participation
from apps.evenements.serializers import EvenementSerializer, ParticipationSerializer
from apps.users.permissions import IsAdminRole


class EvenementViewSet(viewsets.ModelViewSet):
    queryset = Evenement.objects.all()
    serializer_class = EvenementSerializer
    permission_classes = [IsAdminRole]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action == "public":
            return [AllowAny()]
        return [IsAdminRole()]

    @action(detail=False, methods=["get"], url_path="public")
    def public(self, request):
        evenements = self.get_queryset().filter(statut_evenement=Evenement.StatutEvenement.PLANIFIE)
        return Response(self.get_serializer(evenements, many=True).data)


class ParticipationViewSet(viewsets.ModelViewSet):
    queryset = Participation.objects.select_related(
        "utilisateur",
        "utilisateur__role",
        "utilisateur__niveau_academique",
        "evenement",
    ).all()
    serializer_class = ParticipationSerializer
    permission_classes = [IsAdminRole]
