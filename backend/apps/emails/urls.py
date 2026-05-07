from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.emails.views import EmailAutomatiqueViewSet

router = DefaultRouter()
router.register("emails", EmailAutomatiqueViewSet, basename="emails")

urlpatterns = [path("", include(router.urls))]
