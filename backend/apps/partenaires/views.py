from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.partenaires.models import Partenaire
from apps.partenaires.serializers import PartenaireSerializer
from apps.users.permissions import IsAdminRole


class PartenaireViewSet(viewsets.ModelViewSet):
    queryset = Partenaire.objects.all()
    serializer_class = PartenaireSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_permissions(self):
        if self.action == "public":
            return [AllowAny()]
        return [IsAdminRole()]

    @action(detail=False, methods=["get"], url_path="public")
    def public(self, request):
        partenaires = self.get_queryset().filter(statut=Partenaire.Statut.ACTIF)
        return Response(self.get_serializer(partenaires, many=True).data)
