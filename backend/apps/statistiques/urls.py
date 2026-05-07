from django.urls import path

from apps.statistiques.views import DashboardStatistiquesView

urlpatterns = [
    path("statistiques/dashboard/", DashboardStatistiquesView.as_view(), name="statistiques-dashboard"),
]
