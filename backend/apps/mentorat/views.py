from django.db import transaction
from django.http import HttpResponse
from django.db.models import Count, Exists, OuterRef, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.inscriptions.models import Inscription
from apps.inscriptions.serializers import InscriptionSerializer
from apps.mentorat.models import (
    MentoreeProgress,
    Mentorat,
    MentorshipAssignment,
    MentorshipPeriod,
    MentorshipPeriodExportLog,
    MentorshipSession,
)
from apps.mentorat.exports import (
    CSV_CONTENT_TYPE,
    EXCEL_CONTENT_TYPE,
    build_csv_export,
    build_excel_export,
    get_export_filename,
)
from apps.mentorat.permissions import IsMentorUser
from apps.mentorat.serializers import (
    MentoreeProgressSerializer,
    MentoratSerializer,
    MentorshipAssignmentSerializer,
    MentorshipPeriodSerializer,
    MentorshipSessionSerializer,
)
from apps.mentorat.services import (
    complete_expired_mentorship_periods,
    get_current_or_latest_period,
    get_mentors_disponibles_for_niveau,
    validate_mentor_for_mentore_level,
)
from apps.users.models import Utilisateur
from apps.users.permissions import IsAdminPrincipal, IsAdminRole
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
        "progress",
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


def mark_inscription_matched(assignment: MentorshipAssignment):
    Inscription.objects.filter(
        utilisateur=assignment.mentoree,
        mentorship_period=assignment.period,
        type_inscription=Inscription.TypeInscription.MENTORE,
    ).update(
        mentor_choisi=assignment.mentor,
        statut_inscription=Inscription.StatutInscription.VALIDEE,
        needs_matching=False,
        wants_association_assignment=False,
        registration_status=Inscription.RegistrationStatus.MATCHED,
    )


def matching_inscriptions_queryset(period: MentorshipPeriod | None = None):
    complete_expired_mentorship_periods()
    queryset = Inscription.objects.select_related(
        "utilisateur",
        "utilisateur__role",
        "utilisateur__niveau_academique",
        "mentor_choisi",
        "mentor_choisi__role",
        "mentor_choisi__niveau_academique",
        "mentorship_period",
    ).filter(
        type_inscription=Inscription.TypeInscription.MENTORE,
    ).exclude(
        statut_inscription=Inscription.StatutInscription.REFUSEE
    )
    if period:
        queryset = queryset.filter(mentorship_period=period)
    return queryset.distinct()


def matching_status_for(inscription: Inscription, assignment: MentorshipAssignment | None) -> str:
    period = inscription.mentorship_period
    if (
        inscription.registration_status == Inscription.RegistrationStatus.COMPLETED
        or (period and period.status == MentorshipPeriod.Status.COMPLETED)
        or (assignment and assignment.status == MentorshipAssignment.Status.COMPLETED)
    ):
        return "completed"
    if assignment and assignment.status == MentorshipAssignment.Status.ACTIVE:
        return "assigned"
    if inscription.mentor_choisi_id:
        return "assigned"
    if inscription.wants_association_assignment:
        return "association_choice"
    if inscription.needs_matching or inscription.registration_status == Inscription.RegistrationStatus.PENDING_MATCHING:
        return "pending_matching"
    return "unassigned"


def serialize_matching_row(inscription: Inscription, request=None) -> dict:
    serializer_context = {"request": request} if request else {}
    period = inscription.mentorship_period
    assignment_queryset = select_assignment_queryset().filter(mentoree=inscription.utilisateur)
    if period:
        assignment_queryset = assignment_queryset.filter(period=period)
    current_assignment = (
        assignment_queryset.filter(status=MentorshipAssignment.Status.ACTIVE).first()
        or assignment_queryset.first()
    )
    current_mentor = current_assignment.mentor if current_assignment else inscription.mentor_choisi

    compatible_mentors = []
    niveau = inscription.utilisateur.niveau_academique
    if niveau and period and period.status in [MentorshipPeriod.Status.DRAFT, MentorshipPeriod.Status.ACTIVE]:
        compatible_mentors = get_mentors_disponibles_for_niveau(niveau.id, period.id)
        if current_mentor:
            compatible_mentors = [mentor for mentor in compatible_mentors if mentor.id != current_mentor.id]

    return {
        "inscription": InscriptionSerializer(inscription, context=serializer_context).data,
        "mentee": UtilisateurLiteSerializer(inscription.utilisateur, context=serializer_context).data,
        "period": MentorshipPeriodSerializer(period).data if period else None,
        "current_mentor": UtilisateurLiteSerializer(current_mentor, context=serializer_context).data
        if current_mentor
        else None,
        "current_assignment": MentorshipAssignmentSerializer(current_assignment).data
        if current_assignment
        else None,
        "assignment_history": MentorshipAssignmentSerializer(assignment_queryset, many=True).data,
        "compatible_mentors": UtilisateurLiteSerializer(
            compatible_mentors,
            many=True,
            context=serializer_context,
        ).data,
        "matching_status": matching_status_for(inscription, current_assignment),
        "needs_matching": inscription.needs_matching,
        "wants_association_assignment": inscription.wants_association_assignment,
    }


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

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [IsAdminRole()]
        return [IsAdminPrincipal()]

    def get_queryset(self):
        complete_expired_mentorship_periods()
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

    def perform_create(self, serializer):
        assignment = serializer.save()
        mark_inscription_matched(assignment)


class AvailableMentorshipPeriodsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        complete_expired_mentorship_periods()
        periods = MentorshipPeriod.objects.filter(
            status__in=[MentorshipPeriod.Status.DRAFT, MentorshipPeriod.Status.ACTIVE]
        ).order_by("-start_date", "title")
        return Response(MentorshipPeriodSerializer(periods, many=True).data)


class AdminMentorshipOverviewView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        complete_expired_mentorship_periods()
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


class AdminMentorshipPeriodExportExcelView(APIView):
    permission_classes = [IsAdminPrincipal]

    def get(self, request, pk: int):
        period = get_object_or_404(MentorshipPeriod, pk=pk)
        filename = get_export_filename(period, "xlsx")
        payload = build_excel_export(period)
        MentorshipPeriodExportLog.objects.create(
            period=period,
            exported_by=request.user,
            format=MentorshipPeriodExportLog.Format.EXCEL,
            file_name=filename,
        )
        response = HttpResponse(payload, content_type=EXCEL_CONTENT_TYPE)
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class AdminMentorshipPeriodExportCsvView(APIView):
    permission_classes = [IsAdminPrincipal]

    def get(self, request, pk: int):
        period = get_object_or_404(MentorshipPeriod, pk=pk)
        filename = get_export_filename(period, "csv")
        payload = build_csv_export(period)
        MentorshipPeriodExportLog.objects.create(
            period=period,
            exported_by=request.user,
            format=MentorshipPeriodExportLog.Format.CSV,
            file_name=filename,
        )
        response = HttpResponse(payload, content_type=CSV_CONTENT_TYPE)
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        return response


class AdminMatchingView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        periods = list(MentorshipPeriod.objects.order_by("-start_date", "title"))
        selected_period = None
        period_id = request.query_params.get("period")
        if period_id:
            selected_period = get_object_or_404(MentorshipPeriod, pk=period_id)
        else:
            selected_period = get_current_or_latest_period()

        inscriptions = matching_inscriptions_queryset(selected_period)
        rows = [serialize_matching_row(inscription, request) for inscription in inscriptions]

        return Response(
            {
                "periods": MentorshipPeriodSerializer(periods, many=True).data,
                "selected_period": MentorshipPeriodSerializer(selected_period).data if selected_period else None,
                "show_session_filter": len(periods) > 1,
                "results": rows,
            }
        )


class AdminMatchingDetailsView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request, mentee_id: int):
        period_id = request.query_params.get("period")
        period = get_object_or_404(MentorshipPeriod, pk=period_id) if period_id else None
        inscription = get_object_or_404(
            matching_inscriptions_queryset(period).filter(utilisateur_id=mentee_id).order_by("-date_inscription")
        )
        return Response(serialize_matching_row(inscription, request))


def reassign_matching_mentee(mentee_id: int, mentor_id: int, period: MentorshipPeriod):
    if period.status not in [MentorshipPeriod.Status.DRAFT, MentorshipPeriod.Status.ACTIVE]:
        raise ValueError("Impossible de modifier un jumelage pour une session terminee ou archivee.")

    inscription_queryset = (
        Inscription.objects.select_for_update(of=("self",))
        .select_related("utilisateur", "utilisateur__niveau_academique", "mentorship_period")
        .filter(
            utilisateur_id=mentee_id,
            mentorship_period=period,
            type_inscription=Inscription.TypeInscription.MENTORE,
        )
        .exclude(statut_inscription=Inscription.StatutInscription.REFUSEE)
    )
    inscription = get_object_or_404(inscription_queryset)
    mentoree = inscription.utilisateur
    mentor = get_object_or_404(Utilisateur.objects.select_related("niveau_academique"), pk=mentor_id)

    if not mentoree.niveau_academique_id:
        raise ValueError("Le mentore doit avoir un niveau academique.")

    if mentoree.statut_compte != Utilisateur.StatutCompte.ACTIF or not mentoree.is_active:
        mentoree.statut_compte = Utilisateur.StatutCompte.ACTIF
        mentoree.is_active = True
        mentoree.save(update_fields=["statut_compte", "is_active"])

    if inscription.statut_inscription != Inscription.StatutInscription.VALIDEE:
        inscription.statut_inscription = Inscription.StatutInscription.VALIDEE
        inscription.save(update_fields=["statut_inscription"])

    active_assignments = MentorshipAssignment.objects.select_for_update().filter(
        mentoree=mentoree,
        period=period,
        status=MentorshipAssignment.Status.ACTIVE,
    )
    current_assignment = active_assignments.first()
    if current_assignment and current_assignment.mentor_id == mentor.id:
        mark_inscription_matched(current_assignment)
        return current_assignment, False

    validate_mentor_for_mentore_level(mentor, mentoree.niveau_academique, period)

    old_mentor_ids = list(active_assignments.values_list("mentor_id", flat=True))
    if old_mentor_ids:
        active_assignments.update(
            status=MentorshipAssignment.Status.SUSPENDED,
            admin_notes="Affectation remplacee depuis la page Jumelage.",
            updated_at=timezone.now(),
        )
        for old_mentor_id in set(old_mentor_ids):
            MentorshipAssignment.actualiser_nombre_mentores(old_mentor_id)

    serializer = MentorshipAssignmentSerializer(
        data={
            "mentor": mentor.id,
            "mentoree": mentoree.id,
            "period": period.id,
            "status": MentorshipAssignment.Status.ACTIVE,
            "admin_notes": "Affectation creee depuis la page Jumelage.",
        }
    )
    serializer.is_valid(raise_exception=True)
    assignment = serializer.save()
    mark_inscription_matched(assignment)
    return assignment, True


class AdminMatchingAssignView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, mentee_id: int):
        period_id = request.data.get("period")
        mentor_id = request.data.get("mentor")
        if not mentor_id:
            return Response({"mentor": "Selectionnez un mentor."}, status=status.HTTP_400_BAD_REQUEST)

        period = get_object_or_404(MentorshipPeriod, pk=period_id) if period_id else get_current_or_latest_period()
        if not period:
            return Response({"period": "Aucune session de mentorat disponible."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                assignment, created = reassign_matching_mentee(mentee_id, mentor_id, period)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        response_status = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(MentorshipAssignmentSerializer(assignment).data, status=response_status)


class AdminMatchingReassignView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, mentee_id: int):
        mentor_id = request.data.get("new_mentor_id") or request.data.get("mentor")
        period_id = request.data.get("session_id") or request.data.get("period")
        if not mentor_id:
            return Response({"new_mentor_id": "Selectionnez un nouveau mentor."}, status=status.HTTP_400_BAD_REQUEST)

        period = get_object_or_404(MentorshipPeriod, pk=period_id) if period_id else get_current_or_latest_period()
        if not period:
            return Response({"session_id": "Aucune session de mentorat disponible."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                assignment, _created = reassign_matching_mentee(mentee_id, mentor_id, period)
                inscription = get_object_or_404(
                    matching_inscriptions_queryset(period),
                    utilisateur_id=assignment.mentoree_id,
                )
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serialize_matching_row(inscription, request))

    def patch(self, request, mentee_id: int):
        return self.post(request, mentee_id)


class AdminSessionsView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        complete_expired_mentorship_periods()
        periods = MentorshipPeriod.objects.annotate(
            assignments_count=Count("assignments", distinct=True),
            sessions_count=Count("assignments__sessions", distinct=True),
            completed_sessions_count=Count(
                "assignments__sessions",
                filter=Q(assignments__sessions__status=MentorshipSession.Status.COMPLETED),
                distinct=True,
            ),
        )
        return Response(MentorshipPeriodSerializer(periods, many=True).data)


class AdminSessionCompleteView(APIView):
    permission_classes = [IsAdminPrincipal]

    def patch(self, request, pk: int):
        period = get_object_or_404(MentorshipPeriod, pk=pk)
        period.status = MentorshipPeriod.Status.COMPLETED
        period.auto_completed_at = timezone.now()
        period.save(update_fields=["status", "auto_completed_at", "updated_at"])
        mentor_ids = list(
            MentorshipAssignment.objects.filter(
                period=period,
                status=MentorshipAssignment.Status.ACTIVE,
            ).values_list("mentor_id", flat=True)
        )
        MentorshipAssignment.objects.filter(
            period=period,
            status=MentorshipAssignment.Status.ACTIVE,
        ).update(status=MentorshipAssignment.Status.COMPLETED, updated_at=timezone.now())
        for mentor_id in set(mentor_ids):
            MentorshipAssignment.actualiser_nombre_mentores(mentor_id)
        Inscription.objects.filter(
            mentorship_period=period,
            type_inscription=Inscription.TypeInscription.MENTORE,
        ).update(
            registration_status=Inscription.RegistrationStatus.COMPLETED,
            completed_session_status=Inscription.CompletedSessionStatus.COMPLETED,
            needs_matching=False,
        )
        return Response(MentorshipPeriodSerializer(period).data)


class MentorDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsMentorUser]

    def get(self, request):
        assignments = select_assignment_queryset().filter(mentor=request.user)
        active_assignments = assignments.filter(status=MentorshipAssignment.Status.ACTIVE)
        sessions = select_session_queryset().filter(assignment__mentor=request.user)
        completed_sessions = sessions.filter(status=MentorshipSession.Status.COMPLETED).count()
        scheduled_sessions = sessions.count()
        required_sessions = sum(assignment.period.required_sessions for assignment in active_assignments)
        global_progress = round((completed_sessions / required_sessions) * 100) if required_sessions else 0
        last_sessions = sessions.order_by("-scheduled_date", "-start_time", "-session_number")[:5]
        mentees_needing_follow_up = active_assignments.filter(
            Q(progress__isnull=True)
            | Q(progress__progress_status__in=[MentoreeProgress.ProgressStatus.WATCH, MentoreeProgress.ProgressStatus.DIFFICULTY])
        ).distinct()[:5]

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
                "global_progress": global_progress,
                "last_sessions": MentorshipSessionSerializer(last_sessions, many=True).data,
                "mentees_needing_follow_up": MentorshipAssignmentSerializer(mentees_needing_follow_up, many=True).data,
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


class MentorSessionsView(APIView):
    permission_classes = [IsAuthenticated, IsMentorUser]

    def get_assignment(self, request, payload):
        assignment_id = payload.get("assignment")
        if assignment_id:
            return get_object_or_404(select_assignment_queryset(), pk=assignment_id, mentor=request.user)

        mentoree_id = payload.get("mentoree") or payload.get("mentoree_id")
        if not mentoree_id:
            return None
        return get_object_or_404(
            select_assignment_queryset(),
            mentor=request.user,
            mentoree_id=mentoree_id,
            status=MentorshipAssignment.Status.ACTIVE,
        )

    def get(self, request):
        sessions = filter_sessions(
            select_session_queryset().filter(assignment__mentor=request.user),
            request.query_params,
        )
        return Response(MentorshipSessionSerializer(sessions, many=True).data)

    def post(self, request):
        payload = request.data.copy()
        assignment = self.get_assignment(request, payload)
        if assignment is None:
            return Response(
                {"mentoree": "Selectionnez un mentore ou une affectation."},
                status=status.HTTP_400_BAD_REQUEST,
            )
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


class MentorFollowUpsView(APIView):
    permission_classes = [IsAuthenticated, IsMentorUser]

    def get(self, request):
        sessions = filter_sessions(
            select_session_queryset().filter(
                assignment__mentor=request.user,
                status=MentorshipSession.Status.COMPLETED,
            ),
            request.query_params,
        )
        return Response(MentorshipSessionSerializer(sessions, many=True).data)


class MentorFollowUpDetailView(APIView):
    permission_classes = [IsAuthenticated, IsMentorUser]

    def patch(self, request, pk: int):
        session = get_object_or_404(select_session_queryset(), pk=pk, assignment__mentor=request.user)
        payload = request.data.copy()
        session_payload = {
            "assignment": session.assignment_id,
            "status": MentorshipSession.Status.COMPLETED,
            "summary": payload.get("summary", session.summary),
            "mentor_comment": payload.get("observation", payload.get("mentor_comment", session.mentor_comment)),
        }
        session_serializer = MentorshipSessionSerializer(session, data=session_payload, partial=True)
        session_serializer.is_valid(raise_exception=True)
        updated_session = session_serializer.save()

        required_sessions = session.assignment.period.required_sessions or 1
        completed_count = session.assignment.sessions.filter(status=MentorshipSession.Status.COMPLETED).count()
        progress_percentage = min(int((completed_count / required_sessions) * 100), 100)
        progress, _ = MentoreeProgress.objects.get_or_create(assignment=session.assignment)
        progress_payload = {
            "assignment": session.assignment_id,
            "progress_status": payload.get("progress_status", progress.progress_status),
            "progress_percentage": progress_percentage,
            "achievements": payload.get("observation", progress.achievements),
            "recommendations": payload.get("recommendations", progress.recommendations),
            "mentor_opinion": payload.get("appreciation", payload.get("mentor_opinion", progress.mentor_opinion)),
        }
        progress_serializer = MentoreeProgressSerializer(progress, data=progress_payload, partial=True)
        progress_serializer.is_valid(raise_exception=True)
        updated_progress = progress_serializer.save()

        return Response(
            {
                "session": MentorshipSessionSerializer(updated_session).data,
                "progress": MentoreeProgressSerializer(updated_progress).data,
            }
        )


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
