"use client";

import {
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Handshake,
  Mail,
  Settings,
  UserCog,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { ParametreSysteme, getParametres } from "@/lib/api";
import { cn } from "@/lib/utils";

const mentorshipPeriodKey = "MENTORSHIP_PERIODS";

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/inscriptions", label: "Inscriptions", icon: UserRoundCheck },
  { href: "/admin/mentors", label: "Mentors", icon: UsersRound },
  { href: "/admin/mentores", label: "Mentores", icon: UserRoundCheck },
  { href: "/admin/jumelages", label: "Jumelages", icon: Handshake },
  { href: "/admin/mentorship/assignments", label: "Affectations", icon: Handshake },
  { href: "/admin/mentorship/progress", label: "Suivis", icon: UserRoundCheck },
  { href: "/admin/evenements", label: "Evenements", icon: CalendarDays },
  { href: "/admin/partenaires", label: "Partenaires", icon: Handshake },
  { href: "/admin/emails", label: "Emails", icon: Mail },
  { href: "/admin/administrateurs", label: "Administrateurs", icon: UserCog },
];

function parameterHref(key: string) {
  return `/admin/parametres?param=${encodeURIComponent(key)}`;
}

export function AdminSidebarNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedParam = searchParams.get("param");
  const selectedParamKey = selectedParam ?? mentorshipPeriodKey;
  const [parametres, setParametres] = useState<ParametreSysteme[]>([]);
  const [isOpenByUser, setIsOpenByUser] = useState(false);
  const isOpen = pathname === "/admin/parametres" || isOpenByUser;

  useEffect(() => {
    let isMounted = true;
    getParametres()
      .then((rows) => {
        if (isMounted) {
          setParametres(rows);
        }
      })
      .catch(() => {
        if (isMounted) {
          setParametres([]);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const parameterLinks = useMemo(
    () => [
      {
        href: parameterHref(mentorshipPeriodKey),
        key: mentorshipPeriodKey,
        label: "Periode de mentorat",
      },
      ...parametres
        .filter((parametre) => parametre.cle !== mentorshipPeriodKey)
        .map((parametre) => ({
          href: parameterHref(parametre.cle),
          key: parametre.cle,
          label: parametre.cle,
        })),
    ],
    [parametres],
  );

  return (
    <nav className="mt-5 grid gap-1 text-sm" aria-label="Navigation admin">
      {adminLinks.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-white/75 transition hover:bg-white/10 hover:text-white",
              isActive && "bg-white/10 text-white",
            )}
          >
            <link.icon className="size-4" aria-hidden="true" />
            {link.label}
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
        <span className="flex-1">Parametres</span>
        {isOpen ? <ChevronDown className="size-4" aria-hidden="true" /> : <ChevronRight className="size-4" aria-hidden="true" />}
      </button>

      {isOpen ? (
        <div className="ml-5 grid gap-1 border-l border-white/10 pl-3">
          {parameterLinks.map((link) => (
            <Link
              key={link.key}
              href={link.href}
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
