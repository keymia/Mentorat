import { PageHeader } from "@/components/layout/PageHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MentorProgressOverview } from "@/components/mentor/mentorship/MentorProgressOverview";

export default function MentorProgressPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <PageHeader eyebrow="Espace mentor" title="Avancement des mentores" description="Suivez les avis et la progression." />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <MentorProgressOverview />
      </main>
      <SiteFooter />
    </div>
  );
}
