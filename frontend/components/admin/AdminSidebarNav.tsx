"use client";

import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Handshake,
  HelpCircle,
  AlertTriangle,
  Settings,
  UserCog,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useHydrated } from "@/components/layout/useHydrated";
import { AdminActionAlerts, ParametreSysteme, UtilisateurDetail, getAdminActionAlerts, getCurrentUser, getParametres } from "@/lib/api";
import { cn } from "@/lib/utils";

const mentorshipPeriodKey = "MENTORSHIP_PERIODS";
const accountSettingsKey = "ACCOUNT";
const legacyMaxMenteesKey = "MAX_MENTORES_PAR_MENTOR";

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/inscriptions", label: "Inscriptions", icon: UserRoundCheck },
  { href: "/admin/mentors", label: "Mentors", icon: UsersRound },
  { href: "/admin/mentores", label: "Mentorés", icon: UserRoundCheck },
  { href: "/admin/equipes", label: "Équipes", icon: UsersRound },
  { href: "/admin/jumelages", label: "Jumelages", icon: Handshake },
  { href: "/admin/mentorship/progress", label: "Suivis", icon: UserRoundCheck },
  { href: "/admin/evenements", label: "Événements", icon: CalendarDays },
  { href: "/admin/partenaires", label: "Partenaires", icon: Handshake },
  { href: "/admin/administrateurs", label: "Administrateurs", icon: UserCog },
  { href: "/admin/help", label: "Aide", icon: HelpCircle },
];

function parameterHref(key: string) {
  return `/admin/parametres?param=${encodeURIComponent(key)}`;
}

type AdminSidebarNavProps = {
  onNavigate?: () => void;
};

export function AdminSidebarNav({ onNavigate }: AdminSidebarNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isHydrated = useHydrated();
  const selectedParam = searchParams.get("param");
  const [parametres, setParametres] = useState<ParametreSysteme[]>([]);
  const [alerts, setAlerts] = useState<AdminActionAlerts | null>(null);
  const [currentUser, setCurrentUser] = useState<UtilisateurDetail | null>(null);
  const [isOpenByUser, setIsOpenByUser] = useState(false);
  const translationGuardProps = !isHydrated ? { "data-no-translate": true } : {};
  const isOpen = pathname === "/admin/parametres" || isOpenByUser;
  const isAdminPrincipal = currentUser?.role_nom === "ADMIN_PRINCIPAL";
  const selectedParamKey = selectedParam ?? accountSettingsKey;

  useEffect(() => {
    let isMounted = true;
    async function loadSidebarData() {
      try {
        const [actionAlerts, user] = await Promise.all([getAdminActionAlerts(), getCurrentUser()]);
        if (!isMounted) {
          return;
        }
        setAlerts(actionAlerts);
        setCurrentUser(user);
        if (user.role_nom === "ADMIN_PRINCIPAL") {
          const rows = await getParametres();
          if (isMounted) {
            setParametres(rows);
          }
        } else {
          setParametres([]);
        }
      } catch {
        if (isMounted) {
          setParametres([]);
        }
      }
    }
    void loadSidebarData();
    return () => {
      isMounted = false;
    };
  }, []);

  const visibleAdminLinks = useMemo(
    () =>
      adminLinks.filter((link) => {
        if ("principalOnly" in link && link.principalOnly) {
          return currentUser?.role_nom === "ADMIN_PRINCIPAL";
        }
        if (link.href === "/admin/administrateurs") {
          return currentUser?.role_nom === "ADMIN_PRINCIPAL";
        }
        return true;
      }),
    [currentUser],
  );

  function linkBadge(label: string) {
    if (label === "Jumelages" && alerts?.pending_matching_count) {
      return alerts.pending_matching_count;
    }
    if (label === "Inscriptions" && alerts?.pending_registration_count) {
      return alerts.pending_registration_count;
    }
    if (label === "Administrateurs" && isAdminPrincipal && alerts?.pending_public_admin_count) {
      return alerts.pending_public_admin_count;
    }
    return 0;
  }

  const parameterLinks = useMemo(
    () =>
      isAdminPrincipal
        ? [
            {
              href: parameterHref(accountSettingsKey),
              key: accountSettingsKey,
              label: "Mon compte",
            },
            {
              href: parameterHref(mentorshipPeriodKey),
              key: mentorshipPeriodKey,
              label: "Période de mentorat",
            },
            ...parametres
              .filter((parametre) => ![mentorshipPeriodKey, legacyMaxMenteesKey].includes(parametre.cle))
              .map((parametre) => ({
                href: parameterHref(parametre.cle),
                key: parametre.cle,
                label: parametre.cle,
              })),
          ]
        : [
            {
              href: "/admin/parametres",
              key: accountSettingsKey,
              label: "Mon compte",
            },
          ],
    [isAdminPrincipal, parametres],
  );

  return (
    <nav className="mt-5 grid gap-1 text-sm" aria-label="Navigation admin" {...translationGuardProps}>
      {isAdminPrincipal && alerts?.session_ending_soon ? (
        <div className="mb-3 rounded-xl border border-amber-300/40 bg-amber-400/15 p-3 text-amber-50">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4" aria-hidden="true" />
            <p className="text-xs leading-5">
              Attention : la période de mentorat se termine bientôt. Pensez à créer une nouvelle période.
            </p>
          </div>
          <Link
            href={parameterHref(mentorshipPeriodKey)}
            className="mt-3 inline-flex rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/25"
            onClick={onNavigate}
          >
            Créer une période
          </Link>
        </div>
      ) : null}

      {visibleAdminLinks.map((link) => {
        const isActive = pathname === link.href;
        const badgeCount = linkBadge(link.label);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-white/75 transition hover:bg-white/10 hover:text-white",
              isActive && "bg-white/10 text-white",
            )}
          >
            <link.icon className="size-4" aria-hidden="true" />
            <span className="flex-1">{link.label}</span>
            {badgeCount > 0 ? (
              <span className="rounded-full bg-[var(--brand-red)] px-2 py-0.5 text-[11px] font-bold text-white">
                {badgeCount}
              </span>
            ) : null}
          </Link>
        );
      })}

      <button
        type="button"
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-white/75 transition hover:bg-white/10 hover:text-white",
          pathname === "/admin/parametres" && "bg-white/10 text-white",
        )}
        onClick={() => setIsOpenByUser((current) => !current)}
        aria-expanded={isOpen}
      >
        <Settings className="size-4" aria-hidden="true" />
        <span className="flex-1">Paramètres</span>
        {isAdminPrincipal && alerts?.session_ending_soon ? (
          <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-bold text-black">
            !
          </span>
        ) : null}
        {isOpen ? <ChevronDown className="size-4" aria-hidden="true" /> : <ChevronRight className="size-4" aria-hidden="true" />}
      </button>

      {isOpen ? (
        <div className="ml-5 grid gap-1 border-l border-white/10 pl-3">
          {parameterLinks.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              onClick={onNavigate}
              className={cn(
                "rounded-lg px-3 py-2 text-xs font-medium text-white/60 transition hover:bg-white/10 hover:text-white",
                pathname === "/admin/parametres" && selectedParamKey === link.key && "bg-white/10 text-white",
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </nav>
  );
}
