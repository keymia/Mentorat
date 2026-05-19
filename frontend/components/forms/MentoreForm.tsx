"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  MentorDisponible,
  MentorshipPeriod,
  NiveauAcademique,
  createMentoreInscription,
  formatApiError,
  getAvailableMentorshipPeriods,
  getPublicAvailableMentors,
  getNiveaux,
  mentoreeAcademicLevelOrders,
} from "@/lib/api";
import { CANADIAN_PROVINCES } from "@/lib/canadianProvinces";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PhoneInput } from "@/components/forms/PhoneInput";

type FormStatus = {
  type: "idle" | "success" | "error";
  message: string;
};

function textValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

const associationMentorOption = "ASSOCIATION";

export function MentoreForm() {
  const router = useRouter();
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [niveaux, setNiveaux] = useState<NiveauAcademique[]>([]);
  const [periods, setPeriods] = useState<MentorshipPeriod[]>([]);
  const [mentors, setMentors] = useState<MentorDisponible[]>([]);
  const [periodId, setPeriodId] = useState("");
  const [niveauId, setNiveauId] = useState("");
  const [selectedMentorId, setSelectedMentorId] = useState(associationMentorOption);
  const [isLoadingMentors, setIsLoadingMentors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<FormStatus>({ type: "idle", message: "" });

  useEffect(() => {
    let isMounted = true;
    Promise.all([getNiveaux(), getAvailableMentorshipPeriods()])
      .then(([niveauxAcademiques, mentorshipPeriods]) => {
        if (isMounted) {
          setNiveaux(niveauxAcademiques.filter((niveau) => mentoreeAcademicLevelOrders.includes(niveau.ordre_niveau)));
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

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  async function loadMentors(selectedNiveauId: string, selectedPeriodId: string) {
    if (!selectedNiveauId || !selectedPeriodId) {
      setSelectedMentorId(associationMentorOption);
      setMentors([]);
      return;
    }

    setIsLoadingMentors(true);
    try {
      const mentorsDisponibles = await getPublicAvailableMentors(Number(selectedNiveauId), selectedPeriodId);
      setMentors(mentorsDisponibles);
      setSelectedMentorId(associationMentorOption);
    } catch (error) {
      setStatus({ type: "error", message: `Mentors indisponibles: ${formatApiError(error)}` });
    } finally {
      setIsLoadingMentors(false);
    }
  }

  async function handlePeriodChange(selectedPeriodId: string) {
    setPeriodId(selectedPeriodId);
    setSelectedMentorId(associationMentorOption);
    setMentors([]);
    await loadMentors(niveauId, selectedPeriodId);
  }

  async function handleNiveauChange(selectedNiveauId: string) {
    setNiveauId(selectedNiveauId);
    setSelectedMentorId(associationMentorOption);
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
    const wantsAssociationAssignment = mentorChoisi === associationMentorOption || mentors.length === 0;
    const payload = {
      nom: textValue(formData, "nom"),
      prenom: textValue(formData, "prenom"),
      email: textValue(formData, "email"),
      telephone: textValue(formData, "telephone"),
      langue_preferee: textValue(formData, "langue_preferee"),
      region: textValue(formData, "region"),
      niveau_academique: Number(textValue(formData, "niveau_academique")),
      mentorship_period: Number(textValue(formData, "mentorship_period")),
      mentor_choisi: wantsAssociationAssignment ? null : Number(mentorChoisi),
      wants_association_assignment: wantsAssociationAssignment,
      consentement: formData.get("consentement") === "on",
    };

    try {
      await createMentoreInscription(payload);
      formElement.reset();
      setPeriodId("");
      setNiveauId("");
      setSelectedMentorId(associationMentorOption);
      setMentors([]);
      setStatus({
        type: "success",
        message: !wantsAssociationAssignment
          ? "Inscription mentoré réussie. Votre demande est enregistrée et votre mentor a été associé. Redirection dans 2 secondes..."
          : "Inscription mentoré réussie. Votre demande est enregistrée; l’association vous assignera un mentor. Redirection dans 2 secondes...",
      });
      redirectTimerRef.current = setTimeout(() => {
        router.push("/inscriptions");
      }, 2000);
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
          <input name="prenom" className="field" />
        </label>
        <label>
          Email
          <input name="email" type="email" required className="field" />
        </label>
        <label>
          Telephone
          <PhoneInput name="telephone" className="field" />
        </label>
        <label>
          Langue preferee
          <select name="langue_preferee" className="field" defaultValue="FR">
            <option value="FR">Francais</option>
            <option value="EN">Anglais</option>
          </select>
        </label>
        <label>
          Province
          <select name="region" className="field" defaultValue="">
            <option value="">Sélectionnez une province</option>
            {CANADIAN_PROVINCES.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
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
        Niveau académique
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
          className="field"
          disabled={!periodId || !niveauId || isLoadingMentors}
          value={selectedMentorId}
          onChange={(event) => setSelectedMentorId(event.target.value)}
        >
          <option value={associationMentorOption}>
            {isLoadingMentors ? "Chargement..." : "Laisser l'association choisir mon mentor"}
          </option>
          {mentors.map((mentor) => (
            <option key={mentor.id} value={mentor.id}>
              {mentor.prenom} {mentor.nom} - {mentor.niveau_academique_nom} ({mentor.capacite_restante} place
              {mentor.capacite_restante > 1 ? "s" : ""})
            </option>
          ))}
        </select>
      </label>
      {periodId && niveauId && !isLoadingMentors && mentors.length === 0 ? (
        <Alert variant="warning">
          Aucun mentor compatible n&apos;est disponible actuellement. L&apos;association choisira un mentor et le dossier apparaitra dans Jumelage.
        </Alert>
      ) : null}
      <label className="flex items-start gap-3 text-sm text-muted-foreground">
        <input name="consentement" type="checkbox" required className="mt-1" />
        <span>Je consens au traitement de mes informations pour le programme Mentorat.</span>
      </label>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-fit"
      >
        {isSubmitting ? "Envoi..." : "Soumettre l’inscription mentoré"}
      </Button>
      {status.message ? (
        <Alert variant={status.type === "success" ? "success" : "error"}>{status.message}</Alert>
      ) : null}
    </form>
  );
}
