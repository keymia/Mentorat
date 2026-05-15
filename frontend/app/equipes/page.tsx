import { UsersRound } from "lucide-react";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { PageHeader } from "@/components/PageHeader";
import { PublicProfileCard } from "@/components/public/PublicProfileCard";
import { SiteHeader } from "@/components/SiteHeader";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicTeam } from "@/lib/api";
import type { TeamMember } from "@/lib/api";

export default async function EquipesPage() {
  let members: TeamMember[] = [];
  try {
    members = await getPublicTeam();
  } catch {
    members = [];
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <PageHeader
        eyebrow="Equipes"
        title="Les mentors qui accompagnent la releve"
        description="Chaque profil affiche ici a ete complete par le mentor, accepte pour diffusion publique et valide par l'administration."
      />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {members.length === 0 ? (
          <Card>
            <CardContent className="grid place-items-center gap-4 p-10 text-center">
              <UsersRound className="size-10 text-primary" aria-hidden="true" />
              <div>
                <h2 className="text-xl font-semibold">Aucun mentor public pour le moment.</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Les profils seront ajoutes apres accord des mentors et validation administrative.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {members.map((member) => (
              <PublicProfileCard
                key={member.id}
                name={member.nom_complet}
                title="Mentor BMC"
                description={member.mini_bio}
                imageUrl={member.profile_photo_url}
                badges={[member.academic_level, member.domaine_specialite]}
                minHeightClassName="min-h-[460px]"
              />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
