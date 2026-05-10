from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.mentorat.services import get_mentors_disponibles_for_niveau
from apps.users.models import NiveauAcademique, Role, Utilisateur
from apps.users.permissions import CanCreateAdministrateur, IsAdminRole
from apps.users.serializers import (
    LoginSerializer,
    MentorDisponibleSerializer,
    NiveauAcademiqueSerializer,
    RoleSerializer,
    UtilisateurSerializer,
)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UtilisateurSerializer(user).data,
            }
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response({"detail": "Deconnexion effectuee."}, status=status.HTTP_200_OK)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UtilisateurSerializer(request.user).data)


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAdminRole]


class NiveauAcademiqueViewSet(viewsets.ModelViewSet):
    queryset = NiveauAcademique.objects.all()
    serializer_class = NiveauAcademiqueSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsAdminRole()]


class UtilisateurViewSet(viewsets.ModelViewSet):
    queryset = Utilisateur.objects.select_related("role", "niveau_academique", "cree_par").all()
    serializer_class = UtilisateurSerializer
    permission_classes = [IsAuthenticated, IsAdminRole, CanCreateAdministrateur]

    def get_queryset(self):
        queryset = super().get_queryset()
        role_nom = self.request.query_params.get("role_nom")
        profil_mentorat = self.request.query_params.get("profil_mentorat")
        statut_compte = self.request.query_params.get("statut_compte")

        if role_nom:
            queryset = queryset.filter(role__nom__in=[value.strip() for value in role_nom.split(",")])
        if profil_mentorat:
            queryset = queryset.filter(profil_mentorat__in=[value.strip() for value in profil_mentorat.split(",")])
        if statut_compte:
            queryset = queryset.filter(statut_compte__in=[value.strip() for value in statut_compte.split(",")])
        return queryset

    def perform_create(self, serializer):
        serializer.save(cree_par=self.request.user)

    def create(self, request, *args, **kwargs):
        role_id = request.data.get("role")
        role_nom = Role.objects.filter(pk=role_id).values_list("nom", flat=True).first()
        if role_nom in {Role.Nom.ADMIN_PRINCIPAL, Role.Nom.ADMIN_OPERATIONNEL}:
            if not request.user.est_admin_principal:
                return Response(
                    {"detail": "Seul ADMIN_PRINCIPAL peut creer un administrateur."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        return super().create(request, *args, **kwargs)


class MentorViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MentorDisponibleSerializer

    def get_queryset(self):
        return (
            Utilisateur.objects.select_related("role", "niveau_academique")
            .filter(
                profil_mentorat__in=[
                    Utilisateur.ProfilMentorat.MENTOR,
                    Utilisateur.ProfilMentorat.MENTOR_ET_MENTORE,
                ]
            )
            .order_by("niveau_academique__ordre_niveau", "nom", "prenom")
        )

    def get_permissions(self):
        if self.action == "disponibles":
            return [AllowAny()]
        return [IsAuthenticated(), IsAdminRole()]

    @action(detail=False, methods=["get"], url_path="disponibles")
    def disponibles(self, request):
        niveau_id = request.query_params.get("niveau_id")
        if not niveau_id:
            return Response(
                {"detail": "Le parametre niveau_id est obligatoire."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        mentors = get_mentors_disponibles_for_niveau(niveau_id, request.query_params.get("period_id"))
        serializer = self.get_serializer(mentors, many=True)
        return Response(serializer.data)
