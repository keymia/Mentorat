import { Alert } from "@/components/ui/alert";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageHeader } from "@/components/layout/PageHeader";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function MentoreBookingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <PageHeader
        eyebrow="Espace mentore"
        title="Reservations automatiques desactivees"
        description="Les rencontres sont maintenant programmees par le mentor dans le cadre de la periode active."
      />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Alert variant="info">
          Votre mentor vous communiquera les dates des seances. Les commentaires et suivis sont geres par le mentor et visibles par
          l&apos;administration.
        </Alert>
      </main>
      <SiteFooter />
    </div>
  );
}
