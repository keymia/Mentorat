import { CalendarDays, MapPin, Video } from "lucide-react";
import Image from "next/image";

import { PageHeader } from "@/components/PageHeader";
import { RevealOnScroll } from "@/components/public/RevealOnScroll";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Evenement, getPublicEvenements } from "@/lib/api";

function formatDateTime(evenement: Evenement) {
  return `${evenement.date_evenement} à ${evenement.heure_evenement?.slice(0, 5) ?? ""}`;
}

function googleMapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export default async function EvenementsPage() {
  let evenements: Evenement[] = [];
  try {
    evenements = await getPublicEvenements();
  } catch {
    evenements = [];
  }

  return (
    <>
      <PageHeader
        eyebrow="Événements"
        title="Événements du programme"
        description="Cette page publique est prête à présenter les ateliers, conférences et activités de réseautage publiés par l’API."
      />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {evenements.length === 0 ? (
          <RevealOnScroll>
            <EmptyState
              icon={CalendarDays}
              title="Aucun événement planifié"
              description="Les evenements seront listes ici lorsque l'administration les publiera avec le statut PLANIFIE."
            />
          </RevealOnScroll>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {evenements.map((evenement, index) => (
              <RevealOnScroll key={evenement.id} className="h-full" delayMs={(index % 2) * 140}>
                <Card className="public-motion-card group h-full overflow-hidden shadow-card">
                  {evenement.image ? (
                    <div className="reveal-image relative aspect-video w-full overflow-hidden border-b border-border bg-muted">
                      <Image
                        src={evenement.image}
                        alt={`Image de ${evenement.titre}`}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 1024px"
                        className="public-motion-image object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/38 via-transparent to-white/10 opacity-80 transition duration-500 group-hover:opacity-100" />
                      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(159,20,22,0.22),transparent_48%)] opacity-0 transition duration-500 group-hover:opacity-100" />
                    </div>
                  ) : null}
                  <CardContent className="grid gap-4 p-5">
                    <div className="reveal-actions flex flex-wrap items-center gap-2">
                      <Badge variant="bronze">{evenement.type_evenement}</Badge>
                      <Badge variant="success">{evenement.statut_evenement}</Badge>
                    </div>
                    <div>
                      <h2 className="reveal-title font-display text-2xl font-bold">{evenement.titre}</h2>
                      <p className="reveal-description mt-2 text-sm text-muted-foreground">{formatDateTime(evenement)}</p>
                      {evenement.lieu ? (
                        <a
                          href={googleMapsUrl(evenement.lieu)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="reveal-actions mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition hover:text-[var(--brand-red-strong)] hover:underline"
                        >
                          <MapPin className="size-4" aria-hidden="true" />
                          {evenement.lieu}
                        </a>
                      ) : (
                        <p className="reveal-description mt-1 text-sm text-muted-foreground">Lieu à confirmer</p>
                      )}
                    </div>
                    <p className="reveal-description leading-7 text-muted-foreground">
                      {evenement.description || "Aucune description pour le moment."}
                    </p>
                    {evenement.video ? (
                      <div className="reveal-actions grid gap-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-primary">
                          <Video className="size-4" aria-hidden="true" />
                          Video
                        </div>
                        <video src={evenement.video} controls className="aspect-video w-full rounded-xl bg-black shadow-card" />
                      </div>
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
