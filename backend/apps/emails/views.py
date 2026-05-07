from rest_framework import viewsets

from apps.emails.models import EmailAutomatique
from apps.emails.serializers import EmailAutomatiqueSerializer
from apps.users.permissions import IsAdminRole


class EmailAutomatiqueViewSet(viewsets.ModelViewSet):
    queryset = EmailAutomatique.objects.select_related(
        "utilisateur",
        "utilisateur__role",
        "utilisateur__niveau_academique",
    ).all()
    serializer_class = EmailAutomatiqueSerializer
    permission_classes = [IsAdminRole]
