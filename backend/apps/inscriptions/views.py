from django.db import transaction
from django.core.exceptions import ValidationError as DjangoValidationError
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
        inscription = serializer.save()
        return Response(InscriptionSerializer(inscription).data, status=status.HTTP_201_CREATED)


class MentoreInscriptionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = MentoreInscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
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

    @action(detail=True, methods=["put"], url_path="valider")
    @transaction.atomic
    def valider(self, request, pk=None):
        inscription = self.get_object()
        if inscription.statut_inscription == Inscription.StatutInscription.REFUSEE:
            raise ValidationError({"statut_inscription": "Une inscription refusee ne peut pas etre validee."})

        if (
            inscription.type_inscription == Inscription.TypeInscription.MENTORE
            and not inscription.mentor_choisi
        ):
            raise ValidationError({"mentor_choisi": "Un mentor doit etre choisi avant la validation."})

        if inscription.type_inscription == Inscription.TypeInscription.MENTORE:
            validate_mentor_for_mentore_level(
                inscription.mentor_choisi,
                inscription.utilisateur.niveau_academique,
                inscription.mentorship_period,
            )

        inscription.statut_inscription = Inscription.StatutInscription.VALIDEE
        inscription.save(update_fields=["statut_inscription"])

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
        utilisateur.statut_compte = Utilisateur.StatutCompte.REFUSE
        utilisateur.save(update_fields=["statut_compte"])

        return Response(self.get_serializer(inscription).data)
