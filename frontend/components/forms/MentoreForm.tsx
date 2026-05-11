"use client";

import { FormEvent, useEffect, useState } from "react";

import {
  MentorDisponible,
  MentorshipPeriod,
  NiveauAcademique,
  createMentoreInscription,
  formatApiError,
  getAvailableMentorshipPeriods,
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

export function MentoreForm() {
  const [niveaux, setNiveaux] = useState<NiveauAcademique[]>([]);
  const [periods, setPeriods] = useState<MentorshipPeriod[]>([]);
  const [mentors, setMentors] = useState<MentorDisponible[]>([]);
  const [periodId, setPeriodId] = useState("");
  const [niveauId, setNiveauId] = useState("");
  const [selectedMentorId, setSelectedMentorId] = useState("");
  const [isLoadingMentors, setIsLoadingMentors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<FormStatus>({ type: "idle", message: "" });

  useEffect(() => {
    let isMounted = true;
    Promise.all([getNiveaux(), getAvailableMentorshipPeriods()])
      .then(([niveauxAcademiques, mentorshipPeriods]) => {
        if (isMounted) {
          setNiveaux(niveauxAcademiques);
          setPeriods(mentorshipPeriods);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setStatus({ type: "error", message: `Donnees d'inscription indisponibles: ${formatApiError(error)}` });
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  async function loadMentors(selectedNiveauId: string, selectedPeriodId: string) {
    if (!selectedNiveauId || !selectedPeriodId) {
      return;
    }

    setIsLoadingMentors(true);
    try {
      const mentorsDisponibles = await getMentorsDisponibles(Number(selectedNiveauId), selectedPeriodId);
      setMentors(mentorsDisponibles);
    } catch (error) {
      setStatus({ type: "error", message: `Mentors indisponibles: ${formatApiError(error)}` });
    } finally {
      setIsLoadingMentors(false);
    }
  }

  async function handlePeriodChange(selectedPeriodId: string) {
    setPeriodId(selectedPeriodId);
    setSelectedMentorId("");
    setMentors([]);
    await loadMentors(niveauId, selectedPeriodId);
  }

  async function handleNiveauChange(selectedNiveauId: string) {
    setNiveauId(selectedNiveauId);
    setSelectedMentorId("");
    setMentors([]);
    await loadMentors(selectedNiveauId, periodId);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "idle", message: "" });

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const mentorChoisi = textValue(formData, "mentor_choisi");
    const payload = {
      nom: textValue(formData, "nom"),
      prenom: textValue(formData, "prenom"),
      email: textValue(formData, "email"),
      telephone: textValue(formData, "telephone"),
      langue_preferee: textValue(formData, "langue_preferee"),
      region: textValue(formData, "region"),
      niveau_academique: Number(textValue(formData, "niveau_academique")),
      mentorship_period: Number(textValue(formData, "mentorship_period")),
      objectifs: textValue(formData, "objectifs"),
      mentor_choisi: mentorChoisi ? Number(mentorChoisi) : null,
      consentement: formData.get("consentement") === "on",
    };

    try {
      await createMentoreInscription(payload);
      formElement.reset();
      setPeriodId("");
      setNiveauId("");
      setSelectedMentorId("");
      setMentors([]);
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
        Periode de mentorat
        <select
          name="mentorship_period"
          required
          className="field"
          value={periodId}
          onChange={(event) => void handlePeriodChange(event.target.value)}
        >
          <option value="" disabled>
            Choisir une periode
          </option>
          {periods.map((period) => (
            <option key={period.id} value={period.id}>
              {period.title}
            </option>
          ))}
        </select>
      </label>
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
          disabled={!periodId || !niveauId || mentors.length === 0}
          value={selectedMentorId}
          onChange={(event) => setSelectedMentorId(event.target.value)}
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
