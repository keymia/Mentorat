from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.mentorat.models import (
    MentoreeProgress,
    Mentorat,
    MentorshipAssignment,
    MentorshipPeriod,
    MentorshipSession,
)
from apps.mentorat.permissions import IsMentorUser
from apps.mentorat.serializers import (
    MentoreeProgressSerializer,
    MentoratSerializer,
    MentorshipAssignmentSerializer,
    MentorshipPeriodSerializer,
    MentorshipSessionSerializer,
)
from apps.users.permissions import IsAdminRole
from apps.users.serializers import UtilisateurLiteSerializer


def filter_assignments(queryset, query_params):
    period_id = query_params.get("period")
    mentor_id = query_params.get("mentor")
    mentoree_id = query_params.get("mentoree")
    status_value = query_params.get("status")

    if period_id:
        queryset = queryset.filter(period_id=period_id)
    if mentor_id:
        queryset = queryset.filter(mentor_id=mentor_id)
    if mentoree_id:
        queryset = queryset.filter(mentoree_id=mentoree_id)
    if status_value:
        queryset = queryset.filter(status=status_value)
    return queryset


def filter_sessions(queryset, query_params):
    period_id = query_params.get("period")
    mentor_id = query_params.get("mentor")
    mentoree_id = query_params.get("mentoree")
    session_status = query_params.get("session_status") or query_params.get("status")

    if period_id:
        queryset = queryset.filter(assignment__period_id=period_id)
    if mentor_id:
        queryset = queryset.filter(assignment__mentor_id=mentor_id)
    if mentoree_id:
        queryset = queryset.filter(assignment__mentoree_id=mentoree_id)
    if session_status:
        queryset = queryset.filter(status=session_status)
    return queryset


def filter_progress(queryset, query_params):
    period_id = query_params.get("period")
    mentor_id = query_params.get("mentor")
    mentoree_id = query_params.get("mentoree")
    progress_status = query_params.get("progress_status") or query_params.get("status")

    if period_id:
        queryset = queryset.filter(assignment__period_id=period_id)
    if mentor_id:
        queryset = queryset.filter(assignment__mentor_id=mentor_id)
    if mentoree_id:
        queryset = queryset.filter(assignment__mentoree_id=mentoree_id)
    if progress_status:
        queryset = queryset.filter(progress_status=progress_status)
    return queryset


def select_assignment_queryset():
    return MentorshipAssignment.objects.select_related(
        "mentor",
        "mentor__role",
        "mentor__niveau_academique",
        "mentoree",
        "mentoree__role",
        "mentoree__niveau_academique",
        "period",
    ).prefetch_related("sessions")


def select_session_queryset():
    return MentorshipSession.objects.select_related(
        "assignment",
        "assignment__mentor",
        "assignment__mentor__role",
        "assignment__mentor__niveau_academique",
        "assignment__mentoree",
        "assignment__mentoree__role",
        "assignment__mentoree__niveau_academique",
        "assignment__period",
    )


def select_progress_queryset():
    return MentoreeProgress.objects.select_related(
        "assignment",
        "assignment__mentor",
        "assignment__mentor__role",
        "assignment__mentor__niveau_academique",
        "assignment__mentoree",
        "assignment__mentoree__role",
        "assignment__mentoree__niveau_academique",
        "assignment__period",
    )


class DisabledLegacyMentorshipFeatureView(APIView):
    permission_classes = [AllowAny]

    def _response(self):
        return Response(
            {
                "detail": (
                    "Cette fonctionnalite de disponibilites libres ou de reservation automatique "
                    "est desactivee. Utilisez les periodes, affectations, seances et suivis de mentorat."
                )
            },
            status=status.HTTP_410_GONE,
        )

    def get(self, request, *args, **kwargs):
        return self._response()

    def post(self, request, *args, **kwargs):
        return self._response()

    def put(self, request, *args, **kwargs):
        return self._response()

    def patch(self, request, *args, **kwargs):
        return self._response()

    def delete(self, request, *args, **kwargs):
        return self._response()


class MentoratViewSet(viewsets.ModelViewSet):
    queryset = Mentorat.objects.select_related(
        "mentor",
        "mentor__role",
        "mentor__niveau_academique",
        "mentore",
        "mentore__role",
        "mentore__niveau_academique",
    ).all()
    serializer_class = MentoratSerializer
    permission_classes = [IsAdminRole]


class MentorshipPeriodViewSet(viewsets.ModelViewSet):
    serializer_class = MentorshipPeriodSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        return MentorshipPeriod.objects.annotate(
            assignments_count=Count("assignments", distinct=True),
            sessions_count=Count("assignments__sessions", distinct=True),
            completed_sessions_count=Count(
                "assignments__sessions",
                filter=Q(assignments__sessions__status=MentorshipSession.Status.COMPLETED),
                distinct=True,
            ),
        )


class MentorshipAssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = MentorshipAssignmentSerializer
    permission_classes = [IsAdminRole]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        return filter_assignments(select_assignment_queryset(), self.request.query_params)


class AvailableMentorshipPeriodsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        periods = MentorshipPeriod.objects.filter(
            status__in=[MentorshipPeriod.Status.DRAFT, MentorshipPeriod.Status.ACTIVE]
        ).order_by("-start_date", "title")
        return Response(MentorshipPeriodSerializer(periods, many=True).data)


class AdminMentorshipOverviewView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        assignments = filter_assignments(select_assignment_queryset(), request.query_params)
        sessions = filter_sessions(select_session_queryset(), request.query_params)
        progress = filter_progress(select_progress_queryset(), request.query_params)
        active_periods = MentorshipPeriod.objects.filter(status=MentorshipPeriod.Status.ACTIVE)

        return Response(
            {
                "periods": {
                    "total": MentorshipPeriod.objects.count(),
                    "active": active_periods.count(),
                    "active_items": MentorshipPeriodSerializer(active_periods, many=True).data,
                },
                "assignments": {
                    "total": assignments.count(),
                    "active": assignments.filter(status=MentorshipAssignment.Status.ACTIVE).count(),
                    "completed": assignments.filter(status=MentorshipAssignment.Status.COMPLETED).count(),
                    "suspended": assignments.filter(status=MentorshipAssignment.Status.SUSPENDED).count(),
                },
                "sessions": {
                    "total": sessions.count(),
                    "scheduled": sessions.filter(status=MentorshipSession.Status.SCHEDULED).count(),
                    "completed": sessions.filter(status=MentorshipSession.Status.COMPLETED).count(),
                    "cancelled": sessions.filter(status=MentorshipSession.Status.CANCELLED).count(),
                    "postponed": sessions.filter(status=MentorshipSession.Status.POSTPONED).count(),
                    "absent": sessions.filter(status=MentorshipSession.Status.ABSENT).count(),
                },
                "progress": {
                    "total": progress.count(),
                    "watch": progress.filter(progress_status=MentoreeProgress.ProgressStatus.WATCH).count(),
                    "difficulty": progress.filter(progress_status=MentoreeProgress.ProgressStatus.DIFFICULTY).count(),
                },
            }
        )


class AdminMentorshipSessionsView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        sessions = filter_sessions(select_session_queryset(), request.query_params)
        return Response(MentorshipSessionSerializer(sessions, many=True).data)


class AdminMentorshipProgressView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        progress = filter_progress(select_progress_queryset(), request.query_params)
        return Response(MentoreeProgressSerializer(progress, many=True).data)


class AdminMentorshipReportsView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        assignments = filter_assignments(select_assignment_queryset(), request.query_params)
        rows = []
        total_missing = 0
        for assignment in assignments:
            scheduled = assignment.sessions.count()
            completed = assignment.sessions.filter(status=MentorshipSession.Status.COMPLETED).count()
            missing = max(assignment.period.required_sessions - scheduled, 0)
            remaining = max(assignment.period.required_sessions - completed, 0)
            total_missing += missing
            rows.append(
                {
                    "assignment": MentorshipAssignmentSerializer(assignment).data,
                    "required_sessions": assignment.period.required_sessions,
                    "scheduled_sessions": scheduled,
                    "completed_sessions": completed,
                    "missing_sessions": missing,
                    "remaining_sessions": remaining,
                }
            )

        return Response(
            {
                "summary": {
                    "assignments": assignments.count(),
                    "missing_sessions": total_missing,
                },
                "results": rows,
            }
        )


class MentorDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsMentorUser]

    def get(self, request):
        assignments = select_assignment_queryset().filter(mentor=request.user)
        active_assignments = assignments.filter(status=MentorshipAssignment.Status.ACTIVE)
        sessions = select_session_queryset().filter(assignment__mentor=request.user)
        completed_sessions = sessions.filter(status=MentorshipSession.Status.COMPLETED).count()
        scheduled_sessions = sessions.count()
        required_sessions = sum(assignment.period.required_sessions for assignment in active_assignments)

        return Response(
            {
                "mentor": UtilisateurLiteSerializer(request.user).data,
                "active_periods": MentorshipPeriodSerializer(
                    MentorshipPeriod.objects.filter(status=MentorshipPeriod.Status.ACTIVE),
                    many=True,
                ).data,
                "counts": {
                    "mentees": active_assignments.values("mentoree_id").distinct().count(),
                    "assignments": active_assignments.count(),
                    "required_sessions": required_sessions,
                    "scheduled_sessions": scheduled_sessions,
                    "completed_sessions": completed_sessions,
                    "remaining_sessions": max(required_sessions - completed_sessions, 0),
                    "missing_sessions": max(required_sessions - scheduled_sessions, 0),
                },
                "assignments": MentorshipAssignmentSerializer(active_assignments, many=True).data,
            }
        )


class MentorMenteesView(APIView):
    permission_classes = [IsAuthenticated, IsMentorUser]

    def get(self, request):
        assignments = select_assignment_queryset().filter(
            mentor=request.user,
            status=MentorshipAssignment.Status.ACTIVE,
        )
        return Response(MentorshipAssignmentSerializer(assignments, many=True).data)


class MentorMenteeDetailView(APIView):
    permission_classes = [IsAuthenticated, IsMentorUser]

    def get(self, request, pk: int):
        assignments = select_assignment_queryset().filter(mentor=request.user, mentoree_id=pk)
        if not assignments.exists():
            return Response({"detail": "Mentore introuvable pour ce mentor."}, status=status.HTTP_404_NOT_FOUND)

        current_assignment = assignments.filter(status=MentorshipAssignment.Status.ACTIVE).first() or assignments.first()
        sessions = select_session_queryset().filter(assignment=current_assignment)
        progress = MentoreeProgress.objects.filter(assignment=current_assignment).first()
        return Response(
            {
                "mentee": UtilisateurLiteSerializer(current_assignment.mentoree).data,
                "assignments": MentorshipAssignmentSerializer(assignments, many=True).data,
                "current_assignment": MentorshipAssignmentSerializer(current_assignment).data,
                "sessions": MentorshipSessionSerializer(sessions, many=True).data,
                "progress": MentoreeProgressSerializer(progress).data if progress else None,
            }
        )


class MentorAssignmentsView(APIView):
    permission_classes = [IsAuthenticated, IsMentorUser]

    def get(self, request):
        assignments = filter_assignments(
            select_assignment_queryset().filter(mentor=request.user),
            request.query_params,
        )
        return Response(MentorshipAssignmentSerializer(assignments, many=True).data)


class MentorAssignmentSessionsView(APIView):
    permission_classes = [IsAuthenticated, IsMentorUser]

    def get_assignment(self, request, pk: int):
        return get_object_or_404(select_assignment_queryset(), pk=pk, mentor=request.user)

    def get(self, request, pk: int):
        assignment = self.get_assignment(request, pk)
        sessions = select_session_queryset().filter(assignment=assignment)
        return Response(MentorshipSessionSerializer(sessions, many=True).data)

    def post(self, request, pk: int):
        assignment = self.get_assignment(request, pk)
        payload = request.data.copy()
        payload["assignment"] = assignment.id
        serializer = MentorshipSessionSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        session = serializer.save()
        return Response(MentorshipSessionSerializer(session).data, status=status.HTTP_201_CREATED)


class MentorSessionDetailView(APIView):
    permission_classes = [IsAuthenticated, IsMentorUser]

    def get_session(self, request, pk: int):
        return get_object_or_404(select_session_queryset(), pk=pk, assignment__mentor=request.user)

    def patch(self, request, pk: int):
        session = self.get_session(request, pk)
        payload = request.data.copy()
        payload["assignment"] = session.assignment_id
        serializer = MentorshipSessionSerializer(session, data=payload, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        return Response(MentorshipSessionSerializer(updated).data)


class MentorSessionCompleteView(APIView):
    permission_classes = [IsAuthenticated, IsMentorUser]

    def patch(self, request, pk: int):
        session = get_object_or_404(select_session_queryset(), pk=pk, assignment__mentor=request.user)
        payload = request.data.copy()
        payload["assignment"] = session.assignment_id
        payload["status"] = MentorshipSession.Status.COMPLETED
        serializer = MentorshipSessionSerializer(session, data=payload, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        return Response(MentorshipSessionSerializer(updated).data)


class MentorAssignmentProgressView(APIView):
    permission_classes = [IsAuthenticated, IsMentorUser]

    def get_assignment(self, request, pk: int):
        return get_object_or_404(select_assignment_queryset(), pk=pk, mentor=request.user)

    def get(self, request, pk: int):
        assignment = self.get_assignment(request, pk)
        progress, _ = MentoreeProgress.objects.get_or_create(assignment=assignment)
        return Response(MentoreeProgressSerializer(progress).data)

    def patch(self, request, pk: int):
        assignment = self.get_assignment(request, pk)
        progress, _ = MentoreeProgress.objects.get_or_create(assignment=assignment)
        payload = request.data.copy()
        payload["assignment"] = assignment.id
        serializer = MentoreeProgressSerializer(progress, data=payload, partial=True)
        serializer.is_valid(raise_exception=True)
        updated = serializer.save()
        return Response(MentoreeProgressSerializer(updated).data)


class MentorContinueAssignmentView(APIView):
    permission_classes = [IsAuthenticated, IsMentorUser]

    def post(self, request, pk: int):
        assignment = get_object_or_404(select_assignment_queryset(), pk=pk, mentor=request.user)
        period_id = request.data.get("period")
        period = get_object_or_404(
            MentorshipPeriod,
            pk=period_id,
            status__in=[MentorshipPeriod.Status.DRAFT, MentorshipPeriod.Status.ACTIVE],
        )
        if period.id == assignment.period_id:
            return Response(
                {"period": "Choisissez une autre periode de mentorat."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if period.start_date <= assignment.period.start_date:
            return Response(
                {"period": "La nouvelle periode doit commencer apres la periode actuelle."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = MentorshipAssignmentSerializer(
            data={
                "mentor": assignment.mentor_id,
                "mentoree": assignment.mentoree_id,
                "period": period.id,
                "status": MentorshipAssignment.Status.ACTIVE,
                "admin_notes": "Renouvellement demande par le mentor.",
            }
        )
        serializer.is_valid(raise_exception=True)
        renewed_assignment = serializer.save()
        return Response(MentorshipAssignmentSerializer(renewed_assignment).data, status=status.HTTP_201_CREATED)
