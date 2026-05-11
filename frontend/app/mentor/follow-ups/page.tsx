import { MentorPageHeader } from "@/components/mentor/MentorPageHeader";
import { MentorFollowUpsPanel } from "@/components/mentor/mentorship/MentorFollowUpsPanel";

export default function MentorFollowUpsPage() {
  return (
    <div className="grid gap-6">
      <MentorPageHeader
        title="Suivis"
        description="Mettez a jour les seances realisees, l'appreciation et l'avancement des mentores."
      />
      <MentorFollowUpsPanel />
    </div>
  );
}
