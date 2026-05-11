"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { Edit3, ExternalLink, Handshake, ImageIcon, Power, RefreshCcw, Trash2 } from "lucide-react";

import {
  Partenaire,
  createPartenaire,
  deletePartenaire,
  formatApiError,
  getAdminPartenaires,
  updatePartenaire,
} from "@/lib/api";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";

const partnerTypes = [
  { value: "ACADEMIQUE", label: "Academique" },
  { value: "FINANCIER", label: "Financier" },
  { value: "COMMUNAUTAIRE", label: "Communautaire" },
  { value: "TECHNOLOGIQUE", label: "Technologique" },
  { value: "AUTRE", label: "Autre" },
];

type PartnerFormState = {
  nom_partenaire: string;
  description: string;
  site_web: string;
  type_partenaire: string;
  ordre_affichage: string;
  statut: string;
};

const emptyForm: PartnerFormState = {
  nom_partenaire: "",
  description: "",
  site_web: "",
  type_partenaire: "AUTRE",
  ordre_affichage: "0",
  statut: "ACTIF",
};

function formFromPartner(partenaire: Partenaire): PartnerFormState {
  return {
    nom_partenaire: partenaire.nom_partenaire,
    description: partenaire.description ?? "",
    site_web: partenaire.site_web ?? "",
    type_partenaire: partenaire.type_partenaire,
    ordre_affichage: String(partenaire.ordre_affichage ?? 0),
    statut: partenaire.statut,
  };
}

function buildFormData(state: PartnerFormState, file: File | null) {
  const formData = new FormData();
  formData.append("nom_partenaire", state.nom_partenaire);
  formData.append("description", state.description);
  formData.append("site_web", state.site_web);
  formData.append("type_partenaire", state.type_partenaire);
  formData.append("ordre_affichage", state.ordre_affichage || "0");
  formData.append("statut", state.statut);
  if (file) {
    formData.append("logo", file);
  }
  return formData;
}

export function AdminPartenaires() {
  const [partenaires, setPartenaires] = useState<Partenaire[]>([]);
  const [form, setForm] = useState<PartnerFormState>(emptyForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [actionId, setActionId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getAdminPartenaires()
      .then((rows) => {
        if (isMounted) {
          setPartenaires(rows);
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

  function updateForm(field: keyof PartnerFormState, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setLogoFile(null);
    setEditingId(null);
  }

  async function reloadPartenaires() {
    const rows = await getAdminPartenaires();
    setPartenaires(rows);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSaving(true);

    try {
      const payload = buildFormData(form, logoFile);
      if (editingId) {
        const updated = await updatePartenaire(editingId, payload);
        setPartenaires((currentRows) =>
          currentRows.map((partenaire) => (partenaire.id === updated.id ? updated : partenaire)),
        );
        setMessage("Partenaire modifie.");
      } else {
        const created = await createPartenaire(payload);
        setPartenaires((currentRows) => [...currentRows, created].sort((a, b) => a.ordre_affichage - b.ordre_affichage));
        setMessage("Partenaire cree.");
      }
      resetForm();
      setIsFormOpen(false);
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleStatus(partenaire: Partenaire) {
    setActionId(partenaire.id);
    setError("");
    setMessage("");
    const nextStatus = partenaire.statut === "ACTIF" ? "INACTIF" : "ACTIF";

    try {
      const updated = await updatePartenaire(partenaire.id, { statut: nextStatus });
      setPartenaires((currentRows) =>
        currentRows.map((currentPartenaire) =>
          currentPartenaire.id === updated.id ? updated : currentPartenaire,
        ),
      );
      setMessage(nextStatus === "ACTIF" ? "Partenaire active." : "Partenaire desactive.");
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(partenaire: Partenaire) {
    const confirmed = window.confirm(`Supprimer ${partenaire.nom_partenaire} ?`);
    if (!confirmed) {
      return;
    }

    setActionId(partenaire.id);
    setError("");
    setMessage("");

    try {
      await deletePartenaire(partenaire.id);
      setPartenaires((currentRows) => currentRows.filter((currentPartenaire) => currentPartenaire.id !== partenaire.id));
      if (editingId === partenaire.id) {
        resetForm();
        setIsFormOpen(false);
      }
      setMessage("Partenaire supprime.");
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setActionId(null);
    }
  }

  function startEdit(partenaire: Partenaire) {
    setEditingId(partenaire.id);
    setForm(formFromPartner(partenaire));
    setLogoFile(null);
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

  function renderPartnerForm() {
    return (
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            Nom du partenaire
            <input
              className="field"
              required
              value={form.nom_partenaire}
              onChange={(event) => updateForm("nom_partenaire", event.target.value)}
            />
          </label>

          <label>
            Site web
            <input
              className="field"
              type="url"
              value={form.site_web}
              onChange={(event) => updateForm("site_web", event.target.value)}
            />
          </label>

          <label>
            Type
            <select
              className="field"
              value={form.type_partenaire}
              onChange={(event) => updateForm("type_partenaire", event.target.value)}
            >
              {partnerTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Statut
            <select className="field" value={form.statut} onChange={(event) => updateForm("statut", event.target.value)}>
              <option value="ACTIF">Actif</option>
              <option value="INACTIF">Inactif</option>
            </select>
          </label>

          <label>
            Ordre d&apos;affichage
            <input
              className="field"
              type="number"
              min={0}
              value={form.ordre_affichage}
              onChange={(event) => updateForm("ordre_affichage", event.target.value)}
            />
          </label>

          <label>
            Logo
            <input
              className="field"
              type="file"
              accept="image/*"
              onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        {editingId ? (
          <div className="mt-4 rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">
            Le logo actuel est conserve si aucun nouveau logo n&apos;est choisi.
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
            <Handshake aria-hidden="true" />
            {isSaving ? "Enregistrement..." : editingId ? "Enregistrer les modifications" : "Creer le partenaire"}
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
          <h1 className="font-display text-3xl font-bold">Gestion partenaires</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Creez, modifiez, activez, desactivez ou supprimez les partenaires affiches sur le site public.
          </p>
        </div>
        <Button type="button" className="w-fit" onClick={startCreate}>
          <Handshake aria-hidden="true" />
          Creer un partenaire
        </Button>
      </div>

      {message ? <Alert variant="success">{message}</Alert> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}

      <Modal
        open={isFormOpen}
        title={editingId ? "Modifier le partenaire" : "Creer un partenaire"}
        description="Renseignez les informations publiques et l'ordre d'affichage."
        onClose={closeFormModal}
      >
        {renderPartnerForm()}
      </Modal>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border bg-muted/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Liste des partenaires</p>
            <p className="text-xs text-muted-foreground">
              {partenaires.length} partenaire{partenaires.length > 1 ? "s" : ""}
            </p>
          </div>
          <Button type="button" onClick={() => void reloadPartenaires()} variant="outline" size="sm" className="w-fit">
            <RefreshCcw aria-hidden="true" />
            Rafraichir
          </Button>
        </div>

        {isLoading ? <div className="p-4"><Skeleton className="h-40" /></div> : null}

        {!isLoading && partenaires.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={Handshake} title="Aucun partenaire pour le moment." />
          </div>
        ) : null}

        {!isLoading && partenaires.length > 0 ? (
          <div className="divide-y divide-border">
            {partenaires.map((partenaire) => (
              <article key={partenaire.id} className="grid gap-3 px-4 py-3 md:grid-cols-[64px_1fr] xl:grid-cols-[64px_1fr_auto]">
                <div className="relative size-16 overflow-hidden rounded-lg border border-border bg-muted">
                  {partenaire.logo ? (
                    <Image
                      src={partenaire.logo}
                      alt={`Logo de ${partenaire.nom_partenaire}`}
                      fill
                      unoptimized
                      sizes="64px"
                      className="object-contain p-2"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <ImageIcon className="size-5" aria-hidden="true" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-sm font-semibold text-foreground sm:text-base">{partenaire.nom_partenaire}</h2>
                    <Badge variant={partenaire.statut === "ACTIF" ? "success" : "outline"}>{partenaire.statut}</Badge>
                    <Badge variant="bronze">{partenaire.type_partenaire}</Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {partenaire.description || "Aucune description."}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Ordre: {partenaire.ordre_affichage}</span>
                    {partenaire.site_web ? (
                      <a
                        href={partenaire.site_web}
                        className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink className="size-3.5" aria-hidden="true" />
                        Site web
                      </a>
                    ) : null}
                    {partenaire.logo ? <span>Logo ajoute</span> : <span>Logo non renseigne</span>}
                  </div>
                </div>

                <div className="flex flex-wrap items-start gap-2 xl:justify-end">
                  <Button
                    type="button"
                    onClick={() => startEdit(partenaire)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit3 aria-hidden="true" />
                    Modifier
                  </Button>
                  <Button
                    type="button"
                    disabled={actionId === partenaire.id}
                    onClick={() => void handleToggleStatus(partenaire)}
                    variant="outline"
                    size="sm"
                  >
                    <Power aria-hidden="true" />
                    {partenaire.statut === "ACTIF" ? "Desactiver" : "Activer"}
                  </Button>
                  <Button
                    type="button"
                    disabled={actionId === partenaire.id}
                    onClick={() => void handleDelete(partenaire)}
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
    </div>
  );
}
