"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { CalendarDays, Edit3, Power, RefreshCcw, Trash2 } from "lucide-react";

import {
  Evenement,
  createEvenement,
  deleteEvenement,
  formatApiError,
  getEvenements,
  updateEvenement,
} from "@/lib/api";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

const eventTypes = [
  { value: "ATELIER", label: "Atelier" },
  { value: "CONFERENCE", label: "Conference" },
  { value: "RESEAUTAGE", label: "Reseautage" },
  { value: "AUTRE", label: "Autre" },
];

const eventStatuses = [
  { value: "PLANIFIE", label: "Planifie" },
  { value: "ANNULE", label: "Annule" },
  { value: "TERMINE", label: "Termine" },
];

type EventFormState = Omit<Evenement, "id">;

const emptyForm: EventFormState = {
  titre: "",
  description: "",
  date_evenement: "",
  heure_evenement: "",
  lieu: "",
  image: null,
  video: null,
  type_evenement: "ATELIER",
  statut_evenement: "PLANIFIE",
};

function formFromEvent(evenement: Evenement): EventFormState {
  return {
    titre: evenement.titre,
    description: evenement.description ?? "",
    date_evenement: evenement.date_evenement,
    heure_evenement: evenement.heure_evenement?.slice(0, 5) ?? "",
    lieu: evenement.lieu ?? "",
    image: evenement.image,
    video: evenement.video,
    type_evenement: evenement.type_evenement,
    statut_evenement: evenement.statut_evenement,
  };
}

function formatDateTime(evenement: Evenement) {
  return `${evenement.date_evenement} a ${evenement.heure_evenement?.slice(0, 5) ?? ""}`;
}

export function AdminEvenements() {
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [form, setForm] = useState<EventFormState>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    getEvenements()
      .then((rows) => {
        if (isMounted) {
          setEvenements(rows);
          setError("");
        }
      })
      .catch((apiError) => {
        if (isMounted) {
          setError(formatApiError(apiError));
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

  function updateForm(field: keyof EventFormState, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setImageFile(null);
    setVideoFile(null);
    setEditingId(null);
  }

  function buildFormData() {
    const formData = new FormData();
    formData.append("titre", form.titre);
    formData.append("description", form.description);
    formData.append("date_evenement", form.date_evenement);
    formData.append("heure_evenement", form.heure_evenement);
    formData.append("lieu", form.lieu);
    formData.append("type_evenement", form.type_evenement);
    formData.append("statut_evenement", form.statut_evenement);
    if (imageFile) {
      formData.append("image", imageFile);
    }
    if (videoFile) {
      formData.append("video", videoFile);
    }
    return formData;
  }

  function sortEvents(rows: Evenement[]) {
    return [...rows].sort((a, b) => {
      const dateComparison = a.date_evenement.localeCompare(b.date_evenement);
      if (dateComparison !== 0) {
        return dateComparison;
      }
      return a.heure_evenement.localeCompare(b.heure_evenement);
    });
  }

  async function reloadEvenements() {
    const rows = await getEvenements();
    setEvenements(rows);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSaving(true);

    try {
      const payload = buildFormData();
      if (editingId) {
        const updated = await updateEvenement(editingId, payload);
        setEvenements((currentRows) =>
          sortEvents(currentRows.map((currentEvent) => (currentEvent.id === updated.id ? updated : currentEvent))),
        );
        setMessage("Evenement modifie.");
      } else {
        const created = await createEvenement(payload);
        setEvenements((currentRows) => sortEvents([...currentRows, created]));
        setMessage("Evenement cree.");
      }
      resetForm();
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatus(evenement: Evenement, statut: string) {
    setActionId(evenement.id);
    setError("");
    setMessage("");

    try {
      const updated = await updateEvenement(evenement.id, { statut_evenement: statut });
      setEvenements((currentRows) =>
        currentRows.map((currentEvent) => (currentEvent.id === updated.id ? updated : currentEvent)),
      );
      setMessage("Statut de l'evenement mis a jour.");
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(evenement: Evenement) {
    const confirmed = window.confirm(`Supprimer ${evenement.titre} ?`);
    if (!confirmed) {
      return;
    }

    setActionId(evenement.id);
    setError("");
    setMessage("");

    try {
      await deleteEvenement(evenement.id);
      setEvenements((currentRows) => currentRows.filter((currentEvent) => currentEvent.id !== evenement.id));
      if (editingId === evenement.id) {
        resetForm();
      }
      setMessage("Evenement supprime.");
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setActionId(null);
    }
  }

  function startEdit(evenement: Evenement) {
    setEditingId(evenement.id);
    setForm(formFromEvent(evenement));
    setImageFile(null);
    setVideoFile(null);
    setMessage("");
    setError("");
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Gestion evenements</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Creez, modifiez, annulez, terminez ou supprimez les evenements du programme.
        </p>
      </div>

      {message ? <Alert variant="success">{message}</Alert> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}

      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2 border-b border-border pb-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold">
                  {editingId ? "Modifier l'evenement" : "Ajouter un evenement"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Les informations servent au suivi administratif des evenements.
                </p>
              </div>
              {editingId ? (
                <Button type="button" onClick={resetForm} variant="outline">
                  Annuler
                </Button>
              ) : null}
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label>
                Titre
                <input
                  className="field"
                  required
                  value={form.titre}
                  onChange={(event) => updateForm("titre", event.target.value)}
                />
              </label>

              <label>
                Lieu
                <input
                  className="field"
                  value={form.lieu}
                  onChange={(event) => updateForm("lieu", event.target.value)}
                />
              </label>

              <label>
                Date
                <input
                  className="field"
                  type="date"
                  required
                  value={form.date_evenement}
                  onChange={(event) => updateForm("date_evenement", event.target.value)}
                />
              </label>

              <label>
                Heure
                <input
                  className="field"
                  type="time"
                  required
                  value={form.heure_evenement}
                  onChange={(event) => updateForm("heure_evenement", event.target.value)}
                />
              </label>

              <label>
                Type
                <select
                  className="field"
                  value={form.type_evenement}
                  onChange={(event) => updateForm("type_evenement", event.target.value)}
                >
                  {eventTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Statut
                <select
                  className="field"
                  value={form.statut_evenement}
                  onChange={(event) => updateForm("statut_evenement", event.target.value)}
                >
                  {eventStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Image
                <input
                  className="field"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                />
              </label>

              <label>
                Video
                <input
                  className="field"
                  type="file"
                  accept="video/*"
                  onChange={(event) => setVideoFile(event.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            {editingId && (form.image || form.video) ? (
              <div className="mt-4 rounded-xl border border-border bg-muted p-4 text-sm text-muted-foreground">
                {form.image ? <p>Image actuelle conservee si aucune nouvelle image n&apos;est choisie.</p> : null}
                {form.video ? <p>Video actuelle conservee si aucune nouvelle video n&apos;est choisie.</p> : null}
              </div>
            ) : null}

            <label className="mt-4">
              Description
              <textarea
                className="field"
                rows={4}
                value={form.description}
                onChange={(event) => updateForm("description", event.target.value)}
              />
            </label>

            <Button type="submit" disabled={isSaving} className="mt-4">
              {isSaving ? "Enregistrement..." : editingId ? "Enregistrer les modifications" : "Creer l'evenement"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-border bg-muted px-4 py-3 text-sm font-medium">
          {evenements.length} evenement{evenements.length > 1 ? "s" : ""}
        </div>

        {isLoading ? <div className="p-4"><Skeleton className="h-48" /></div> : null}

        {!isLoading && evenements.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={CalendarDays} title="Aucun evenement pour le moment." />
          </div>
        ) : null}

        {!isLoading && evenements.length > 0 ? (
          <div className="divide-y divide-border">
            {evenements.map((evenement) => (
              <article key={evenement.id} className="grid gap-4 px-4 py-4 lg:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-foreground">{evenement.titre}</h2>
                    <Badge variant={evenement.statut_evenement === "PLANIFIE" ? "success" : "outline"}>
                      {evenement.statut_evenement}
                    </Badge>
                    <Badge variant="bronze">{evenement.type_evenement}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{formatDateTime(evenement)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{evenement.lieu || "Lieu non renseigne"}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {evenement.description || "Aucune description."}
                  </p>
                  {evenement.image ? (
                    <div className="relative mt-4 aspect-video w-full max-w-xl overflow-hidden rounded-xl border border-border">
                      <Image
                        src={evenement.image}
                        alt={`Image de ${evenement.titre}`}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 640px"
                        className="object-cover"
                      />
                    </div>
                  ) : null}
                  {evenement.video ? (
                    <video
                      src={evenement.video}
                      controls
                      className="mt-4 aspect-video w-full max-w-xl rounded-xl border border-border bg-black"
                    />
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Button
                    type="button"
                    onClick={() => startEdit(evenement)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit3 aria-hidden="true" />
                    Modifier
                  </Button>
                  <Button
                    type="button"
                    disabled={actionId === evenement.id}
                    onClick={() => void handleStatus(evenement, "PLANIFIE")}
                    variant="outline"
                    size="sm"
                  >
                    <Power aria-hidden="true" />
                    Planifier
                  </Button>
                  <Button
                    type="button"
                    disabled={actionId === evenement.id}
                    onClick={() => void handleStatus(evenement, "TERMINE")}
                    variant="outline"
                    size="sm"
                  >
                    Terminer
                  </Button>
                  <Button
                    type="button"
                    disabled={actionId === evenement.id}
                    onClick={() => void handleStatus(evenement, "ANNULE")}
                    variant="outline"
                    size="sm"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="button"
                    disabled={actionId === evenement.id}
                    onClick={() => void handleDelete(evenement)}
                    variant="danger"
                    size="sm"
                  >
                    <Trash2 aria-hidden="true" />
                    Supprimer
                  </Button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </Card>

      <Button type="button" onClick={() => void reloadEvenements()} variant="outline" className="w-fit">
        <RefreshCcw aria-hidden="true" />
        Rafraichir
      </Button>
    </div>
  );
}
