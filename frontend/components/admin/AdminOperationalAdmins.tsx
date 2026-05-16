"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Eye, Pencil, Plus, Trash2, UserCog, XCircle } from "lucide-react";

import { PhoneInput } from "@/components/forms/PhoneInput";
import { HelpIconButton } from "@/components/help/HelpIconButton";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ListTable } from "@/components/ui/list-table";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  OperationalAdmin,
  approveOperationalAdminPublicProfile,
  createOperationalAdmin,
  deleteOperationalAdmin,
  formatApiError,
  getOperationalAdmins,
  rejectOperationalAdminPublicProfile,
  updateOperationalAdmin,
} from "@/lib/api";

type Draft = {
  prenom: string;
  nom: string;
  email: string;
  mot_de_passe: string;
  telephone: string;
  region: string;
  statut_compte: string;
  can_appear_on_about_page: boolean;
  public_title: string;
  public_description: string;
};

const emptyDraft: Draft = {
  prenom: "",
  nom: "",
  email: "",
  mot_de_passe: "",
  telephone: "",
  region: "",
  statut_compte: "ACTIF",
  can_appear_on_about_page: false,
  public_title: "",
  public_description: "",
};

function fullName(admin: OperationalAdmin) {
  return `${admin.prenom} ${admin.nom}`.trim() || admin.email;
}

function approvedFullName(admin: OperationalAdmin) {
  return `${admin.approved_public_prenom} ${admin.approved_public_nom}`.trim() || "Non valide";
}

function publicValidationLabel(admin: OperationalAdmin) {
  if (admin.pending_public_validation) {
    return "En attente";
  }
  if (admin.is_public_profile_approved) {
    return "Valide";
  }
  if (admin.public_profile_status === "REFUSE") {
    return "Refuse";
  }
  return "Non soumis";
}

function publicValidationBadge(admin: OperationalAdmin) {
  if (admin.pending_public_validation) {
    return <Badge variant="bronze">En attente</Badge>;
  }
  if (admin.is_public_profile_approved) {
    return <Badge variant="success">Valide</Badge>;
  }
  if (admin.public_profile_status === "REFUSE") {
    return <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">Refuse</Badge>;
  }
  return <Badge variant="outline">Non soumis</Badge>;
}

export function AdminOperationalAdmins() {
  const [rows, setRows] = useState<OperationalAdmin[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [detailsAdmin, setDetailsAdmin] = useState<OperationalAdmin | null>(null);

  async function loadRows() {
    try {
      setRows(await getOperationalAdmins());
      setError("");
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;
    getOperationalAdmins()
      .then((payload) => {
        if (isMounted) {
          setRows(payload);
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

  function openCreate() {
    setDraft(emptyDraft);
    setEditingId(null);
    setMessage("");
    setError("");
    setIsOpen(true);
  }

  function openEdit(admin: OperationalAdmin) {
    setDraft({
      prenom: admin.prenom,
      nom: admin.nom,
      email: admin.email,
      mot_de_passe: "",
      telephone: admin.telephone ?? "",
      region: admin.region ?? "",
      statut_compte: admin.statut_compte,
      can_appear_on_about_page: admin.can_appear_on_about_page,
      public_title: admin.public_title ?? "",
      public_description: admin.public_description ?? "",
    });
    setEditingId(admin.id);
    setMessage("");
    setError("");
    setIsOpen(true);
  }

  function closeModal() {
    setDraft(emptyDraft);
    setEditingId(null);
    setIsOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const photo = formData.get("public_photo");
    const payload = new FormData();
    Object.entries(draft).forEach(([key, value]) => {
      if (key === "mot_de_passe" && editingId && !value) {
        return;
      }
      payload.append(key, String(value));
    });
    if (photo instanceof File && photo.size > 0) {
      payload.append("public_photo", photo);
    }

    try {
      if (editingId) {
        await updateOperationalAdmin(editingId, payload);
        setMessage("Administrateur opérationnel mis à jour.");
      } else {
        await createOperationalAdmin(payload);
        setMessage("Administrateur opérationnel créé.");
      }
      closeModal();
      await loadRows();
    } catch (apiError) {
      setError(formatApiError(apiError));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(admin: OperationalAdmin) {
    setError("");
    setMessage("");
    try {
      await deleteOperationalAdmin(admin.id);
      setMessage("Administrateur opérationnel supprimé.");
      await loadRows();
    } catch (apiError) {
      setError(formatApiError(apiError));
    }
  }

  async function handleApprovePublicProfile(admin: OperationalAdmin) {
    setError("");
    setMessage("");
    try {
      const updated = await approveOperationalAdminPublicProfile(admin.id);
      setRows((currentRows) => currentRows.map((row) => (row.id === updated.id ? updated : row)));
      setDetailsAdmin((current) => (current?.id === updated.id ? updated : current));
      setMessage(`Profil public approuvé pour ${fullName(updated)}.`);
    } catch (apiError) {
      setError(formatApiError(apiError));
    }
  }

  async function handleRejectPublicProfile(admin: OperationalAdmin) {
    setError("");
    setMessage("");
    try {
      const updated = await rejectOperationalAdminPublicProfile(admin.id);
      setRows((currentRows) => currentRows.map((row) => (row.id === updated.id ? updated : row)));
      setDetailsAdmin((current) => (current?.id === updated.id ? updated : current));
      setMessage(`Profil public refusé pour ${fullName(updated)}.`);
    } catch (apiError) {
      setError(formatApiError(apiError));
    }
  }

  const pendingPublicRows = rows.filter((admin) => admin.pending_public_validation);

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-bold">Administrateurs opérationnels</h1>
            <HelpIconButton moduleKey="operational_admins" scope="admin" />
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Seul l&apos;administrateur principal peut créer, modifier, désactiver ou supprimer ces comptes.
          </p>
        </div>
        <Button type="button" className="w-fit" onClick={openCreate}>
          <Plus aria-hidden="true" />
          Créer un administrateur
        </Button>
      </div>

      {message ? <Alert variant="success">{message}</Alert> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}
      {isLoading ? <Skeleton className="h-56" /> : null}

      {!isLoading && pendingPublicRows.length > 0 ? (
        <ListTable
          title="En attente de validation publique"
          countLabel={`${pendingPublicRows.length} validation${pendingPublicRows.length > 1 ? "s" : ""}`}
          minWidth={1080}
          headers={[
            { label: "Administrateur" },
            { label: "Anciennes informations" },
            { label: "Nouvelles informations" },
            { label: "Statut" },
            { label: "Actions", className: "text-right" },
          ]}
        >
          {pendingPublicRows.map((admin) => (
            <tr key={admin.id} className="align-top">
              <td className="px-4 py-3">
                <p className="font-medium text-foreground">{fullName(admin)}</p>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                <p>{approvedFullName(admin)}</p>
                <p>{admin.approved_public_title || "Titre non valide"}</p>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                <p>{fullName(admin)}</p>
                <p>{admin.public_title || "Titre non renseigné"}</p>
              </td>
              <td className="px-4 py-3">{publicValidationBadge(admin)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setDetailsAdmin(admin)}>
                    <Eye aria-hidden="true" />
                    Détails
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => void handleApprovePublicProfile(admin)}>
                    <CheckCircle2 aria-hidden="true" />
                    Approuver
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => void handleRejectPublicProfile(admin)}>
                    <XCircle aria-hidden="true" />
                    Refuser
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </ListTable>
      ) : null}

      {!isLoading ? (
        <ListTable
          title="Liste des administrateurs"
          countLabel={`${rows.length} administrateur${rows.length > 1 ? "s" : ""}`}
          minWidth={980}
          headers={[
            { label: "Nom" },
            { label: "Email" },
            { label: "Téléphone" },
            { label: "Titre public" },
            { label: "Statut" },
            { label: "Affichage public" },
            { label: "Validation publique" },
            { label: "Actions", className: "text-right" },
          ]}
          emptyState={rows.length === 0 ? <EmptyState icon={UserCog} title="Aucun administrateur opérationnel." /> : null}
        >
          {rows.map((admin) => (
            <tr key={admin.id} className="align-top">
              <td className="px-4 py-3">
                <p className="font-medium text-foreground">{fullName(admin)}</p>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{admin.email}</td>
              <td className="px-4 py-3 text-muted-foreground">{admin.telephone || "Non renseigné"}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {admin.public_title || "Non renseigné"}
              </td>
              <td className="px-4 py-3">
                <Badge variant={admin.statut_compte === "ACTIF" ? "success" : "outline"}>{admin.statut_compte}</Badge>
              </td>
              <td className="px-4 py-3">
                {admin.can_appear_on_about_page ? <Badge variant="bronze">Visible sur À propos</Badge> : <Badge variant="outline">Masqué</Badge>}
              </td>
              <td className="px-4 py-3">{publicValidationBadge(admin)}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setDetailsAdmin(admin)}>
                    <Eye aria-hidden="true" />
                    Détails
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => openEdit(admin)}>
                    <Pencil aria-hidden="true" />
                    Modifier
                  </Button>
                  <Button type="button" variant="danger" size="sm" onClick={() => void handleDelete(admin)}>
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
        open={isOpen}
        title={editingId ? "Modifier l’administrateur" : "Créer un administrateur opérationnel"}
        description="Renseignez le compte et son affichage public sur la page À propos."
        className="max-w-4xl"
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <label>
            Prénom
            <input className="field" required value={draft.prenom} onChange={(event) => setDraft({ ...draft, prenom: event.target.value })} />
          </label>
          <label>
            Nom
            <input className="field" required value={draft.nom} onChange={(event) => setDraft({ ...draft, nom: event.target.value })} />
          </label>
          <label>
            Email
            <input className="field" type="email" required value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} />
          </label>
          <label>
            Mot de passe
            <input
              className="field"
              type="password"
              minLength={8}
              required={!editingId}
              value={draft.mot_de_passe}
              onChange={(event) => setDraft({ ...draft, mot_de_passe: event.target.value })}
            />
          </label>
          <label>
            Téléphone
            <PhoneInput
              className="field"
              value={draft.telephone}
              onChange={(event) => setDraft({ ...draft, telephone: event.target.value })}
            />
          </label>
          <label>
            Région
            <input className="field" value={draft.region} onChange={(event) => setDraft({ ...draft, region: event.target.value })} />
          </label>
          <label>
            Statut du compte
            <select className="field" value={draft.statut_compte} onChange={(event) => setDraft({ ...draft, statut_compte: event.target.value })}>
              <option value="ACTIF">Actif</option>
              <option value="INACTIF">Inactif</option>
            </select>
          </label>
          <label>
            Photo publique
            <input name="public_photo" className="field" type="file" accept="image/*" />
          </label>
          <label className="flex items-center gap-3 pt-7 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={draft.can_appear_on_about_page}
              onChange={(event) => setDraft({ ...draft, can_appear_on_about_page: event.target.checked })}
            />
            <span>Afficher sur la page À propos</span>
          </label>
          <label>
            Titre public
            <input
              className="field"
              required={draft.can_appear_on_about_page}
              placeholder="Coordonnateur, Chercheur, Docteur..."
              value={draft.public_title}
              onChange={(event) => setDraft({ ...draft, public_title: event.target.value })}
            />
          </label>
          <label className="md:col-span-2">
            Courte description publique
            <textarea
              className="field"
              rows={4}
              value={draft.public_description}
              onChange={(event) => setDraft({ ...draft, public_description: event.target.value })}
            />
          </label>
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button type="submit" disabled={isSaving}>
              <Plus aria-hidden="true" />
              {isSaving ? "Enregistrement..." : editingId ? "Enregistrer" : "Créer"}
            </Button>
            <Button type="button" variant="outline" onClick={closeModal}>
              Annuler
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(detailsAdmin)}
        title="Détails de l’administrateur"
        description="Informations du compte et affichage public."
        className="max-w-3xl"
        onClose={() => setDetailsAdmin(null)}
      >
        {detailsAdmin ? (
          <div className="grid gap-4">
            <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4 md:grid-cols-2">
              <DetailItem label="Nom complet" value={fullName(detailsAdmin)} />
              <DetailItem label="Email" value={detailsAdmin.email} />
              <DetailItem label="Téléphone" value={detailsAdmin.telephone || "Non renseigné"} />
              <DetailItem label="Région" value={detailsAdmin.region || "Non renseignée"} />
              <DetailItem label="Statut du compte" value={detailsAdmin.statut_compte} />
              <DetailItem label="Accès actif" value={detailsAdmin.is_active ? "Oui" : "Non"} />
              <DetailItem label="Affichage À propos" value={detailsAdmin.can_appear_on_about_page ? "Visible" : "Masqué"} />
              <DetailItem label="Validation publique" value={publicValidationLabel(detailsAdmin)} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Anciennes informations validées</p>
                <DetailItem label="Nom public" value={approvedFullName(detailsAdmin)} className="mt-3" />
                <DetailItem label="Titre public" value={detailsAdmin.approved_public_title || "Non valide"} className="mt-3" />
                <DetailItem label="Description publique" value={detailsAdmin.approved_public_description || "Non validée"} className="mt-3" />
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Nouvelles informations</p>
                <DetailItem label="Nom public" value={fullName(detailsAdmin)} className="mt-3" />
                <DetailItem label="Titre public" value={detailsAdmin.public_title || "Non renseigné"} className="mt-3" />
                <DetailItem label="Description publique" value={detailsAdmin.public_description || "Non renseignée"} className="mt-3" />
              </div>
            </div>
            {detailsAdmin.pending_public_validation ? (
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" onClick={() => void handleApprovePublicProfile(detailsAdmin)}>
                  <CheckCircle2 aria-hidden="true" />
                  Approuver
                </Button>
                <Button type="button" variant="outline" onClick={() => void handleRejectPublicProfile(detailsAdmin)}>
                  <XCircle aria-hidden="true" />
                  Refuser
                </Button>
              </div>
            ) : null}
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
