"use client";

import { CalendarClock, CalendarPlus, Pencil, Save } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  MentorshipAssignment,
  MentorshipPeriod,
  UtilisateurDetail,
  continueMentorAssignment,
  formatApiError,
  getAvailableMentorshipPeriods,
  getCurrentUser,
  getMentorAssignments,
  updateOwnProfile,
} from "@/lib/api";

type SettingsSection = "account" | "session";

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function normalizeSection(value: string | null): SettingsSection {
  if (value === "session") {
    return value;
  }
  return "account";
}

function formatValue(value?: string | number | null) {
  if (value === undefined || value === null || value === "") {
    return "Non renseigne";
  }
  return String(value);
}

function formatFullName(user: UtilisateurDetail) {
  return `${user.prenom ?? ""} ${user.nom ?? ""}`.trim() || "Non renseigne";
}

function isPeriodExpired(period?: MentorshipPeriod) {
  if (!period?.end_date) {
    return false;
  }
  const endDate = new Date(`${period.end_date}T23:59:59`);
  return endDate < new Date();
}

export function MentorSettingsPanel() {
  const searchParams = useSearchParams();
  const section = normalizeSection(searchParams.get("section"));
  const [user, setUser] = useState<UtilisateurDetail | null>(null);
  const [assignments, setAssignments] = useState<MentorshipAssignment[]>([]);
  const [periods, setPeriods] = useState<MentorshipPeriod[]>([]);
  const [renewalPeriodId, setRenewalPeriodId] = useState("");
  const [error, setError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [sessionMessage, setSessionMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [sessionError, setSessionError] = useState("");
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isSessionSaving, setIsSessionSaving] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    Promise.all([getCurrentUser(), getMentorAssignments(), getAvailableMentorshipPeriods()])
      .then(([currentUser, assignmentRows, periodRows]) => {
        if (isMounted) {
          setUser(currentUser);
          setAssignments(assignmentRows);
          setPeriods(periodRows);
        }
      })
      .catch((apiError) => {
        if (isMounted) {
          setError(formatApiError(apiError));
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const expiredAssignments = useMemo(
    () =>
      assignments.filter(
        (assignment) => assignment.status === "active" && isPeriodExpired(assignment.period_detail),
      ),
    [assignments],
  );
  const renewalPeriods = useMemo(() => {
    if (expiredAssignments.length === 0) {
      return [];
    }
    const currentPeriodIds = new Set(assignments.map((assignment) => assignment.period));
    return periods.filter(
      (period) =>
        !currentPeriodIds.has(period.id) &&
        expiredAssignments.some(
          (assignment) => assignment.period_detail && period.start_date > assignment.period_detail.start_date,
        ),
    );
  }, [assignments, expiredAssignments, periods]);

  const accountRows = useMemo(() => {
    if (!user) {
      return [];
    }
    return [
      { label: "Nom complet", value: formatFullName(user) },
      { label: "Email de connexion", value: formatValue(user.email) },
      { label: "Telephone", value: formatValue(user.telephone) },
      { label: "Profil", value: formatValue(user.profil_mentorat) },
      { label: "Niveau academique", value: formatValue(user.niveau_academique_nom) },
      { label: "Langue preferee", value: user.langue_preferee === "EN" ? "Anglais" : "Francais" },
      { label: "Region", value: formatValue(user.region) },
      { label: "Capacite mentorat", value: `${user.nombre_mentores_actuels}/${user.capacite_mentorat} mentores` },
      { label: "Statut du compte", value: formatValue(user.statut_compte) },
      { label: "Objectifs", value: formatValue(user.objectifs) },
    ];
  }, [user]);

  async function reloadAssignments() {
    const assignmentRows = await getMentorAssignments();
    setAssignments(assignmentRows);
  }

  function openProfileModal() {
    setProfileError("");
    setIsProfileModalOpen(true);
  }

  async function handleContinueSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSessionMessage("");
    setSessionError("");
    if (!renewalPeriodId) {
      setSessionError("Selectionnez une session.");
      return;
    }
    const period = periods.find((item) => String(item.id) === renewalPeriodId);
    if (!period) {
      setSessionError("Session introuvable.");
      return;
    }
    const assignmentsToRenew = expiredAssignments.filter(
      (assignment) => assignment.period_detail && period.start_date > assignment.period_detail.start_date,
    );
    if (assignmentsToRenew.length === 0) {
      setSessionError("Aucune session expiree ne peut etre reconduite.");
      return;
    }
    setIsSessionSaving(true);
    try {
      await Promise.all(
        assignmentsToRenew.map((assignment) => continueMentorAssignment(assignment.id, period.id)),
      );
      setRenewalPeriodId("");
      setSessionMessage("Nouvelle session enregistree.");
      await reloadAssignments();
    } catch (apiError) {
      setSessionError(formatApiError(apiError));
    } finally {
      setIsSessionSaving(false);
    }
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setProfileMessage("");
    setProfileError("");
    setIsProfileSaving(true);
    try {
      const updatedUser = await updateOwnProfile({
        nom: formString(formData, "nom"),
        prenom: formString(formData, "prenom"),
        email: formString(formData, "email"),
        telephone: formString(formData, "telephone"),
        langue_preferee: formString(formData, "langue_preferee") as "FR" | "EN",
        region: formString(formData, "region"),
        objectifs: formString(formData, "objectifs"),
      });
      setUser(updatedUser);
      setProfileMessage("Informations personnelles mises a jour.");
      setIsProfileModalOpen(false);
    } catch (apiError) {
      setProfileError(formatApiError(apiError));
    } finally {
      setIsProfileSaving(false);
    }
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  if (!user) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="grid gap-6">
      <Modal
        open={isProfileModalOpen}
        title="Modifier les informations personnelles"
        description="Mettez a jour les donnees principales de votre compte mentor."
        className="max-w-4xl"
        onClose={() => setIsProfileModalOpen(false)}
      >
        <form onSubmit={handleProfileSubmit} className="grid gap-4 md:grid-cols-2">
          <label>
            Nom
            <Input name="nom" defaultValue={user.nom} required />
          </label>
          <label>
            Prenom
            <Input name="prenom" defaultValue={user.prenom} required />
          </label>
          <label>
            Email de connexion
            <Input name="email" type="email" defaultValue={user.email} required />
          </label>
          <label>
            Telephone
            <Input name="telephone" defaultValue={user.telephone ?? ""} />
          </label>
          <label>
            Langue preferee
            <select name="langue_preferee" className="field" defaultValue={user.langue_preferee ?? "FR"}>
              <option value="FR">Francais</option>
              <option value="EN">Anglais</option>
            </select>
          </label>
          <label>
            Region
            <Input name="region" defaultValue={user.region ?? ""} />
          </label>
          <label className="md:col-span-2">
            Objectifs
            <Textarea name="objectifs" defaultValue={user.objectifs ?? ""} />
          </label>
          <Button type="submit" className="w-fit" disabled={isProfileSaving}>
            <Save aria-hidden="true" />
            {isProfileSaving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </form>
        {profileError ? <Alert variant="error">{profileError}</Alert> : null}
      </Modal>

      {section === "account" ? (
        <Card>
          <CardHeader className="gap-4 lg:flex lg:flex-row lg:items-start lg:justify-between">
            <div>
              <CardTitle>Compte mentor</CardTitle>
              <CardDescription>Donnees de compte disponibles pour votre espace mentor.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={openProfileModal}>
                <Pencil aria-hidden="true" />
                Modifier
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            {profileMessage ? <Alert variant="success">{profileMessage}</Alert> : null}
            <ul className="overflow-hidden rounded-lg border border-border">
              {accountRows.map((row, index) => (
                <li
                  key={row.label}
                  className={`grid gap-1 p-4 text-sm sm:grid-cols-[220px_1fr] ${
                    index < accountRows.length - 1 ? "border-b border-border" : ""
                  }`}
                >
                  <span className="font-medium text-muted-foreground">{row.label}</span>
                  <span className="break-words font-semibold text-foreground">{row.value}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {section === "session" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="size-5 text-primary" aria-hidden="true" />
              Session de mentorat
            </CardTitle>
            <CardDescription>
              Consultez la session actuelle et choisissez une nouvelle session uniquement lorsque la session en cours est expiree.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            {assignments.length === 0 ? (
              <Alert>Aucune session de mentorat n&apos;est associee a votre compte pour le moment.</Alert>
            ) : (
              <>
                <form onSubmit={handleContinueSubmit} className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                  <label>
                    Session a choisir
                    <select
                      className="field"
                      value={renewalPeriodId}
                      onChange={(event) => {
                        setRenewalPeriodId(event.target.value);
                        setSessionError("");
                        setSessionMessage("");
                      }}
                      disabled={expiredAssignments.length === 0 || renewalPeriods.length === 0}
                      required
                    >
                      <option value="">Choisir une session</option>
                      {renewalPeriods.map((period) => (
                        <option key={period.id} value={period.id}>
                          {period.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Button type="submit" className="w-fit" disabled={isSessionSaving || !renewalPeriodId}>
                    <CalendarPlus aria-hidden="true" />
                    {isSessionSaving ? "Enregistrement..." : "Continuer"}
                  </Button>
                </form>

                {expiredAssignments.length === 0 ? (
                  <Alert>La session en cours n&apos;est pas encore expiree.</Alert>
                ) : null}
                {expiredAssignments.length > 0 && renewalPeriods.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucune nouvelle session disponible.</p>
                ) : null}

                {sessionMessage ? <Alert variant="success">{sessionMessage}</Alert> : null}
                {sessionError ? <Alert variant="error">{sessionError}</Alert> : null}
              </>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
