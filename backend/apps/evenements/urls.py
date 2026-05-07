from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.evenements.views import EvenementViewSet, ParticipationViewSet

router = DefaultRouter()
router.register("evenements", EvenementViewSet, basename="evenements")
router.register("participations", ParticipationViewSet, basename="participations")

urlpatterns = [path("", include(router.urls))]
