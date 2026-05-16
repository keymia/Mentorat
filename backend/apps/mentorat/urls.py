from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.mentorat.views import (
    AdminMentorshipOverviewView,
    AdminMentorshipPeriodExportCsvView,
    AdminMentorshipPeriodExportExcelView,
    AdminMentorshipProgressView,
    AdminMentorshipReportsView,
    AdminMentorshipSessionsView,
    AdminMatchingAssignView,
    AdminMatchingDetailsView,
    AdminMatchingReassignView,
    AdminMatchingView,
    AdminSessionCompleteView,
    AdminSessionsView,
    AvailableMentorshipPeriodsView,
    DisabledLegacyMentorshipFeatureView,
    MentorContinueAssignmentView,
    MentorFollowUpDetailView,
    MentorFollowUpsView,
    MentorAssignmentProgressView,
    MentorAssignmentsView,
    MentorAssignmentSessionsView,
    MentorDashboardView,
    MentorMenteeDetailView,
    MentorMenteesView,
    MentorSessionCompleteView,
    MentorSessionDetailView,
    MentorSessionsView,
    MentoratViewSet,
    MentorshipAssignmentViewSet,
    MentorshipPeriodViewSet,
)

router = DefaultRouter()
router.register("mentorat", MentoratViewSet, basename="mentorat")
router.register("mentorship-periods", MentorshipPeriodViewSet, basename="mentorship-periods")
router.register("mentorship-assignments", MentorshipAssignmentViewSet, basename="mentorship-assignments")

legacy_disabled = DisabledLegacyMentorshipFeatureView.as_view()

urlpatterns = [
    path("mentorship-periods/available/", AvailableMentorshipPeriodsView.as_view(), name="available-mentorship-periods"),
    path("admin/mentorship-overview/", AdminMentorshipOverviewView.as_view(), name="admin-mentorship-overview"),
    path(
        "admin/mentorship-periods/<int:pk>/export/excel/",
        AdminMentorshipPeriodExportExcelView.as_view(),
        name="admin-mentorship-period-export-excel",
    ),
    path(
        "admin/mentorship-periods/<int:pk>/export/csv/",
        AdminMentorshipPeriodExportCsvView.as_view(),
        name="admin-mentorship-period-export-csv",
    ),
    path("admin/matching/", AdminMatchingView.as_view(), name="admin-matching"),
    path("admin/matching/<int:mentee_id>/details/", AdminMatchingDetailsView.as_view(), name="admin-matching-details"),
    path("admin/matching/<int:mentee_id>/reassign/", AdminMatchingReassignView.as_view(), name="admin-matching-reassign"),
    path("admin/matching/<int:mentee_id>/assign/", AdminMatchingAssignView.as_view(), name="admin-matching-assign"),
    path("admin/sessions/", AdminSessionsView.as_view(), name="admin-sessions"),
    path("admin/sessions/<int:pk>/complete/", AdminSessionCompleteView.as_view(), name="admin-session-complete"),
    path("admin/mentorship-sessions/", AdminMentorshipSessionsView.as_view(), name="admin-mentorship-sessions"),
    path("admin/mentorship-progress/", AdminMentorshipProgressView.as_view(), name="admin-mentorship-progress"),
    path("admin/mentorship-reports/", AdminMentorshipReportsView.as_view(), name="admin-mentorship-reports"),
    path("mentor/dashboard/", MentorDashboardView.as_view(), name="mentor-dashboard"),
    path("mentor/mentees/", MentorMenteesView.as_view(), name="mentor-mentees"),
    path("mentor/mentees/<int:pk>/", MentorMenteeDetailView.as_view(), name="mentor-mentee-detail"),
    path("mentor/assignments/", MentorAssignmentsView.as_view(), name="mentor-assignments"),
    path("mentor/sessions/", MentorSessionsView.as_view(), name="mentor-sessions"),
    path(
        "mentor/assignments/<int:pk>/sessions/",
        MentorAssignmentSessionsView.as_view(),
        name="mentor-assignment-sessions",
    ),
    path("mentor/sessions/<int:pk>/", MentorSessionDetailView.as_view(), name="mentor-session-detail"),
    path(
        "mentor/sessions/<int:pk>/complete/",
        MentorSessionCompleteView.as_view(),
        name="mentor-session-complete",
    ),
    path(
        "mentor/assignments/<int:pk>/progress/",
        MentorAssignmentProgressView.as_view(),
        name="mentor-assignment-progress",
    ),
    path("mentor/follow-ups/", MentorFollowUpsView.as_view(), name="mentor-follow-ups"),
    path("mentor/follow-ups/<int:pk>/", MentorFollowUpDetailView.as_view(), name="mentor-follow-up-detail"),
    path(
        "mentor/assignments/<int:pk>/continue/",
        MentorContinueAssignmentView.as_view(),
        name="mentor-assignment-continue",
    ),
    path("mentor/profile/", legacy_disabled, name="legacy-mentor-profile-disabled"),
    path("mentor/availability/", legacy_disabled, name="legacy-mentor-availability-disabled"),
    path("mentor/availability/<int:pk>/", legacy_disabled, name="legacy-mentor-availability-detail-disabled"),
    path(
        "mentor/availability-exceptions/",
        legacy_disabled,
        name="legacy-mentor-availability-exceptions-disabled",
    ),
    path(
        "mentor/availability-exceptions/<int:pk>/",
        legacy_disabled,
        name="legacy-mentor-availability-exception-detail-disabled",
    ),
    path(
        "mentors/<int:mentor_id>/available-slots/",
        legacy_disabled,
        name="legacy-mentor-available-slots-disabled",
    ),
    path("bookings/", legacy_disabled, name="legacy-bookings-disabled"),
    path("bookings/<int:pk>/", legacy_disabled, name="legacy-booking-detail-disabled"),
    path("bookings/<int:pk>/cancel/", legacy_disabled, name="legacy-booking-cancel-disabled"),
    path("my-bookings/", legacy_disabled, name="legacy-my-bookings-disabled"),
    path("", include(router.urls)),
]
