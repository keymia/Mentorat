from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Case, IntegerField, Q, Value, When
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.mentorat.services import get_current_or_latest_period, get_mentors_disponibles_for_niveau
from apps.mentorat.permissions import IsMentorUser
from apps.parametres.models import ParametreSysteme
from apps.users.models import LoginVerificationCode, NiveauAcademique, Role, Utilisateur
from apps.users.permissions import CanCreateAdministrateur, IsAdminRole
from apps.users.permissions import IsAdminPrincipal
from apps.users.serializers import (
    AdminOwnAccountSerializer,
    LoginSerializer,
    LoginVerifyCodeSerializer,
    AdminTeamMemberSerializer,
    MentorDisponibleSerializer,
    MentorProfileSerializer,
    NiveauAcademiqueSerializer,
    OperationalAdminSerializer,
    PasswordUpdateSerializer,
    PublicAboutTeamMemberSerializer,
    PublicTeamMemberSerializer,
    RoleSerializer,
    SelfProfileSerializer,
    UtilisateurSerializer,
)


def token_response(user, request=None):
    refresh = RefreshToken.for_user(user)
    return Response(
        {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": UtilisateurSerializer(user, context={"request": request}).data,
        }
    )


def send_login_challenge(user):
    challenge, code = LoginVerificationCode.create_for_user(user)
    send_mail(
        subject="Code temporaire de connexion Programme X",
        message=(
            f"Votre code temporaire de connexion est {code}. "
            f"Il expire dans {challenge.CODE_TTL_MINUTES} minutes et ne peut etre utilise qu'une seule fois."
        ),
        from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
        recipient_list=[user.email],
        fail_silently=False,
    )
    return challenge


def login_response_for_user(user, request=None):
    if getattr(settings, "LOGIN_2FA_ENABLED", False) and user.requiert_double_authentification:
        challenge = send_login_challenge(user)
        return Response(
            {
                "requires_2fa": True,
                "challenge_id": str(challenge.challenge_id),
                "email": user.email,
                "expires_in_minutes": challenge.CODE_TTL_MINUTES,
            },
            status=status.HTTP_202_ACCEPTED,
        )
    return token_response(user, request=request)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        return login_response_for_user(serializer.validated_data["user"], request=request)


class LoginRequestCodeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        return login_response_for_user(serializer.validated_data["user"], request=request)


class LoginVerifyCodeView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginVerifyCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        challenge = serializer.validated_data["challenge"]
        challenge.mark_used()
        return token_response(serializer.validated_data["user"], request=request)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response({"detail": "Deconnexion effectuee."}, status=status.HTTP_200_OK)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UtilisateurSerializer(request.user, context={"request": request}).data)

    def patch(self, request):
        serializer = SelfProfileSerializer(request.user, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UtilisateurSerializer(request.user, context={"request": request}).data)


class AccountMeView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        return Response(AdminOwnAccountSerializer(request.user, context={"request": request}).data)

    def patch(self, request):
        serializer = AdminOwnAccountSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(AdminOwnAccountSerializer(request.user, context={"request": request}).data)


class PasswordUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordUpdateSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["mot_de_passe"])
        request.user.save(update_fields=["password"])
        return Response({"detail": "Mot de passe mis a jour."}, status=status.HTTP_200_OK)


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [IsAdminRole()]
        return [IsAdminPrincipal()]


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

    def assert_can_manage_admin(self, target: Utilisateur | None = None):
        requested_role_id = self.request.data.get("role")
        requested_role_nom = self.request.data.get("role_nom")
        if requested_role_id:
            requested_role_nom = Role.objects.filter(pk=requested_role_id).values_list("nom", flat=True).first()

        touches_admin_role = requested_role_nom in {Role.Nom.ADMIN_PRINCIPAL, Role.Nom.ADMIN_OPERATIONNEL}
        target_is_admin = bool(target and target.est_administrateur)
        if (touches_admin_role or target_is_admin) and not self.request.user.est_admin_principal:
            raise PermissionDenied("Seul ADMIN_PRINCIPAL peut gerer les administrateurs.")

    def create(self, request, *args, **kwargs):
        self.assert_can_manage_admin()
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        self.assert_can_manage_admin(self.get_object())
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        self.assert_can_manage_admin(self.get_object())
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        self.assert_can_manage_admin(self.get_object())
        return super().destroy(request, *args, **kwargs)


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
            .filter(niveau_academique__est_premier_niveau=False)
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


class PublicAvailableMentorsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        niveau_id = request.query_params.get("niveau_id")
        if not niveau_id:
            return Response(
                {"detail": "Le parametre niveau_id est obligatoire."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        mentors = get_mentors_disponibles_for_niveau(niveau_id, request.query_params.get("period_id"))
        return Response(MentorDisponibleSerializer(mentors, many=True, context={"request": request}).data)


class MentorRegistrationConfigView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        period = get_current_or_latest_period()
        max_mentees = period.max_mentees_per_mentor if period else ParametreSysteme.get_int("MAX_MENTORES_PAR_MENTOR", 5)
        return Response(
            {
                "max_mentees_per_mentor": max_mentees,
                "mentee_capacity": max_mentees,
            }
        )


class PublicTeamView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        mentors = (
            Utilisateur.objects.select_related("niveau_academique")
            .filter(
                profil_mentorat__in=[
                    Utilisateur.ProfilMentorat.MENTOR,
                    Utilisateur.ProfilMentorat.MENTOR_ET_MENTORE,
                ],
                statut_compte=Utilisateur.StatutCompte.ACTIF,
                is_active=True,
                wants_to_appear_on_team_page=True,
                is_team_approved=True,
            )
            .exclude(mini_bio="")
            .exclude(domaine_specialite="")
            .exclude(profile_photo="")
            .order_by("team_display_order", "nom", "prenom")
        )
        return Response(PublicTeamMemberSerializer(mentors, many=True, context={"request": request}).data)


class MentorProfileView(APIView):
    permission_classes = [IsAuthenticated, IsMentorUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        return Response(MentorProfileSerializer(request.user, context={"request": request}).data)

    def patch(self, request):
        serializer = MentorProfileSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(MentorProfileSerializer(request.user, context={"request": request}).data)


class AdminTeamMemberListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        mentors = (
            Utilisateur.objects.select_related("niveau_academique")
            .filter(
                profil_mentorat__in=[
                    Utilisateur.ProfilMentorat.MENTOR,
                    Utilisateur.ProfilMentorat.MENTOR_ET_MENTORE,
                ],
                wants_to_appear_on_team_page=True,
            )
            .order_by("team_display_order", "nom", "prenom")
        )
        return Response(AdminTeamMemberSerializer(mentors, many=True, context={"request": request}).data)


class AdminTeamMemberDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def patch(self, request, pk: int):
        mentor = get_object_or_404(
            Utilisateur.objects.select_related("niveau_academique")
            .filter(
                profil_mentorat__in=[
                    Utilisateur.ProfilMentorat.MENTOR,
                    Utilisateur.ProfilMentorat.MENTOR_ET_MENTORE,
                ]
            ),
            pk=pk,
        )
        serializer = AdminTeamMemberSerializer(
            mentor,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(AdminTeamMemberSerializer(mentor, context={"request": request}).data)


class PublicAboutTeamView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        admins = (
            Utilisateur.objects.select_related("role")
            .filter(
                statut_compte=Utilisateur.StatutCompte.ACTIF,
                is_active=True,
                can_appear_on_about_page=True,
            )
            .filter(
                Q(role__nom=Role.Nom.ADMIN_PRINCIPAL)
                | Q(
                    role__nom=Role.Nom.ADMIN_OPERATIONNEL,
                    is_public_profile_approved=True,
                    pending_public_validation=False,
                )
            )
            .exclude(public_title="")
            .annotate(
                public_role_order=Case(
                    When(role__nom=Role.Nom.ADMIN_PRINCIPAL, then=Value(0)),
                    default=Value(1),
                    output_field=IntegerField(),
                )
            )
            .order_by("public_role_order", "nom", "prenom")
        )
        return Response(PublicAboutTeamMemberSerializer(admins, many=True, context={"request": request}).data)


class OperationalAdminListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminPrincipal]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        admins = (
            Utilisateur.objects.select_related("role")
            .filter(role__nom=Role.Nom.ADMIN_OPERATIONNEL)
            .order_by("nom", "prenom")
        )
        return Response(OperationalAdminSerializer(admins, many=True, context={"request": request}).data)

    def post(self, request):
        serializer = OperationalAdminSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        admin = serializer.save(cree_par=request.user)
        return Response(
            OperationalAdminSerializer(admin, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class OperationalAdminDetailView(APIView):
    permission_classes = [IsAuthenticated, IsAdminPrincipal]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self, pk: int):
        return get_object_or_404(Utilisateur.objects.select_related("role"), pk=pk, role__nom=Role.Nom.ADMIN_OPERATIONNEL)

    def patch(self, request, pk: int):
        admin = self.get_object(pk)
        serializer = OperationalAdminSerializer(admin, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(OperationalAdminSerializer(admin, context={"request": request}).data)

    def delete(self, request, pk: int):
        admin = self.get_object(pk)
        admin.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class OperationalAdminApprovePublicProfileView(APIView):
    permission_classes = [IsAuthenticated, IsAdminPrincipal]

    def patch(self, request, pk: int):
        admin = get_object_or_404(
            Utilisateur.objects.select_related("role"),
            pk=pk,
            role__nom=Role.Nom.ADMIN_OPERATIONNEL,
        )
        if not admin.public_title.strip():
            return Response(
                {"public_title": "Le titre public est obligatoire avant validation publique."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        admin.approve_public_profile()
        admin.save()
        return Response(OperationalAdminSerializer(admin, context={"request": request}).data)


class OperationalAdminRejectPublicProfileView(APIView):
    permission_classes = [IsAuthenticated, IsAdminPrincipal]

    def patch(self, request, pk: int):
        admin = get_object_or_404(
            Utilisateur.objects.select_related("role"),
            pk=pk,
            role__nom=Role.Nom.ADMIN_OPERATIONNEL,
        )
        admin.reject_public_profile()
        admin.save()
        return Response(OperationalAdminSerializer(admin, context={"request": request}).data)
