import { ExternalLink, Handshake } from "lucide-react";
import Image from "next/image";

import { PageHeader } from "@/components/PageHeader";
import { RevealOnScroll } from "@/components/public/RevealOnScroll";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Partenaire, getPublicPartenaires } from "@/lib/api";

export default async function PartenairesPage() {
  let partenaires: Partenaire[] = [];
  try {
    partenaires = await getPublicPartenaires();
  } catch {
    partenaires = [];
  }

  return (
    <>
      <PageHeader
        eyebrow="Partenaires"
        title="Partenaires actifs"
        description="Seuls les partenaires actifs sont affichés sur le site public."
      />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {partenaires.length === 0 ? (
          <RevealOnScroll>
            <EmptyState
              icon={Handshake}
              title="Aucun partenaire actif"
              description="Aucun partenaire actif à afficher pour le moment."
            />
          </RevealOnScroll>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {partenaires.map((partenaire, index) => (
              <RevealOnScroll key={partenaire.id} className="h-full" delayMs={(index % 3) * 140}>
                <Card className="public-motion-card group h-full overflow-hidden shadow-card">
                  {partenaire.logo ? (
                    <div className="reveal-image relative flex aspect-[16/9] items-center justify-center overflow-hidden border-b border-border bg-secondary/40">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(183,131,75,0.18),transparent_44%)] opacity-80 transition duration-500 group-hover:opacity-100" />
                      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(159,20,22,0.16),transparent_52%)] opacity-0 transition duration-500 group-hover:opacity-100" />
                      <Image
                        src={partenaire.logo}
                        alt={`Logo de ${partenaire.nom_partenaire}`}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="public-motion-image object-contain p-6"
                      />
                    </div>
                  ) : null}
                  <CardContent className="p-5">
                    <Badge variant="bronze" className="reveal-actions">{partenaire.type_partenaire}</Badge>
                    <h2 className="reveal-title mt-3 font-display text-xl font-bold">{partenaire.nom_partenaire}</h2>
                    <p className="reveal-description mt-3 text-sm leading-6 text-muted-foreground">{partenaire.description}</p>
                    {partenaire.site_web ? (
                      <a
                        href={partenaire.site_web}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="reveal-actions mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-[var(--brand-red-strong)] hover:underline"
                      >
                        Site web
                        <ExternalLink className="size-4" aria-hidden="true" />
                      </a>
                    ) : null}
                  </CardContent>
                </Card>
              </RevealOnScroll>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
