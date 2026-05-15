"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  MentorshipPeriod,
  NiveauAcademique,
  createMentorInscription,
  formatApiError,
  getAvailableMentorshipPeriods,
  getNiveaux,
  mentorAcademicLevelOrders,
} from "@/lib/api";
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

export function MentorForm() {
  const router = useRouter();
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [niveaux, setNiveaux] = useState<NiveauAcademique[]>([]);
  const [periods, setPeriods] = useState<MentorshipPeriod[]>([]);
  const [status, setStatus] = useState<FormStatus>({ type: "idle", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    Promise.all([getNiveaux(), getAvailableMentorshipPeriods()])
      .then(([niveauxAcademiques, mentorshipPeriods]) => {
        if (isMounted) {
          setNiveaux(niveauxAcademiques.filter((niveau) => mentorAcademicLevelOrders.includes(niveau.ordre_niveau)));
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "idle", message: "" });

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);

    const payload = {
      nom: textValue(formData, "nom"),
      prenom: textValue(formData, "prenom"),
      email: textValue(formData, "email"),
      telephone: textValue(formData, "telephone"),
      langue_preferee: textValue(formData, "langue_preferee"),
      region: textValue(formData, "region"),
      niveau_academique: Number(textValue(formData, "niveau_academique")),
      mentorship_period: Number(textValue(formData, "mentorship_period")),
      mini_bio: textValue(formData, "mini_bio"),
      consentement: formData.get("consentement") === "on",
    };

    try {
      await createMentorInscription(payload);
      formElement.reset();
      setStatus({
        type: "success",
        message:
          "Inscription mentor reussie. Votre demande a ete enregistree et sera traitee selon le processus prevu. Redirection dans 2 secondes...",
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
          <input name="prenom" required className="field" />
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
          Region
          <input name="region" className="field" />
        </label>
        <label>
          Niveau academique
          <select name="niveau_academique" required className="field" defaultValue="">
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
          Periode de mentorat
          <select name="mentorship_period" required className="field" defaultValue="">
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
      </div>
      <label>
        Mini bio
        <textarea
          name="mini_bio"
          rows={5}
          className="field"
          placeholder="Neter Elysabeth, etudiante en 3e annee du baccalaureat en sciences de la sante a l'Universite d'Ottawa et presidente de l'Association des jeunes scientifiques d'Ottawa, se distingue par son engagement a faire rayonner la releve scientifique francophone."
        />
        <span className="mt-2 block text-xs leading-5 text-muted-foreground">
          Presentez brievement votre parcours, votre niveau d&apos;etude, votre domaine, votre engagement et votre motivation.
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm text-muted-foreground">
        <input name="consentement" type="checkbox" required className="mt-1" />
        <span>Je consens au traitement de mes informations pour le programme Mentorat.</span>
      </label>
      <Button type="submit" disabled={isSubmitting} className="w-fit">
        {isSubmitting ? "Envoi..." : "Soumettre l'inscription mentor"}
      </Button>
      {status.message ? (
        <Alert variant={status.type === "success" ? "success" : "error"}>{status.message}</Alert>
      ) : null}
    </form>
  );
}
