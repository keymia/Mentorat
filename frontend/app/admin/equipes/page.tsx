import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTeamMembers } from "@/components/admin/AdminTeamMembers";

export default function AdminEquipesPage() {
  return (
    <AdminShell>
      <AdminTeamMembers />
    </AdminShell>
  );
}
