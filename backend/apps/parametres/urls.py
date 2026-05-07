from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.parametres.views import ParametreSystemeViewSet

router = DefaultRouter()
router.register("parametres", ParametreSystemeViewSet, basename="parametres")

urlpatterns = [path("", include(router.urls))]
