import {
  BarChart3,
  CalendarDays,
  Handshake,
  Mail,
  Settings,
  ShieldCheck,
  UserCog,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

import { BrandMark } from "@/components/layout/BrandMark";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LogoutButton } from "@/components/admin/LogoutButton";

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/inscriptions", label: "Inscriptions", icon: UserRoundCheck },
  { href: "/admin/mentors", label: "Mentors", icon: UsersRound },
  { href: "/admin/mentores", label: "Mentores", icon: UserRoundCheck },
  { href: "/admin/jumelages", label: "Jumelages", icon: Handshake },
  { href: "/admin/evenements", label: "Evenements", icon: CalendarDays },
  { href: "/admin/partenaires", label: "Partenaires", icon: Handshake },
  { href: "/admin/emails", label: "Emails", icon: Mail },
  { href: "/admin/parametres", label: "Parametres", icon: Settings },
  { href: "/admin/administrateurs", label: "Administrateurs", icon: UserCog },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--brand-ink)] text-white">
      <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-5 lg:grid-cols-[290px_1fr]">
        <aside className="sticky top-5 h-fit rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-soft backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <BrandMark href="/admin/dashboard" inverse />
            <ThemeToggle className="text-white hover:bg-white/10 hover:text-white" />
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-black/15 p-3">
            <div className="flex items-center gap-2 text-[var(--brand-bronze)]">
              <ShieldCheck className="size-4" aria-hidden="true" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em]">Administration</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Gestion des inscriptions, jumelages, evenements, partenaires et parametres.
            </p>
          </div>

          <nav className="mt-5 grid gap-1 text-sm" aria-label="Navigation admin">
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                <link.icon className="size-4" aria-hidden="true" />
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-5">
            <LogoutButton />
          </div>
        </aside>
        <main className="min-w-0 rounded-2xl border border-white/10 bg-background p-5 text-foreground shadow-soft sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
