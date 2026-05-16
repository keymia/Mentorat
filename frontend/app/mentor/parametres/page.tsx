import { Suspense } from "react";

import { MentorPageHeader } from "@/components/mentor/MentorPageHeader";
import { MentorSettingsPanel } from "@/components/mentor/MentorSettingsPanel";
import { Skeleton } from "@/components/ui/skeleton";

export default function MentorSettingsPage() {
  return (
    <div className="grid gap-6">
      <MentorPageHeader
        title="Paramètres"
        description="Compte, profil Équipes et session de mentorat."
        helpModuleKey="mentor_settings"
      />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <MentorSettingsPanel />
      </Suspense>
    </div>
  );
}
