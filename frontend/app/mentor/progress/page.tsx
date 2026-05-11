import { MentorPageHeader } from "@/components/mentor/MentorPageHeader";
import { MentorProgressOverview } from "@/components/mentor/mentorship/MentorProgressOverview";

export default function MentorProgressPage() {
  return (
    <div className="grid gap-6">
      <MentorPageHeader title="Suivis" description="Avancement, avis et recommandations par mentore." />
      <MentorProgressOverview />
    </div>
  );
}
