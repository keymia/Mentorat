import { PageHeader } from "@/components/layout/PageHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MentorSessionsList } from "@/components/mentor/mentorship/MentorSessionsList";

export default function MentorSessionsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <PageHeader eyebrow="Espace mentor" title="Mes seances" description="Retrouvez les rencontres programmees et realisees." />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <MentorSessionsList />
      </main>
      <SiteFooter />
    </div>
  );
}
