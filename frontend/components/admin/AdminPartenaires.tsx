"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { Edit3, ExternalLink, Eye, Handshake, ImageIcon, Power, RefreshCcw, Trash2 } from "lucide-react";

import {
  Partenaire,
  createPartenaire,
  deletePartenaire,
  formatApiError,
  getAdminPartenaires,
  updatePartenaire,
} from "@/lib/api";
import { HelpIconButton } from "@/components/help/HelpIconButton";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ListTable } from "@/components/ui/list-table";
import { Modal } from "@/components/ui/modal";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Skeleton } from "@/components/ui/skeleton";
import { usePagination } from "@/hooks/usePagination";

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

function formatDate(value: string) {
  if (!value) {
    return "Non renseignée";
  }
  return new Date(value).toLocaleDateString("fr-CA");
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
  const [detailsPartner, setDetailsPartner] = useState<Partenaire | null>(null);
  const [partnerToDelete, setPartnerToDelete] = useState<Partenaire | null>(null);
  const { page, setPage, pageCount, visibleItems: visiblePartenaires } = usePagination(partenaires, 8);

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
        setMessage("Partenaire modifié.");
      } else {
        const created = await createPartenaire(payload);
        setPartenaires((currentRows) => [...currentRows, created].sort((a, b) => a.ordre_affichage - b.ordre_affichage));
        setMessage("Partenaire créé.");
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
      setDetailsPartner((current) => (current?.id === partenaire.id ? null : current));
      setPartnerToDelete(null);
      setMessage("Partenaire supprimé.");
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
            {isSaving ? "Enregistrement..." : editingId ? "Enregistrer les modifications" : "Créer le partenaire"}
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
            <h1 className="font-display text-3xl font-bold">Gestion partenaires</h1>
            <HelpIconButton moduleKey="partners" scope="admin" />
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Créez, modifiez, activez, désactivez ou supprimez les partenaires affichés sur le site public.
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
        title={editingId ? "Modifier le partenaire" : "Créer un partenaire"}
        description="Renseignez les informations publiques et l'ordre d'affichage."
        onClose={closeFormModal}
      >
        {renderPartnerForm()}
      </Modal>

      {isLoading ? <Skeleton className="h-40" /> : null}

      {!isLoading ? (
        <ListTable
          title="Liste des partenaires"
          countLabel={`${partenaires.length} partenaire${partenaires.length > 1 ? "s" : ""}`}
          minWidth={960}
          footer={pageCount > 1 ? <PaginationControls page={page} pageCount={pageCount} onPageChange={setPage} /> : null}
          action={
          <Button type="button" onClick={() => void reloadPartenaires()} variant="outline" size="sm" className="w-fit">
            <RefreshCcw aria-hidden="true" />
            Rafraichir
          </Button>
          }
          headers={[
            { label: "Partenaire" },
            { label: "Type" },
            { label: "Statut" },
            { label: "Date" },
            { label: "Actions", className: "text-right" },
          ]}
          emptyState={partenaires.length === 0 ? <EmptyState icon={Handshake} title="Aucun partenaire pour le moment." /> : null}
        >
          {visiblePartenaires.map((partenaire) => (
            <tr key={partenaire.id} className="align-top">
              <td className="px-4 py-3 font-medium text-foreground">
                <p className="max-w-xs truncate">{partenaire.nom_partenaire}</p>
              </td>
              <td className="px-4 py-3">
                <Badge variant="bronze">{partenaire.type_partenaire}</Badge>
              </td>
              <td className="px-4 py-3">
                <Badge variant={partenaire.statut === "ACTIF" ? "success" : "outline"}>{partenaire.statut}</Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(partenaire.date_ajout)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap justify-end gap-2">
                  <Button type="button" onClick={() => setDetailsPartner(partenaire)} variant="ghost" size="sm">
                    <Eye aria-hidden="true" />
                    Details
                  </Button>
                  <Button type="button" onClick={() => startEdit(partenaire)} variant="outline" size="sm">
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
                </div>
              </td>
            </tr>
          ))}
        </ListTable>
      ) : null}

      <Modal
        open={Boolean(detailsPartner)}
        title="Détails du partenaire"
        description="Informations complètes du partenaire selectionne."
        className="max-w-3xl"
        onClose={() => setDetailsPartner(null)}
      >
        {detailsPartner ? (
          <div className="grid gap-4">
            <div className="flex items-center gap-4">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                {detailsPartner.logo ? (
                  <Image
                    src={detailsPartner.logo}
                    alt={`Logo de ${detailsPartner.nom_partenaire}`}
                    fill
                    unoptimized
                    sizes="80px"
                    className="object-contain p-2"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <ImageIcon className="size-5" aria-hidden="true" />
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">{detailsPartner.nom_partenaire}</p>
                <p className="mt-1 text-sm text-muted-foreground">{detailsPartner.type_partenaire}</p>
              </div>
            </div>
            <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4 md:grid-cols-2">
              <DetailItem label="Type" value={detailsPartner.type_partenaire} />
              <DetailItem label="Ordre" value={String(detailsPartner.ordre_affichage)} />
              <DetailItem label="Statut" value={detailsPartner.statut} />
              <DetailItem label="Site web" value={detailsPartner.site_web || "Non renseigné"} />
              <DetailItem label="Date d'ajout" value={formatDate(detailsPartner.date_ajout)} />
              <DetailItem label="Description" value={detailsPartner.description || "Non renseignée"} className="md:col-span-2" />
            </div>
            <div className="flex flex-wrap gap-2">
              {detailsPartner.site_web ? (
                <Button type="button" variant="outline" asChild>
                  <a href={detailsPartner.site_web} target="_blank" rel="noreferrer">
                    <ExternalLink aria-hidden="true" />
                    Site web
                  </a>
                </Button>
              ) : null}
              <Button
                type="button"
                disabled={actionId === detailsPartner.id}
                onClick={() => setPartnerToDelete(detailsPartner)}
                variant="danger"
              >
                <Trash2 aria-hidden="true" />
                Supprimer
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(partnerToDelete)}
        title="Supprimer ce partenaire ?"
        description="Voulez-vous vraiment supprimer cet élément ? Cette action est irréversible."
        confirmLabel="Supprimer le partenaire"
        isConfirming={Boolean(partnerToDelete && actionId === partnerToDelete.id)}
        onCancel={() => setPartnerToDelete(null)}
        onConfirm={async () => {
          if (partnerToDelete) {
            await handleDelete(partnerToDelete);
          }
        }}
      >
        {partnerToDelete ? <p className="font-medium text-foreground">{partnerToDelete.nom_partenaire}</p> : null}
      </ConfirmDialog>
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
