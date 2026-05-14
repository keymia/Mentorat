import { ShieldCheck } from "lucide-react";
import { Suspense } from "react";

import { BrandMark } from "@/components/layout/BrandMark";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserSidebarIdentity } from "@/components/layout/UserSidebarIdentity";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--brand-ink)] text-white">
      <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-5 lg:grid-cols-[290px_1fr]">
        <aside className="sticky top-5 max-h-[calc(100vh-2.5rem)] overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-soft backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <BrandMark href="/admin/dashboard" inverse />
            <ThemeToggle className="text-white hover:bg-white/10 hover:text-white" />
          </div>

          <div className="mt-5">
            <UserSidebarIdentity />
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

          <Suspense fallback={null}>
            <AdminSidebarNav />
          </Suspense>
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
