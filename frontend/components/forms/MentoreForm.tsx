"use client";

import { FormEvent, useEffect, useState } from "react";

import {
  AvailableSlot,
  MentorDisponible,
  NiveauAcademique,
  createMentoreInscription,
  formatApiError,
  getAvailableSlots,
  getMentorsDisponibles,
  getNiveaux,
} from "@/lib/api";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type FormStatus = {
  type: "idle" | "success" | "error";
  message: string;
};

function textValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function toDateInput(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

export function MentoreForm() {
  const [niveaux, setNiveaux] = useState<NiveauAcademique[]>([]);
  const [mentors, setMentors] = useState<MentorDisponible[]>([]);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [niveauId, setNiveauId] = useState("");
  const [selectedMentorId, setSelectedMentorId] = useState("");
  const [isLoadingMentors, setIsLoadingMentors] = useState(false);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<FormStatus>({ type: "idle", message: "" });

  useEffect(() => {
    let isMounted = true;
    getNiveaux()
      .then((niveauxAcademiques) => {
        if (isMounted) {
          setNiveaux(niveauxAcademiques);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setStatus({ type: "error", message: `Niveaux indisponibles: ${formatApiError(error)}` });
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  async function handleNiveauChange(selectedNiveauId: string) {
    setNiveauId(selectedNiveauId);
    setSelectedMentorId("");
    setMentors([]);
    setSlots([]);
    if (!selectedNiveauId) {
      return;
    }

    setIsLoadingMentors(true);
    try {
      const mentorsDisponibles = await getMentorsDisponibles(Number(selectedNiveauId));
      setMentors(mentorsDisponibles);
    } catch (error) {
      setStatus({ type: "error", message: `Mentors indisponibles: ${formatApiError(error)}` });
    } finally {
      setIsLoadingMentors(false);
    }
  }

  async function handleMentorChange(selectedMentor: string) {
    setSelectedMentorId(selectedMentor);
    setSlots([]);
    if (!selectedMentor) {
      return;
    }

    setIsLoadingSlots(true);
    try {
      const availableSlots = await getAvailableSlots(Number(selectedMentor), toDateInput(), toDateInput(14), false);
      setSlots(availableSlots);
    } catch (error) {
      setStatus({ type: "error", message: `Creneaux indisponibles: ${formatApiError(error)}` });
    } finally {
      setIsLoadingSlots(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "idle", message: "" });

    const formData = new FormData(event.currentTarget);
    const mentorChoisi = textValue(formData, "mentor_choisi");
    const payload = {
      nom: textValue(formData, "nom"),
      prenom: textValue(formData, "prenom"),
      email: textValue(formData, "email"),
      telephone: textValue(formData, "telephone"),
      langue_preferee: textValue(formData, "langue_preferee"),
      region: textValue(formData, "region"),
      niveau_academique: Number(textValue(formData, "niveau_academique")),
      objectifs: textValue(formData, "objectifs"),
      mentor_choisi: mentorChoisi ? Number(mentorChoisi) : null,
      consentement: formData.get("consentement") === "on",
    };

    try {
      await createMentoreInscription(payload);
      event.currentTarget.reset();
      setNiveauId("");
      setSelectedMentorId("");
      setMentors([]);
      setSlots([]);
      setStatus({
        type: "success",
        message: "Votre inscription mentore a ete envoyee et sera validee par l'administration.",
      });
    } catch (error) {
      setStatus({ type: "error", message: formatApiError(error) });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label>
          Nom
          <input name="nom" required className="field" />
        </label>
        <label>
          Prenom
          <input name="prenom" required className="field" />
        </label>
        <label>
          Email
          <input name="email" type="email" required className="field" />
        </label>
        <label>
          Telephone
          <input name="telephone" className="field" />
        </label>
        <label>
          Langue preferee
          <select name="langue_preferee" className="field" defaultValue="FR">
            <option value="FR">Francais</option>
            <option value="EN">Anglais</option>
          </select>
        </label>
        <label>
          Region
          <input name="region" className="field" />
        </label>
      </div>
      <label>
        Niveau academique
        <select
          name="niveau_academique"
          required
          className="field"
          value={niveauId}
          onChange={(event) => void handleNiveauChange(event.target.value)}
        >
          <option value="" disabled>
            Choisir un niveau
          </option>
          {niveaux.map((niveau) => (
            <option key={niveau.id} value={niveau.id}>
              {niveau.nom}
            </option>
          ))}
        </select>
      </label>
      <label>
        Mentor choisi
        <select
          name="mentor_choisi"
          required
          className="field"
          disabled={!niveauId || mentors.length === 0}
          value={selectedMentorId}
          onChange={(event) => void handleMentorChange(event.target.value)}
        >
          <option value="">
            {isLoadingMentors ? "Chargement..." : "Choisir un mentor disponible"}
          </option>
          {mentors.map((mentor) => (
            <option key={mentor.id} value={mentor.id}>
              {mentor.prenom} {mentor.nom} - {mentor.niveau_academique_nom} ({mentor.capacite_restante} place
              {mentor.capacite_restante > 1 ? "s" : ""})
            </option>
          ))}
        </select>
      </label>
      {niveauId && !isLoadingMentors && mentors.length === 0 ? (
        <Alert variant="warning">Aucun mentor disponible pour ce niveau actuellement.</Alert>
      ) : null}
      {selectedMentorId ? (
        <div className="rounded-xl border border-border bg-muted/35 p-4">
          <p className="text-sm font-semibold text-foreground">Creneaux disponibles sur les 14 prochains jours</p>
          {isLoadingSlots ? (
            <p className="mt-2 text-sm text-muted-foreground">Chargement des creneaux...</p>
          ) : slots.length > 0 ? (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {slots.slice(0, 6).map((slot) => (
                <div key={`${slot.starts_at}-${slot.ends_at}`} className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
                  {formatSlot(slot.starts_at, slot.ends_at)}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Aucun creneau disponible pour ce mentor actuellement.</p>
          )}
        </div>
      ) : null}
      <label>
        Objectifs
        <textarea name="objectifs" rows={4} className="field" />
      </label>
      <label className="flex items-start gap-3 text-sm text-muted-foreground">
        <input name="consentement" type="checkbox" required className="mt-1" />
        <span>Je consens au traitement de mes informations pour le programme Mentorat.</span>
      </label>
      <Button
        type="submit"
        disabled={isSubmitting || Boolean(niveauId && !isLoadingMentors && mentors.length === 0)}
        className="w-fit"
      >
        {isSubmitting ? "Envoi..." : "Soumettre l'inscription mentore"}
      </Button>
      {status.message ? (
        <Alert variant={status.type === "success" ? "success" : "error"}>{status.message}</Alert>
      ) : null}
    </form>
  );
}
