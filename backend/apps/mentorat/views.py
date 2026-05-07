from rest_framework import viewsets

from apps.mentorat.models import Mentorat
from apps.mentorat.serializers import MentoratSerializer
from apps.users.permissions import IsAdminRole


class MentoratViewSet(viewsets.ModelViewSet):
    queryset = Mentorat.objects.select_related(
        "mentor",
        "mentor__role",
        "mentor__niveau_academique",
        "mentore",
        "mentore__role",
        "mentore__niveau_academique",
    ).all()
    serializer_class = MentoratSerializer
    permission_classes = [IsAdminRole]
