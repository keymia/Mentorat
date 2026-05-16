"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { CalendarDays, CalendarPlus, Edit3, Eye, MapPin, RefreshCcw, Trash2 } from "lucide-react";

import {
  Evenement,
  createEvenement,
  deleteEvenement,
  formatApiError,
  getEvenements,
  updateEvenement,
} from "@/lib/api";
import { HelpIconButton } from "@/components/help/HelpIconButton";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ListTable } from "@/components/ui/list-table";
import { Modal } from "@/components/ui/modal";
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
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [detailsEvent, setDetailsEvent] = useState<Evenement | null>(null);

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
        setMessage("Evenement modifié.");
      } else {
        const created = await createEvenement(payload);
        setEvenements((currentRows) => sortEvents([...currentRows, created]));
        setMessage("Evenement créé.");
      }
      resetForm();
      setIsFormOpen(false);
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setIsSaving(false);
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
        setIsFormOpen(false);
      }
      setMessage("Evenement supprimé.");
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
    setIsFormOpen(true);
  }

  function startCreate() {
    resetForm();
    setMessage("");
    setError("");
    setIsFormOpen(true);
  }

  function closeFormModal() {
    resetForm();
    setIsFormOpen(false);
  }

  function renderEventForm() {
    return (
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
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
          <div className="mt-4 rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">
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

        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="submit" disabled={isSaving}>
            <CalendarPlus aria-hidden="true" />
            {isSaving ? "Enregistrement..." : editingId ? "Enregistrer les modifications" : "Créer l'evenement"}
          </Button>
          <Button type="button" variant="outline" onClick={closeFormModal}>
            Annuler
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-bold">Gestion evenements</h1>
            <HelpIconButton moduleKey="events" scope="admin" />
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Créez, modifiez, annulez, terminez ou supprimez les événements du programme.
          </p>
        </div>
        <Button type="button" className="w-fit" onClick={startCreate}>
          <CalendarPlus aria-hidden="true" />
          Creer un evenement
        </Button>
      </div>

      {message ? <Alert variant="success">{message}</Alert> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}

      <Modal
        open={isFormOpen}
        title={editingId ? "Modifier l'evenement" : "Créer un evenement"}
        description="Renseignez les informations publiees et le statut administratif."
        onClose={closeFormModal}
      >
        {renderEventForm()}
      </Modal>

      {isLoading ? <Skeleton className="h-48" /> : null}

      {!isLoading ? (
        <ListTable
          title="Liste des événements"
          countLabel={`${evenements.length} evenement${evenements.length > 1 ? "s" : ""}`}
          minWidth={920}
          action={
          <Button type="button" onClick={() => void reloadEvenements()} variant="outline" size="sm" className="w-fit">
            <RefreshCcw aria-hidden="true" />
            Rafraichir
          </Button>
          }
          headers={[
            { label: "Titre" },
            { label: "Date" },
            { label: "Lieu" },
            { label: "Statut" },
            { label: "Actions", className: "text-right" },
          ]}
          emptyState={evenements.length === 0 ? <EmptyState icon={CalendarDays} title="Aucun evenement pour le moment." /> : null}
        >
          {evenements.map((evenement) => (
            <tr key={evenement.id} className="align-top">
              <td className="px-4 py-3 font-medium text-foreground">
                <p className="max-w-xs truncate">{evenement.titre}</p>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{formatDateTime(evenement)}</td>
              <td className="px-4 py-3 text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" aria-hidden="true" />
                  {evenement.lieu || "Lieu non renseigné"}
                </span>
              </td>
              <td className="px-4 py-3">
                <Badge variant={evenement.statut_evenement === "PLANIFIE" ? "success" : "outline"}>
                  {evenement.statut_evenement}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap justify-end gap-2">
                  <Button type="button" onClick={() => setDetailsEvent(evenement)} variant="ghost" size="sm">
                    <Eye aria-hidden="true" />
                    Details
                  </Button>
                  <Button type="button" onClick={() => startEdit(evenement)} variant="outline" size="sm">
                    <Edit3 aria-hidden="true" />
                    Modifier
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
              </td>
            </tr>
          ))}
        </ListTable>
      ) : null}

      <Modal
        open={Boolean(detailsEvent)}
        title="Détails de l’événement"
        description="Informations complètes de l'evenement selectionne."
        className="max-w-3xl"
        onClose={() => setDetailsEvent(null)}
      >
        {detailsEvent ? (
          <div className="grid gap-4">
            {detailsEvent.image ? (
              <div className="relative aspect-[16/7] overflow-hidden rounded-lg border border-border bg-muted">
                <Image
                  src={detailsEvent.image}
                  alt={`Image de ${detailsEvent.titre}`}
                  fill
                  unoptimized
                  sizes="720px"
                  className="object-cover"
                />
              </div>
            ) : null}
            <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4 md:grid-cols-2">
              <DetailItem label="Titre" value={detailsEvent.titre} />
              <DetailItem label="Type" value={detailsEvent.type_evenement} />
              <DetailItem label="Date" value={formatDateTime(detailsEvent)} />
              <DetailItem label="Lieu" value={detailsEvent.lieu || "Non renseigné"} />
              <DetailItem label="Statut" value={detailsEvent.statut_evenement} />
              <DetailItem label="Vidéo" value={detailsEvent.video ? "Disponible" : "Non renseignée"} />
              <DetailItem label="Description" value={detailsEvent.description || "Non renseignée"} className="md:col-span-2" />
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

function DetailItem({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
