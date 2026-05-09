"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarClock, Plus, Save, Settings2, Trash2 } from "lucide-react";

import {
  MentorAvailability,
  MentorAvailabilityException,
  MentorProfile,
  createMentorAvailability,
  createMentorAvailabilityException,
  deleteMentorAvailability,
  deleteMentorAvailabilityException,
  formatApiError,
  getMentorAvailability,
  getMentorAvailabilityExceptions,
  getMentorProfile,
  updateMentorAvailability,
  updateMentorProfile,
} from "@/lib/api";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const weekdays = [
  { value: 0, label: "Lundi" },
  { value: 1, label: "Mardi" },
  { value: 2, label: "Mercredi" },
  { value: 3, label: "Jeudi" },
  { value: 4, label: "Vendredi" },
  { value: 5, label: "Samedi" },
  { value: 6, label: "Dimanche" },
];

type FormStatus = {
  type: "idle" | "success" | "error";
  message: string;
};

type ProfileDraft = {
  max_mentores: string;
  max_sessions_per_week: string;
  default_session_duration: "30" | "45" | "60" | "90";
};

type AvailabilityDraft = {
  weekday: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
};

type ExceptionDraft = {
  start_date: string;
  end_date: string;
  reason: string;
};

function normalizeTime(value: string) {
  return value.slice(0, 5);
}

function toProfileDraft(profile: MentorProfile): ProfileDraft {
  return {
    max_mentores: String(profile.max_mentores),
    max_sessions_per_week: String(profile.max_sessions_per_week),
    default_session_duration: String(profile.default_session_duration) as ProfileDraft["default_session_duration"],
  };
}

function toDateLabel(value: string) {
  return new Intl.DateTimeFormat("fr-CA", {
    dateStyle: "medium",
  }).format(new Date(`${value}T12:00:00`));
}

export function MentorAvailabilityManager() {
  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [profileDraft, setProfileDraft] = useState<ProfileDraft>({
    max_mentores: "5",
    max_sessions_per_week: "3",
    default_session_duration: "60",
  });
  const [availabilities, setAvailabilities] = useState<MentorAvailability[]>([]);
  const [exceptions, setExceptions] = useState<MentorAvailabilityException[]>([]);
  const [availabilityDraft, setAvailabilityDraft] = useState<AvailabilityDraft>({
    weekday: "0",
    start_time: "18:00",
    end_time: "21:00",
    is_active: true,
  });
  const [exceptionDraft, setExceptionDraft] = useState<ExceptionDraft>({
    start_date: "",
    end_date: "",
    reason: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isAddingAvailability, setIsAddingAvailability] = useState(false);
  const [isAddingException, setIsAddingException] = useState(false);
  const [status, setStatus] = useState<FormStatus>({ type: "idle", message: "" });

  useEffect(() => {
    let isMounted = true;
    Promise.all([getMentorProfile(), getMentorAvailability(), getMentorAvailabilityExceptions()])
      .then(([profileData, availabilityData, exceptionData]) => {
        if (!isMounted) {
          return;
        }
        setProfile(profileData);
        setProfileDraft(toProfileDraft(profileData));
        setAvailabilities(availabilityData);
        setExceptions(exceptionData);
      })
      .catch((error) => {
        if (isMounted) {
          setStatus({ type: "error", message: formatApiError(error) });
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const availabilitiesByDay = useMemo(() => {
    return weekdays.map((weekday) => ({
      ...weekday,
      items: availabilities.filter((availability) => availability.weekday === weekday.value),
    }));
  }, [availabilities]);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingProfile(true);
    setStatus({ type: "idle", message: "" });

    try {
      const updated = await updateMentorProfile({
        max_mentores: Number(profileDraft.max_mentores),
        max_sessions_per_week: Number(profileDraft.max_sessions_per_week),
        default_session_duration: Number(profileDraft.default_session_duration) as MentorProfile["default_session_duration"],
      });
      setProfile(updated);
      setProfileDraft(toProfileDraft(updated));
      setStatus({ type: "success", message: "Capacite et duree de seance mises a jour." });
    } catch (error) {
      setStatus({ type: "error", message: formatApiError(error) });
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleAvailabilitySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsAddingAvailability(true);
    setStatus({ type: "idle", message: "" });

    try {
      const created = await createMentorAvailability({
        weekday: Number(availabilityDraft.weekday),
        start_time: availabilityDraft.start_time,
        end_time: availabilityDraft.end_time,
        is_active: availabilityDraft.is_active,
      });
      setAvailabilities((current) => [...current, created].sort((a, b) => a.weekday - b.weekday));
      setStatus({ type: "success", message: "Plage horaire ajoutee." });
    } catch (error) {
      setStatus({ type: "error", message: formatApiError(error) });
    } finally {
      setIsAddingAvailability(false);
    }
  }

  async function toggleAvailability(availability: MentorAvailability) {
    setStatus({ type: "idle", message: "" });
    try {
      const updated = await updateMentorAvailability(availability.id, {
        weekday: availability.weekday,
        start_time: normalizeTime(availability.start_time),
        end_time: normalizeTime(availability.end_time),
        is_active: !availability.is_active,
      });
      setAvailabilities((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (error) {
      setStatus({ type: "error", message: formatApiError(error) });
    }
  }

  async function removeAvailability(id: number) {
    setStatus({ type: "idle", message: "" });
    try {
      await deleteMentorAvailability(id);
      setAvailabilities((current) => current.filter((availability) => availability.id !== id));
      setStatus({ type: "success", message: "Plage horaire supprimee." });
    } catch (error) {
      setStatus({ type: "error", message: formatApiError(error) });
    }
  }

  async function handleExceptionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsAddingException(true);
    setStatus({ type: "idle", message: "" });

    try {
      const created = await createMentorAvailabilityException(exceptionDraft);
      setExceptions((current) => [created, ...current]);
      setExceptionDraft({ start_date: "", end_date: "", reason: "" });
      setStatus({ type: "success", message: "Exception ajoutee." });
    } catch (error) {
      setStatus({ type: "error", message: formatApiError(error) });
    } finally {
      setIsAddingException(false);
    }
  }

  async function removeException(id: number) {
    setStatus({ type: "idle", message: "" });
    try {
      await deleteMentorAvailabilityException(id);
      setExceptions((current) => current.filter((exception) => exception.id !== id));
      setStatus({ type: "success", message: "Exception supprimee." });
    } catch (error) {
      setStatus({ type: "error", message: formatApiError(error) });
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-4">
        <div className="h-32 rounded-xl border border-border bg-muted/60" />
        <div className="h-64 rounded-xl border border-border bg-muted/60" />
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {status.message ? (
        <Alert variant={status.type === "success" ? "success" : "error"}>{status.message}</Alert>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <Settings2 className="mt-1 size-5 text-primary" aria-hidden="true" />
            <div>
              <CardTitle>Capacite du mentor</CardTitle>
              <CardDescription>
                Ces limites controlent le nombre de mentorés et de seances reservables par semaine.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
            <label>
              Mentorés maximum
              <Input
                type="number"
                min={1}
                value={profileDraft.max_mentores}
                onChange={(event) => setProfileDraft((current) => ({ ...current, max_mentores: event.target.value }))}
              />
            </label>
            <label>
              Seances par semaine
              <Input
                type="number"
                min={1}
                value={profileDraft.max_sessions_per_week}
                onChange={(event) =>
                  setProfileDraft((current) => ({ ...current, max_sessions_per_week: event.target.value }))
                }
              />
            </label>
            <label>
              Duree par defaut
              <select
                className="field"
                value={profileDraft.default_session_duration}
                onChange={(event) =>
                  setProfileDraft((current) => ({
                    ...current,
                    default_session_duration: event.target.value as ProfileDraft["default_session_duration"],
                  }))
                }
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
              </select>
            </label>
            <Button type="submit" disabled={isSavingProfile}>
              <Save aria-hidden="true" />
              {isSavingProfile ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </form>
          {profile ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Configuration active: {profile.max_mentores} mentorés, {profile.max_sessions_per_week} seances par
              semaine, {profile.default_session_duration} minutes par seance.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <CalendarClock className="mt-1 size-5 text-primary" aria-hidden="true" />
            <div>
              <CardTitle>Disponibilites hebdomadaires</CardTitle>
              <CardDescription>
                Ajoutez les plages habituelles. Le systeme genere ensuite les creneaux reservables automatiquement.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5">
          <form onSubmit={handleAvailabilitySubmit} className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_auto_auto] lg:items-end">
            <label>
              Jour
              <select
                className="field"
                value={availabilityDraft.weekday}
                onChange={(event) => setAvailabilityDraft((current) => ({ ...current, weekday: event.target.value }))}
              >
                {weekdays.map((weekday) => (
                  <option key={weekday.value} value={weekday.value}>
                    {weekday.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Debut
              <Input
                type="time"
                value={availabilityDraft.start_time}
                onChange={(event) => setAvailabilityDraft((current) => ({ ...current, start_time: event.target.value }))}
              />
            </label>
            <label>
              Fin
              <Input
                type="time"
                value={availabilityDraft.end_time}
                onChange={(event) => setAvailabilityDraft((current) => ({ ...current, end_time: event.target.value }))}
              />
            </label>
            <label className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={availabilityDraft.is_active}
                onChange={(event) =>
                  setAvailabilityDraft((current) => ({ ...current, is_active: event.target.checked }))
                }
              />
              Active
            </label>
            <Button type="submit" disabled={isAddingAvailability}>
              <Plus aria-hidden="true" />
              {isAddingAvailability ? "Ajout..." : "Ajouter"}
            </Button>
          </form>

          <div className="grid gap-3">
            {availabilitiesByDay.map((day) => (
              <section key={day.value} className="rounded-xl border border-border bg-muted/35 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">{day.label}</h3>
                  <span className="rounded-full bg-card px-3 py-1 text-xs text-muted-foreground">
                    {day.items.length} plage{day.items.length > 1 ? "s" : ""}
                  </span>
                </div>
                {day.items.length > 0 ? (
                  <div className="grid gap-2">
                    {day.items.map((availability) => (
                      <div
                        key={availability.id}
                        className="grid gap-3 rounded-lg border border-border bg-card p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                      >
                        <div>
                          <p className="font-medium">
                            {normalizeTime(availability.start_time)} - {normalizeTime(availability.end_time)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {availability.is_active ? "Disponible pour reservation" : "Desactivee"}
                          </p>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => void toggleAvailability(availability)}>
                          {availability.is_active ? "Desactiver" : "Activer"}
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => void removeAvailability(availability.id)}>
                          <Trash2 aria-hidden="true" />
                          Supprimer
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune plage pour ce jour.</p>
                )}
              </section>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Exceptions et indisponibilites</CardTitle>
          <CardDescription>
            Bloquez des dates pour les vacances, examens, voyages ou indisponibilites temporaires.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          <form onSubmit={handleExceptionSubmit} className="grid gap-4 lg:grid-cols-[1fr_1fr_1.5fr_auto] lg:items-end">
            <label>
              Date de debut
              <Input
                type="date"
                required
                value={exceptionDraft.start_date}
                onChange={(event) => setExceptionDraft((current) => ({ ...current, start_date: event.target.value }))}
              />
            </label>
            <label>
              Date de fin
              <Input
                type="date"
                required
                value={exceptionDraft.end_date}
                onChange={(event) => setExceptionDraft((current) => ({ ...current, end_date: event.target.value }))}
              />
            </label>
            <label>
              Raison
              <Input
                value={exceptionDraft.reason}
                placeholder="Vacances, examens..."
                onChange={(event) => setExceptionDraft((current) => ({ ...current, reason: event.target.value }))}
              />
            </label>
            <Button type="submit" disabled={isAddingException}>
              <Plus aria-hidden="true" />
              {isAddingException ? "Ajout..." : "Ajouter"}
            </Button>
          </form>

          {exceptions.length > 0 ? (
            <div className="grid gap-2">
              {exceptions.map((exception) => (
                <div
                  key={exception.id}
                  className="grid gap-3 rounded-lg border border-border bg-card p-3 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <p className="font-medium">
                      {toDateLabel(exception.start_date)} - {toDateLabel(exception.end_date)}
                    </p>
                    <p className="text-sm text-muted-foreground">{exception.reason || "Aucune raison indiquee"}</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => void removeException(exception.id)}>
                    <Trash2 aria-hidden="true" />
                    Supprimer
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-border bg-muted/35 p-4 text-sm text-muted-foreground">
              Aucune exception enregistree.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
