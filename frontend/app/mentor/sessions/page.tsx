import { MentorPageHeader } from "@/components/mentor/MentorPageHeader";
import { MentorSessionsList } from "@/components/mentor/mentorship/MentorSessionsList";

export default function MentorSessionsPage() {
  return (
    <div className="grid gap-6">
      <MentorPageHeader
        title="Mes séances"
        description="Rencontres programmées, réalisées et à mettre à jour."
        helpModuleKey="mentor_sessions"
      />
      <MentorSessionsList />
    </div>
  );
}
