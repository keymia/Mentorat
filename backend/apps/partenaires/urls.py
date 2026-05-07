from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.partenaires.views import PartenaireViewSet

router = DefaultRouter()
router.register("partenaires", PartenaireViewSet, basename="partenaires")

urlpatterns = [path("", include(router.urls))]
