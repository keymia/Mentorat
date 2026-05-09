import { ExternalLink, Handshake } from "lucide-react";
import Image from "next/image";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageHeader } from "@/components/PageHeader";
import { SiteHeader } from "@/components/SiteHeader";
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
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <PageHeader
        eyebrow="Partenaires"
        title="Partenaires actifs"
        description="Seuls les partenaires actifs sont affiches sur le site public."
      />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {partenaires.length === 0 ? (
          <EmptyState
            icon={Handshake}
            title="Aucun partenaire actif"
            description="Aucun partenaire actif a afficher pour le moment."
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {partenaires.map((partenaire) => (
              <Card key={partenaire.id} className="overflow-hidden">
                {partenaire.logo ? (
                  <div className="relative flex aspect-[16/9] items-center justify-center border-b border-border bg-secondary/40">
                    <Image
                      src={partenaire.logo}
                      alt={`Logo de ${partenaire.nom_partenaire}`}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-contain p-6"
                    />
                  </div>
                ) : null}
                <CardContent className="p-5">
                  <Badge variant="bronze">{partenaire.type_partenaire}</Badge>
                  <h2 className="mt-3 font-display text-xl font-bold">{partenaire.nom_partenaire}</h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{partenaire.description}</p>
                  {partenaire.site_web ? (
                    <a
                      href={partenaire.site_web}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                    >
                      Site web
                      <ExternalLink className="size-4" aria-hidden="true" />
                    </a>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
