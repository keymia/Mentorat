"use client";

import { CalendarClock, LayoutDashboard, LogOut, Menu, Settings, TrendingUp, UsersRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

import { BrandMark } from "@/components/layout/BrandMark";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const mentorLinks = [
  { href: "/mentor/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/mentor/mentees", label: "Mentores", icon: UsersRound },
  { href: "/mentor/sessions", label: "Seances", icon: CalendarClock },
  { href: "/mentor/progress", label: "Suivis", icon: TrendingUp },
  { href: "/mentor/parametres", label: "Parametres", icon: Settings },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/mentor/mentees") {
    return pathname === href || pathname.startsWith("/mentor/mentees/");
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

export function MentorShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  function logout() {
    window.localStorage.removeItem("mentorat_access");
    window.localStorage.removeItem("mentorat_refresh");
    document.cookie = "mentorat_access=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "mentorat_home=; path=/; max-age=0; SameSite=Lax";
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen bg-background">
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
                Espace mentor
              </p>
            </div>
            <MentorNav onNavigate={() => setIsMobileOpen(false)} />
            <Button type="button" onClick={logout} variant="outline" className="w-full border-white/15 bg-white/5 text-white hover:bg-white/10">
              <LogOut aria-hidden="true" />
              Deconnexion
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mx-auto grid max-w-[1500px] lg:min-h-screen lg:grid-cols-[290px_1fr]">
        <aside className="sticky top-0 hidden h-screen overflow-y-auto overscroll-contain border-r border-white/10 bg-[var(--brand-ink)] p-4 text-white lg:block">
          <div className="flex items-start justify-between gap-3">
            <BrandMark href="/mentor/dashboard" inverse />
            <ThemeToggle className="text-white hover:bg-white/10 hover:text-white" />
          </div>

          <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.06] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-bronze)]">
              Espace mentor
            </p>
          </div>

          <div className="mt-5">
            <MentorNav />
          </div>

          <div className="mt-5">
            <Button type="button" onClick={logout} variant="outline" className="w-full border-white/15 bg-white/5 text-white hover:bg-white/10">
              <LogOut aria-hidden="true" />
              Deconnexion
            </Button>
          </div>
        </aside>

        <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
