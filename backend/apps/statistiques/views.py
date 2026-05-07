from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.evenements.models import Evenement
from apps.inscriptions.models import Inscription
from apps.mentorat.models import Mentorat
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
            "jumelages_actifs": Mentorat.objects.filter(statut_jumelage=Mentorat.StatutJumelage.ACTIF).count(),
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
