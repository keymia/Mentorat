"use client";

import { LogIn, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { BrandMark } from "@/components/layout/BrandMark";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const publicLinks = [
  { href: "/", label: "Accueil" },
  { href: "/about", label: "A propos" },
  { href: "/programme", label: "Programme" },
  { href: "/inscriptions", label: "Inscriptions" },
  { href: "/evenements", label: "Evenements" },
  { href: "/partenaires", label: "Partenaires" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/88 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <BrandMark />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
          {publicLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                  isActive && "bg-secondary text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/login">
              <LogIn aria-hidden="true" />
              Connexion
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/mentor/dashboard">Espace mentor</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/inscriptions/mentore">Devenir mentore</Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={isOpen ? "Fermer le menu" : "Ouvrir le menu"}
            onClick={() => setIsOpen((current) => !current)}
          >
            {isOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </Button>
        </div>
      </div>

      {isOpen ? (
        <div className="border-t border-border bg-card px-4 py-4 shadow-card lg:hidden">
          <nav className="mx-auto grid max-w-7xl gap-1" aria-label="Navigation mobile">
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Button asChild variant="outline">
                <Link href="/admin/login" onClick={() => setIsOpen(false)}>
                  <LogIn aria-hidden="true" />
                  Connexion
                </Link>
              </Button>
              <Button asChild>
                <Link href="/mentor/dashboard" onClick={() => setIsOpen(false)}>
                  Espace mentor
                </Link>
              </Button>
              <Button asChild>
                <Link href="/inscriptions/mentore" onClick={() => setIsOpen(false)}>
                  Devenir mentore
                </Link>
              </Button>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
