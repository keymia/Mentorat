from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.mentorat.models import (
    MentorAvailability,
    MentorAvailabilityException,
    MentorProfile,
    Mentorat,
    SessionBooking,
)
from apps.mentorat.permissions import IsMentorUser
from apps.mentorat.serializers import (
    AvailableSlotQuerySerializer,
    AvailableSlotSerializer,
    BookingCreateSerializer,
    MentorAvailabilityExceptionSerializer,
    MentorAvailabilitySerializer,
    MentorProfileSerializer,
    MentoratSerializer,
    SessionBookingSerializer,
)
from apps.mentorat.services import generate_available_slots, get_or_create_mentor_profile
from apps.users.models import Utilisateur
from apps.users.permissions import IsAdminRole


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


class MentorProfileView(APIView):
    permission_classes = [IsAuthenticated, IsMentorUser]

    def get(self, request):
        profile = get_or_create_mentor_profile(request.user)
        return Response(MentorProfileSerializer(profile, context={"request": request}).data)

    def put(self, request):
        profile = get_or_create_mentor_profile(request.user)
        serializer = MentorProfileSerializer(profile, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save(mentor=request.user)
        return Response(serializer.data)


class MentorAvailabilityViewSet(viewsets.ModelViewSet):
    serializer_class = MentorAvailabilitySerializer
    permission_classes = [IsAuthenticated, IsMentorUser]
    http_method_names = ["get", "post", "put", "delete", "head", "options"]

    def get_queryset(self):
        return MentorAvailability.objects.filter(mentor=self.request.user).order_by("weekday", "start_time")

    def perform_create(self, serializer):
        serializer.save(mentor=self.request.user)

    def perform_update(self, serializer):
        serializer.save(mentor=self.request.user)


class MentorAvailabilityExceptionViewSet(viewsets.ModelViewSet):
    serializer_class = MentorAvailabilityExceptionSerializer
    permission_classes = [IsAuthenticated, IsMentorUser]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        return MentorAvailabilityException.objects.filter(mentor=self.request.user).order_by("-start_date")

    def perform_create(self, serializer):
        serializer.save(mentor=self.request.user)


class AvailableSlotsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, mentor_id: int):
        query_serializer = AvailableSlotQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)
        mentor = get_object_or_404(
            Utilisateur.objects.select_related("role", "niveau_academique").filter(
                profil_mentorat__in=[
                    Utilisateur.ProfilMentorat.MENTOR,
                    Utilisateur.ProfilMentorat.MENTOR_ET_MENTORE,
                ],
                statut_compte=Utilisateur.StatutCompte.ACTIF,
                is_active=True,
            ),
            pk=mentor_id,
        )
        slots = generate_available_slots(
            mentor,
            query_serializer.validated_data["start_date"],
            query_serializer.validated_data["end_date"],
            request.user if request.user.is_authenticated and request.user.est_mentore else None,
        )
        return Response(AvailableSlotSerializer(slots, many=True).data)


class SessionBookingViewSet(viewsets.GenericViewSet):
    queryset = SessionBooking.objects.select_related(
        "mentor",
        "mentor__niveau_academique",
        "mentor__role",
        "mentore",
        "mentore__niveau_academique",
        "mentore__role",
    )
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == "create":
            return BookingCreateSerializer
        return SessionBookingSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.est_administrateur:
            return queryset
        return queryset.filter(mentor=user) | queryset.filter(mentore=user)

    def create(self, request):
        if not request.user.est_mentore:
            return Response(
                {"detail": "Seul un mentore peut reserver une seance."},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        booking = serializer.save()
        return Response(SessionBookingSerializer(booking, context={"request": request}).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["patch"], url_path="cancel")
    def cancel(self, request, pk=None):
        booking = self.get_object()
        if not (request.user.est_administrateur or request.user.id in {booking.mentor_id, booking.mentore_id}):
            return Response({"detail": "Permission refusee."}, status=status.HTTP_403_FORBIDDEN)
        if booking.status in {SessionBooking.Status.CANCELLED, SessionBooking.Status.COMPLETED}:
            return Response(
                {"detail": "Cette reservation ne peut plus etre annulee."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        booking.status = SessionBooking.Status.CANCELLED
        booking.save(update_fields=["status"])
        return Response(SessionBookingSerializer(booking, context={"request": request}).data)


class MyBookingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = SessionBooking.objects.select_related(
            "mentor",
            "mentor__niveau_academique",
            "mentor__role",
            "mentore",
            "mentore__niveau_academique",
            "mentore__role",
        ).filter(mentor=request.user) | SessionBooking.objects.select_related(
            "mentor",
            "mentor__niveau_academique",
            "mentor__role",
            "mentore",
            "mentore__niveau_academique",
            "mentore__role",
        ).filter(mentore=request.user)
        serializer = SessionBookingSerializer(queryset.order_by("-starts_at"), many=True, context={"request": request})
        return Response(serializer.data)
