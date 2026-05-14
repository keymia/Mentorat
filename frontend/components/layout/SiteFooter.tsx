import Link from "next/link";

import { BrandMark } from "@/components/layout/BrandMark";

const footerLinks = [
  { href: "/equipes", label: "Equipes" },
  { href: "/inscriptions", label: "Inscriptions" },
  { href: "/evenements", label: "Evenements" },
  { href: "/partenaires", label: "Partenaires" },
  { href: "/contact", label: "Contact" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_auto]">
        <div className="max-w-xl">
          <BrandMark href="/" />
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Une plateforme de mentorat academique inspiree par l&apos;excellence, le soutien et la communaute.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-muted-foreground">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-primary">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
