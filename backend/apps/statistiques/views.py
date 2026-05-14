from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.evenements.models import Evenement
from apps.inscriptions.models import Inscription
from apps.mentorat.models import MentorshipAssignment
from apps.mentorat.services import count_pending_matching_requests, get_session_ending_alert
from apps.partenaires.models import Partenaire
from apps.statistiques.serializers import DashboardStatistiquesSerializer
from apps.users.models import Utilisateur
from apps.users.permissions import IsAdminRole


class DashboardStatistiquesView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        mentors_actifs = Utilisateur.objects.filter(
            profil_mentorat__in=[
                Utilisateur.ProfilMentorat.MENTOR,
                Utilisateur.ProfilMentorat.MENTOR_ET_MENTORE,
            ],
            statut_compte=Utilisateur.StatutCompte.ACTIF,
        )
        mentores = Utilisateur.objects.filter(
            profil_mentorat__in=[
                Utilisateur.ProfilMentorat.MENTORE,
                Utilisateur.ProfilMentorat.MENTOR_ET_MENTORE,
            ]
        )
        mentors_disponibles = sum(1 for mentor in mentors_actifs if mentor.capacite_restante() > 0)
        mentors_satures = sum(1 for mentor in mentors_actifs if mentor.capacite_effective() > 0 and mentor.capacite_restante() == 0)
        donnees = {
            "total_mentors": mentors_actifs.count(),
            "total_mentores": mentores.count(),
            "inscriptions_en_attente": Inscription.objects.filter(
                statut_inscription=Inscription.StatutInscription.EN_ATTENTE
            ).count(),
            "jumelages_actifs": MentorshipAssignment.objects.filter(
                status=MentorshipAssignment.Status.ACTIVE
            ).count(),
            "mentors_disponibles": mentors_disponibles,
            "mentors_satures": mentors_satures,
            "evenements_a_venir": Evenement.objects.filter(
                date_evenement__gte=timezone.localdate(),
                statut_evenement=Evenement.StatutEvenement.PLANIFIE,
            ).count(),
            "partenaires_actifs": Partenaire.objects.filter(statut=Partenaire.Statut.ACTIF).count(),
        }
        serializer = DashboardStatistiquesSerializer(donnees)
        return Response(serializer.data)


class AdminActionAlertsView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        session_alert = get_session_ending_alert()
        active_period = session_alert["active_period"]
        return Response(
            {
                "pending_matching_count": count_pending_matching_requests(),
                "pending_registration_count": Inscription.objects.filter(
                    statut_inscription=Inscription.StatutInscription.EN_ATTENTE
                ).count(),
                "session_ending_soon": session_alert["session_ending_soon"],
                "days_before_session_end": session_alert["days_before_session_end"],
                "active_session": {
                    "id": active_period.id,
                    "title": active_period.title,
                    "end_date": active_period.end_date,
                }
                if active_period
                else None,
            }
        )
