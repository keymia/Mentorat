"use client";

import {
  CalendarClock,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  TrendingUp,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

import { BrandMark } from "@/components/layout/BrandMark";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserSidebarIdentity } from "@/components/layout/UserSidebarIdentity";
import { useHydrated } from "@/components/layout/useHydrated";
import { Button } from "@/components/ui/button";
import { clearStoredAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const mentorLinks = [
  { href: "/mentor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/mentor/mentees", label: "Mentorés", icon: UsersRound },
  { href: "/mentor/sessions", label: "Séances", icon: CalendarClock },
  { href: "/mentor/follow-ups", label: "Suivis", icon: TrendingUp },
  { href: "/mentor/help", label: "Aide", icon: HelpCircle },
];

const mentorUtilityLinks = [
  { href: "/mentor/parametres", label: "Paramètres", icon: Settings },
];

const mentorSettingsLinks = [
  { href: "/mentor/parametres?section=account", section: "account", label: "Compte" },
  { href: "/mentor/parametres?section=profile", section: "profile", label: "Profil Équipes" },
  { href: "/mentor/parametres?section=session", section: "session", label: "Période de mentorat" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/mentor/mentees") {
    return pathname === href || pathname.startsWith("/mentor/mentees/");
  }
  if (href === "/mentor/follow-ups") {
    return pathname === href || pathname === "/mentor/progress";
  }

  return pathname === href;
}

type MentorNavProps = {
  onNavigate?: () => void;
};

function MentorNav({ onNavigate }: MentorNavProps) {
  const pathname = usePathname();

  return (
    <nav className="grid gap-1 text-sm" aria-label="Navigation mentor">
      {mentorLinks.map((link) => {
        const isActive = isActivePath(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-white/75 transition hover:bg-white/10 hover:text-white",
              isActive && "bg-white/10 text-white",
            )}
          >
            <link.icon className="size-4" aria-hidden="true" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

function MentorUtilityNav({ onNavigate }: MentorNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isHydrated = useHydrated();
  const selectedSection = searchParams.get("section") ?? "account";
  const [isSettingsOpenByUser, setIsSettingsOpenByUser] = useState(false);
  const translationGuardProps = !isHydrated ? { "data-no-translate": true } : {};
  const isSettingsOpen = pathname === "/mentor/parametres" || isSettingsOpenByUser;

  return (
    <nav className="grid gap-1 text-sm" aria-label="Navigation compte mentor" {...translationGuardProps}>
      {mentorUtilityLinks.map((link) => {
        const isActive = isActivePath(pathname, link.href);
        return (
          <div key={link.href} className="grid gap-1">
            <button
              type="button"
              onClick={() => setIsSettingsOpenByUser((current) => !current)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-white/65 transition hover:bg-white/10 hover:text-white",
                isActive && "bg-white/10 text-white",
              )}
              aria-expanded={isSettingsOpen}
            >
              <link.icon className="size-4" aria-hidden="true" />
              <span className="flex-1">{link.label}</span>
              {isSettingsOpen ? <ChevronDown className="size-4" aria-hidden="true" /> : <ChevronRight className="size-4" aria-hidden="true" />}
            </button>
            {isSettingsOpen ? (
              <div className="ml-5 grid gap-1 border-l border-white/10 pl-3">
                {mentorSettingsLinks.map((settingsLink) => (
                  <Link
                    key={settingsLink.href}
                    href={settingsLink.href}
                    onClick={onNavigate}
                    className={cn(
                      "rounded-lg px-3 py-2 text-xs font-medium text-white/60 transition hover:bg-white/10 hover:text-white",
                      pathname === "/mentor/parametres" && selectedSection === settingsLink.section && "bg-white/10 text-white",
                    )}
                  >
                    {settingsLink.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

export function MentorShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  function logout() {
    clearStoredAuth();
    router.replace("/");
  }

  return (
    <div data-no-translate className="min-h-screen bg-background lg:h-screen lg:overflow-hidden">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <BrandMark href="/mentor/dashboard" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Ouvrir le menu mentor"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu aria-hidden="true" />
            </Button>
          </div>
        </div>
      </header>

      {isMobileOpen ? (
        <div className="fixed inset-0 z-50 bg-[var(--brand-ink)] text-white lg:hidden">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <BrandMark href="/mentor/dashboard" inverse />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 hover:text-white"
              aria-label="Fermer le menu mentor"
              onClick={() => setIsMobileOpen(false)}
            >
              <X aria-hidden="true" />
            </Button>
          </div>
          <div className="grid gap-5 px-4 py-5">
            <div className="rounded-lg border border-white/10 bg-white/[0.06] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-bronze)]">
                Mentor
              </p>
            </div>
            <UserSidebarIdentity />
            <MentorNav onNavigate={() => setIsMobileOpen(false)} />
            <div className="border-t border-white/10 pt-4">
              <MentorUtilityNav onNavigate={() => setIsMobileOpen(false)} />
            </div>
            <Button type="button" onClick={logout} variant="outline" className="w-full border-white/15 bg-white/5 text-white hover:bg-white/10">
              <LogOut aria-hidden="true" />
              Deconnexion
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-[1500px] lg:h-full lg:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen overflow-y-auto overscroll-contain border-r border-white/10 bg-[var(--brand-ink)] p-4 text-white lg:block">
          <div className="flex items-start justify-between gap-3">
            <BrandMark href="/mentor/dashboard" inverse />
            <ThemeToggle className="text-white hover:bg-white/10 hover:text-white" />
          </div>

          <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.06] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-bronze)]">
              Mentor
            </p>
          </div>

          <div className="mt-4">
            <UserSidebarIdentity />
          </div>

          <div className="mt-5">
            <MentorNav />
          </div>

          <div className="mt-5 border-t border-white/10 pt-4">
            <MentorUtilityNav />
          </div>

          <div className="mt-5">
            <Button type="button" onClick={logout} variant="outline" className="w-full border-white/15 bg-white/5 text-white hover:bg-white/10">
              <LogOut aria-hidden="true" />
              Deconnexion
            </Button>
          </div>
        </aside>

        <main className="min-w-0 px-4 py-6 sm:px-6 lg:h-screen lg:overflow-y-auto lg:overscroll-contain lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
