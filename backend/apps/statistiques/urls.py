from django.urls import path

from apps.statistiques.views import AdminActionAlertsView, DashboardStatistiquesView

urlpatterns = [
    path("admin/action-alerts/", AdminActionAlertsView.as_view(), name="admin-action-alerts"),
    path("statistiques/dashboard/", DashboardStatistiquesView.as_view(), name="statistiques-dashboard"),
]
