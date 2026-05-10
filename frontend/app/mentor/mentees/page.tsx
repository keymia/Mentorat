import { PageHeader } from "@/components/layout/PageHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MentorMenteesList } from "@/components/mentor/mentorship/MentorMenteesList";

export default function MentorMenteesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <PageHeader eyebrow="Espace mentor" title="Mes mentores" description="Accedez aux dossiers de suivi et aux seances." />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <MentorMenteesList />
      </main>
      <SiteFooter />
    </div>
  );
}
