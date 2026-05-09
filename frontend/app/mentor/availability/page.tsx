import { MentorAvailabilityManager } from "@/components/mentor/MentorAvailabilityManager";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageHeader } from "@/components/layout/PageHeader";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function MentorAvailabilityPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <PageHeader
        eyebrow="Espace mentor"
        title="Gerer mes disponibilites"
        description="Configurez vos plages hebdomadaires, vos exceptions et votre capacite. Les creneaux reservables sont generes automatiquement."
      />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <MentorAvailabilityManager />
      </main>
      <SiteFooter />
    </div>
  );
}
