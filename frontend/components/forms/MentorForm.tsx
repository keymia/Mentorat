"use client";

import { FormEvent, useEffect, useState } from "react";

import {
  NiveauAcademique,
  createMentorInscription,
  formatApiError,
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

export function MentorForm() {
  const [niveaux, setNiveaux] = useState<NiveauAcademique[]>([]);
  const [status, setStatus] = useState<FormStatus>({ type: "idle", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus({ type: "idle", message: "" });

    const formData = new FormData(event.currentTarget);
    const payload = {
      nom: textValue(formData, "nom"),
      prenom: textValue(formData, "prenom"),
      email: textValue(formData, "email"),
      telephone: textValue(formData, "telephone"),
      langue_preferee: textValue(formData, "langue_preferee"),
      region: textValue(formData, "region"),
      niveau_academique: Number(textValue(formData, "niveau_academique")),
      disponibilite: textValue(formData, "disponibilite"),
      objectifs: textValue(formData, "objectifs"),
      capacite_mentorat: Number(textValue(formData, "capacite_mentorat")),
      consentement: formData.get("consentement") === "on",
    };

    try {
      await createMentorInscription(payload);
      event.currentTarget.reset();
      setStatus({
        type: "success",
        message: "Votre inscription mentor a ete envoyee et sera validee par l'administration.",
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
          Capacite de mentorat
          <input name="capacite_mentorat" type="number" min={1} required className="field" />
        </label>
      </div>
      <label>
        Disponibilite
        <textarea name="disponibilite" rows={4} className="field" />
      </label>
      <label>
        Objectifs
        <textarea name="objectifs" rows={4} className="field" />
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
