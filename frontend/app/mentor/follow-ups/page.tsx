import { MentorPageHeader } from "@/components/mentor/MentorPageHeader";
import { MentorFollowUpsPanel } from "@/components/mentor/mentorship/MentorFollowUpsPanel";

export default function MentorFollowUpsPage() {
  return (
    <div className="grid gap-6">
      <MentorPageHeader
        title="Suivis"
        description="Mettez à jour les séances réalisées, l'appréciation et l'avancement des mentorés."
        helpModuleKey="mentor_followups"
      />
      <MentorFollowUpsPanel />
    </div>
  );
}
