from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.mentorat.views import MentoratViewSet

router = DefaultRouter()
router.register("mentorat", MentoratViewSet, basename="mentorat")

urlpatterns = [path("", include(router.urls))]
