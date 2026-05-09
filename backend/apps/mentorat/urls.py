from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.mentorat.views import (
    AvailableSlotsView,
    MentorAvailabilityExceptionViewSet,
    MentorAvailabilityViewSet,
    MentorProfileView,
    MentoratViewSet,
    MyBookingsView,
    SessionBookingViewSet,
)

router = DefaultRouter()
router.register("mentorat", MentoratViewSet, basename="mentorat")
router.register("mentor/availability", MentorAvailabilityViewSet, basename="mentor-availability")
router.register(
    "mentor/availability-exceptions",
    MentorAvailabilityExceptionViewSet,
    basename="mentor-availability-exceptions",
)
router.register("bookings", SessionBookingViewSet, basename="bookings")

urlpatterns = [
    path("mentor/profile/", MentorProfileView.as_view(), name="mentor-profile"),
    path("mentors/<int:mentor_id>/available-slots/", AvailableSlotsView.as_view(), name="mentor-available-slots"),
    path("my-bookings/", MyBookingsView.as_view(), name="my-bookings"),
    path("", include(router.urls)),
]
