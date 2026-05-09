import { BookingPlanner } from "@/components/mentore/BookingPlanner";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageHeader } from "@/components/layout/PageHeader";
import { SiteHeader } from "@/components/layout/SiteHeader";

export default function MentoreBookingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <PageHeader
        eyebrow="Espace mentore"
        title="Reserver une seance"
        description="Choisissez un mentor compatible avec votre niveau et reservez un creneau disponible."
      />
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <BookingPlanner />
      </main>
      <SiteFooter />
    </div>
  );
}
