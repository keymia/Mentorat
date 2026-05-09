import { CalendarDays, Video } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Evenement, getPublicEvenements } from "@/lib/api";
import Image from "next/image";

function formatDateTime(evenement: Evenement) {
  return `${evenement.date_evenement} a ${evenement.heure_evenement?.slice(0, 5) ?? ""}`;
}

export default async function EvenementsPage() {
  let evenements: Evenement[] = [];
  try {
    evenements = await getPublicEvenements();
  } catch {
    evenements = [];
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <PageHeader
        eyebrow="Evenements"
        title="Evenements du programme"
        description="Cette page publique est prete a recevoir les ateliers, conferences et activites de reseautage exposes par l'API."
      />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {evenements.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="Aucun evenement planifie"
            description="Les evenements seront listes ici lorsque l'administration les publiera avec le statut PLANIFIE."
          />
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {evenements.map((evenement) => (
              <Card key={evenement.id} className="overflow-hidden">
                {evenement.image ? (
                  <div className="relative aspect-video w-full overflow-hidden border-b border-border">
                    <Image
                      src={evenement.image}
                      alt={`Image de ${evenement.titre}`}
                      fill
                      unoptimized
                      sizes="(max-width: 768px) 100vw, 1024px"
                      className="object-cover"
                    />
                  </div>
                ) : null}
                <CardContent className="grid gap-4 p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="bronze">{evenement.type_evenement}</Badge>
                    <Badge variant="success">{evenement.statut_evenement}</Badge>
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-bold">{evenement.titre}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">{formatDateTime(evenement)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{evenement.lieu || "Lieu a confirmer"}</p>
                  </div>
                  <p className="leading-7 text-muted-foreground">
                    {evenement.description || "Aucune description pour le moment."}
                  </p>
                  {evenement.video ? (
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-primary">
                        <Video className="size-4" aria-hidden="true" />
                        Video
                      </div>
                      <video src={evenement.video} controls className="aspect-video w-full rounded-xl bg-black" />
                    </div>
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
