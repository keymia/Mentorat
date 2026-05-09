"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarPlus, RefreshCcw, XCircle } from "lucide-react";

import {
  AvailableSlot,
  MentorDisponible,
  NiveauAcademique,
  SessionBooking,
  cancelBooking,
  createBooking,
  formatApiError,
  getAvailableSlots,
  getMentorsDisponibles,
  getMyBookings,
  getNiveaux,
} from "@/lib/api";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Status = {
  type: "idle" | "success" | "error" | "warning";
  message: string;
};

function toDateInput(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function slotKey(slot: AvailableSlot) {
  return `${slot.starts_at}|${slot.ends_at}`;
}

function formatSlot(startsAt: string, endsAt: string) {
  const dateFormatter = new Intl.DateTimeFormat("fr-CA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const timeFormatter = new Intl.DateTimeFormat("fr-CA", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${dateFormatter.format(new Date(startsAt))} - ${timeFormatter.format(new Date(endsAt))}`;
}

function bookingStatusLabel(status: SessionBooking["status"]) {
  const labels: Record<SessionBooking["status"], string> = {
    pending: "En attente",
    confirmed: "Confirmee",
    cancelled: "Annulee",
    completed: "Terminee",
  };
  return labels[status];
}

export function BookingPlanner() {
  const [niveaux, setNiveaux] = useState<NiveauAcademique[]>([]);
  const [mentors, setMentors] = useState<MentorDisponible[]>([]);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [bookings, setBookings] = useState<SessionBooking[]>([]);
  const [niveauId, setNiveauId] = useState("");
  const [mentorId, setMentorId] = useState("");
  const [startDate, setStartDate] = useState(toDateInput());
  const [endDate, setEndDate] = useState(toDateInput(14));
  const [selectedSlotKey, setSelectedSlotKey] = useState("");
  const [isLoadingMentors, setIsLoadingMentors] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>({ type: "idle", message: "" });

  const selectedSlot = useMemo(
    () => slots.find((slot) => slotKey(slot) === selectedSlotKey),
    [selectedSlotKey, slots],
  );

  useEffect(() => {
    let isMounted = true;
    Promise.allSettled([getNiveaux(), getMyBookings()]).then(([niveauxResult, bookingsResult]) => {
      if (!isMounted) {
        return;
      }
      if (niveauxResult.status === "fulfilled") {
        setNiveaux(niveauxResult.value);
      } else {
        setStatus({ type: "error", message: `Niveaux indisponibles: ${formatApiError(niveauxResult.reason)}` });
      }
      if (bookingsResult.status === "fulfilled") {
        setBookings(bookingsResult.value);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleNiveauChange(selectedNiveauId: string) {
    setNiveauId(selectedNiveauId);
    setMentorId("");
    setMentors([]);
    setSlots([]);
    setSelectedSlotKey("");
    if (!selectedNiveauId) {
      return;
    }

    setIsLoadingMentors(true);
    setStatus({ type: "idle", message: "" });
    try {
      const mentorsDisponibles = await getMentorsDisponibles(Number(selectedNiveauId));
      setMentors(mentorsDisponibles);
    } catch (error) {
      setStatus({ type: "error", message: `Mentors indisponibles: ${formatApiError(error)}` });
    } finally {
      setIsLoadingMentors(false);
    }
  }

  async function loadSlotsForMentor(selectedMentorId: string, rangeStart: string, rangeEnd: string) {
    if (!selectedMentorId) {
      return;
    }
    setIsLoadingSlots(true);
    try {
      const availableSlots = await getAvailableSlots(Number(selectedMentorId), rangeStart, rangeEnd);
      setSlots(availableSlots);
      setSelectedSlotKey("");
    } catch (error) {
      setStatus({ type: "error", message: `Creneaux indisponibles: ${formatApiError(error)}` });
    } finally {
      setIsLoadingSlots(false);
    }
  }

  async function handleMentorSelectionChange(selectedMentorId: string) {
    setMentorId(selectedMentorId);
    setSlots([]);
    setSelectedSlotKey("");
    if (selectedMentorId) {
      await loadSlotsForMentor(selectedMentorId, startDate, endDate);
    }
  }

  async function refreshSlots() {
    await loadSlotsForMentor(mentorId, startDate, endDate);
  }

  async function refreshBookings() {
    try {
      const myBookings = await getMyBookings();
      setBookings(myBookings);
    } catch {
      setBookings([]);
    }
  }

  async function handleBookingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSlot) {
      setStatus({ type: "warning", message: "Choisissez un creneau disponible." });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: "idle", message: "" });
    try {
      await createBooking({
        mentor: selectedSlot.mentor,
        starts_at: selectedSlot.starts_at,
        ends_at: selectedSlot.ends_at,
      });
      setStatus({ type: "success", message: "Reservation envoyee. Elle apparait maintenant dans vos seances." });
      await Promise.all([refreshBookings(), refreshSlots()]);
    } catch (error) {
      setStatus({ type: "error", message: formatApiError(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancelBooking(id: number) {
    setStatus({ type: "idle", message: "" });
    try {
      await cancelBooking(id);
      setStatus({ type: "success", message: "Reservation annulee." });
      await Promise.all([refreshBookings(), refreshSlots()]);
    } catch (error) {
      setStatus({ type: "error", message: formatApiError(error) });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <Card>
        <CardHeader>
          <CardTitle>Reserver une seance</CardTitle>
          <CardDescription>
            Selectionnez votre niveau, puis un mentor compatible. Seuls les creneaux vraiment disponibles sont affiches.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleBookingSubmit} className="grid gap-5">
            {status.message ? (
              <Alert variant={status.type === "success" ? "success" : status.type === "warning" ? "warning" : "error"}>
                {status.message}
              </Alert>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <label>
                Niveau academique
                <select
                  className="field"
                  value={niveauId}
                  onChange={(event) => void handleNiveauChange(event.target.value)}
                >
                  <option value="">Choisir un niveau</option>
                  {niveaux.map((niveau) => (
                    <option key={niveau.id} value={niveau.id}>
                      {niveau.nom}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Mentor
                <select
                  className="field"
                  value={mentorId}
                  disabled={!niveauId || mentors.length === 0}
                  onChange={(event) => void handleMentorSelectionChange(event.target.value)}
                >
                  <option value="">{isLoadingMentors ? "Chargement..." : "Choisir un mentor"}</option>
                  {mentors.map((mentor) => (
                    <option key={mentor.id} value={mentor.id}>
                      {mentor.prenom} {mentor.nom} - {mentor.niveau_academique_nom}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {niveauId && !isLoadingMentors && mentors.length === 0 ? (
              <Alert variant="warning">Aucun mentor disponible pour ce niveau actuellement.</Alert>
            ) : null}

            <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <label>
                Debut
                <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              </label>
              <label>
                Fin
                <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
              </label>
              <Button type="button" variant="outline" onClick={() => void refreshSlots()} disabled={!mentorId || isLoadingSlots}>
                <RefreshCcw aria-hidden="true" />
                Actualiser
              </Button>
            </div>

            <fieldset className="grid gap-3">
              <legend className="text-sm font-semibold text-foreground">Creneaux disponibles</legend>
              {isLoadingSlots ? (
                <p className="rounded-xl border border-border bg-muted/35 p-4 text-sm text-muted-foreground">
                  Chargement des creneaux...
                </p>
              ) : slots.length > 0 ? (
                <div className="grid gap-2">
                  {slots.map((slot) => (
                    <label
                      key={slotKey(slot)}
                      className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 text-sm transition hover:border-accent"
                    >
                      <span>
                        <span className="block font-medium">{formatSlot(slot.starts_at, slot.ends_at)}</span>
                        <span className="text-muted-foreground">{slot.duration_minutes} minutes</span>
                      </span>
                      <input
                        type="radio"
                        name="slot"
                        value={slotKey(slot)}
                        checked={selectedSlotKey === slotKey(slot)}
                        onChange={(event) => setSelectedSlotKey(event.target.value)}
                      />
                    </label>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-border bg-muted/35 p-4 text-sm text-muted-foreground">
                  Aucun creneau disponible pour cette periode.
                </p>
              )}
            </fieldset>

            <Button type="submit" disabled={!selectedSlot || isSubmitting}>
              <CalendarPlus aria-hidden="true" />
              {isSubmitting ? "Reservation..." : "Reserver le creneau"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mes seances</CardTitle>
          <CardDescription>Suivi rapide de vos reservations.</CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.length > 0 ? (
            <div className="grid gap-3">
              {bookings.map((booking) => (
                <div key={booking.id} className="rounded-xl border border-border bg-muted/35 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{formatSlot(booking.starts_at, booking.ends_at)}</p>
                      <p className="text-sm text-muted-foreground">
                        Statut: {bookingStatusLabel(booking.status)}
                      </p>
                    </div>
                    {booking.status === "pending" || booking.status === "confirmed" ? (
                      <Button type="button" variant="ghost" size="sm" onClick={() => void handleCancelBooking(booking.id)}>
                        <XCircle aria-hidden="true" />
                        Annuler
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-border bg-muted/35 p-4 text-sm text-muted-foreground">
              Aucune reservation trouvee pour votre compte.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
