import { Suspense } from "react";

import { InscriptionModalOptions } from "@/components/forms/InscriptionModalOptions";
import { PageHeader } from "@/components/PageHeader";

export default function InscriptionsPage() {
  return (
    <>
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
    </>
  );
}
