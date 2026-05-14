from django.db import transaction
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.inscriptions.models import Inscription
from apps.inscriptions.serializers import (
    InscriptionSerializer,
    MentoreInscriptionSerializer,
    MentorInscriptionSerializer,
)
from apps.mentorat.models import MentorshipAssignment
from apps.mentorat.services import validate_mentor_for_mentore_level
from apps.users.models import Utilisateur
from apps.users.permissions import IsAdminRole


class MentorInscriptionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = MentorInscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            inscription = serializer.save()
        return Response(InscriptionSerializer(inscription).data, status=status.HTTP_201_CREATED)


class MentoreInscriptionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = MentoreInscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            inscription = serializer.save()
        return Response(InscriptionSerializer(inscription).data, status=status.HTTP_201_CREATED)


class InscriptionViewSet(viewsets.ModelViewSet):
    queryset = Inscription.objects.select_related(
        "utilisateur",
        "utilisateur__role",
        "utilisateur__niveau_academique",
        "mentor_choisi",
        "mentor_choisi__role",
        "mentor_choisi__niveau_academique",
        "mentorship_period",
    ).all()
    serializer_class = InscriptionSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.query_params.get("role")
        status_value = self.request.query_params.get("status")
        search = self.request.query_params.get("search")
        ordering = self.request.query_params.get("ordering", "-date_inscription")

        if role:
            queryset = queryset.filter(type_inscription=role)
        if status_value:
            queryset = queryset.filter(statut_inscription=status_value)
        if search:
            queryset = queryset.filter(
                Q(utilisateur__nom__icontains=search)
                | Q(utilisateur__prenom__icontains=search)
                | Q(utilisateur__email__icontains=search)
            )
        if ordering in {"date_inscription", "-date_inscription"}:
            queryset = queryset.order_by(ordering)
        return queryset

    @action(detail=True, methods=["put"], url_path="valider")
    @transaction.atomic
    def valider(self, request, pk=None):
        inscription = self.get_object()
        if inscription.statut_inscription == Inscription.StatutInscription.REFUSEE:
            raise ValidationError({"statut_inscription": "Une inscription refusee ne peut pas etre validee."})

        if (
            inscription.type_inscription == Inscription.TypeInscription.MENTORE
            and not inscription.mentor_choisi
            and not inscription.wants_association_assignment
        ):
            raise ValidationError({"mentor_choisi": "Un mentor doit etre choisi avant la validation."})

        if inscription.type_inscription == Inscription.TypeInscription.MENTORE and inscription.mentor_choisi:
            validate_mentor_for_mentore_level(
                inscription.mentor_choisi,
                inscription.utilisateur.niveau_academique,
                inscription.mentorship_period,
            )

        inscription.statut_inscription = Inscription.StatutInscription.VALIDEE
        if inscription.type_inscription == Inscription.TypeInscription.MENTORE and not inscription.mentor_choisi:
            inscription.needs_matching = True
            inscription.registration_status = Inscription.RegistrationStatus.PENDING_MATCHING
        inscription.save(update_fields=["statut_inscription", "needs_matching", "registration_status"])

        utilisateur = inscription.utilisateur
        utilisateur.statut_compte = Utilisateur.StatutCompte.ACTIF
        utilisateur.save(update_fields=["statut_compte"])

        if inscription.type_inscription == Inscription.TypeInscription.MENTORE and inscription.mentor_choisi:
            selected_period = inscription.mentorship_period
            if selected_period:
                assignment_exists = MentorshipAssignment.objects.filter(
                    mentoree=utilisateur,
                    period=selected_period,
                    status=MentorshipAssignment.Status.ACTIVE,
                ).exists()
                if not assignment_exists:
                    try:
                        MentorshipAssignment.objects.create(
                            mentor=inscription.mentor_choisi,
                            mentoree=utilisateur,
                            period=selected_period,
                            status=MentorshipAssignment.Status.ACTIVE,
                        )
                        inscription.needs_matching = False
                        inscription.registration_status = Inscription.RegistrationStatus.MATCHED
                        inscription.save(update_fields=["needs_matching", "registration_status"])
                    except DjangoValidationError as exc:
                        payload = exc.message_dict if hasattr(exc, "message_dict") else exc.messages
                        raise ValidationError(payload) from exc

        return Response(self.get_serializer(inscription).data)

    @action(detail=True, methods=["put"], url_path="refuser")
    @transaction.atomic
    def refuser(self, request, pk=None):
        inscription = self.get_object()
        inscription.statut_inscription = Inscription.StatutInscription.REFUSEE
        inscription.save(update_fields=["statut_inscription"])

        utilisateur = inscription.utilisateur
        utilisateur.statut_compte = Utilisateur.StatutCompte.INACTIF
        utilisateur.save(update_fields=["statut_compte"])

        return Response(self.get_serializer(inscription).data)


class AdminRegistrationsView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        viewset = InscriptionViewSet()
        viewset.request = request
        queryset = viewset.get_queryset()
        return Response(InscriptionSerializer(queryset, many=True).data)
