import { PageHeader } from "@/components/layout/PageHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MentorDashboardPanel } from "@/components/mentor/mentorship/MentorDashboardPanel";

export default function MentorDashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <PageHeader eyebrow="Espace mentor" title="Tableau de bord" description="Vue d'ensemble de vos mentores et seances." />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <MentorDashboardPanel />
      </main>
      <SiteFooter />
    </div>
  );
}
