import { AdminOperationalAdmins } from "@/components/admin/AdminOperationalAdmins";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminAdministrateursPage() {
  return (
    <AdminShell>
      <AdminOperationalAdmins />
    </AdminShell>
  );
}
