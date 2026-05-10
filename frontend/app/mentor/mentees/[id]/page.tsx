import { PageHeader } from "@/components/layout/PageHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MentorMenteeWorkspace } from "@/components/mentor/mentorship/MentorMenteeWorkspace";

export default async function MentorMenteeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <PageHeader eyebrow="Espace mentor" title="Dossier mentore" description="Seances, commentaires et progression." />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <MentorMenteeWorkspace menteeId={Number(id)} />
      </main>
      <SiteFooter />
    </div>
  );
}
