from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

from apps.parametres.models import ParametreSysteme
from apps.parametres.serializers import ParametreSystemeSerializer
from apps.users.permissions import IsAdminRole


class ParametreSystemeViewSet(viewsets.ModelViewSet):
    queryset = ParametreSysteme.objects.all()
    serializer_class = ParametreSystemeSerializer
    permission_classes = [IsAdminRole]
    http_method_names = ["get", "put", "patch", "head", "options"]

    def perform_update(self, serializer):
        if not self.request.user.est_admin_principal:
            raise PermissionDenied(
                "Seul l'administrateur principal peut modifier les parametres systeme."
            )
        serializer.save()
