"use client";

import { Suspense, useState } from "react";
import { Menu, X } from "lucide-react";

import { AdminAccountTypeCard } from "@/components/admin/AdminAccountTypeCard";
import { AdminSidebarNav } from "@/components/admin/AdminSidebarNav";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { BrandMark } from "@/components/layout/BrandMark";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { UserSidebarIdentity } from "@/components/layout/UserSidebarIdentity";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div data-no-translate className="min-h-screen bg-[var(--brand-ink)] text-white">
      <div className="mx-auto max-w-[1500px] px-4 py-4 lg:px-4 lg:py-5">
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 shadow-soft backdrop-blur-xl lg:hidden">
          <BrandMark href="/admin/dashboard" inverse />
          <div className="flex items-center gap-2">
            <ThemeToggle className="text-white hover:bg-white/10 hover:text-white" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 hover:text-white"
              aria-label={isMobileNavOpen ? "Fermer le menu admin" : "Ouvrir le menu admin"}
              onClick={() => setIsMobileNavOpen((current) => !current)}
            >
              {isMobileNavOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[290px_1fr]">
          <div
            className={cn(
              "fixed inset-0 z-40 bg-black/55 backdrop-blur-sm transition lg:hidden",
              isMobileNavOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
            )}
            onClick={() => setIsMobileNavOpen(false)}
            aria-hidden="true"
          />

          <aside
            className={cn(
              "fixed inset-y-4 left-4 z-50 flex w-[min(88vw,320px)] flex-col rounded-2xl border border-white/10 bg-white/[0.08] p-4 shadow-soft backdrop-blur-xl transition duration-200 lg:sticky lg:top-5 lg:z-auto lg:max-h-[calc(100vh-2.5rem)] lg:w-auto lg:translate-x-0 lg:overflow-y-auto lg:overscroll-contain",
              isMobileNavOpen ? "translate-x-0" : "-translate-x-[120%]",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <BrandMark href="/admin/dashboard" inverse />
              <div className="flex items-center gap-2">
                <ThemeToggle className="text-white hover:bg-white/10 hover:text-white" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10 hover:text-white lg:hidden"
                  aria-label="Fermer le menu admin"
                  onClick={() => setIsMobileNavOpen(false)}
                >
                  <X aria-hidden="true" />
                </Button>
              </div>
            </div>

            <div className="mt-5">
              <UserSidebarIdentity />
            </div>

            <AdminAccountTypeCard />

            <Suspense fallback={null}>
              <AdminSidebarNav onNavigate={() => setIsMobileNavOpen(false)} />
            </Suspense>

            <div className="mt-5">
              <LogoutButton />
            </div>
          </aside>

          <main className="min-w-0 rounded-2xl border border-white/10 bg-background p-4 text-foreground shadow-soft sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
