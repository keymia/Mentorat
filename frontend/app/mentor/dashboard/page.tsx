import { Settings } from "lucide-react";
import Link from "next/link";

import { MentorPageHeader } from "@/components/mentor/MentorPageHeader";
import { MentorDashboardPanel } from "@/components/mentor/mentorship/MentorDashboardPanel";
import { Button } from "@/components/ui/button";

export default function MentorDashboardPage() {
  return (
    <div className="grid gap-6">
      <MentorPageHeader
        title="Tableau de bord"
        description="Affectations, seances et suivis actifs."
        actions={
          <Button asChild variant="outline">
            <Link href="/mentor/parametres">
              <Settings aria-hidden="true" />
              Parametres
            </Link>
          </Button>
        }
      />
      <MentorDashboardPanel />
    </div>
  );
}
