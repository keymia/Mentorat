from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.inscriptions.views import InscriptionViewSet, MentoreInscriptionView, MentorInscriptionView

router = DefaultRouter()
router.register("inscriptions", InscriptionViewSet, basename="inscriptions")

urlpatterns = [
    path("inscriptions/mentor/", MentorInscriptionView.as_view(), name="inscription-mentor"),
    path("inscriptions/mentore/", MentoreInscriptionView.as_view(), name="inscription-mentore"),
    path("", include(router.urls)),
]
