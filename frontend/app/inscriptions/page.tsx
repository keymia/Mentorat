import { Suspense } from "react";

import { InscriptionModalOptions } from "@/components/forms/InscriptionModalOptions";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageHeader } from "@/components/PageHeader";
import { SiteHeader } from "@/components/SiteHeader";

export default function InscriptionsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <PageHeader
        eyebrow="Inscriptions"
        title="Choisir le bon formulaire"
        description="Les inscriptions sont créées avec le statut « en attente », puis validées par l’administration."
      />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <Suspense fallback={null}>
          <InscriptionModalOptions />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
