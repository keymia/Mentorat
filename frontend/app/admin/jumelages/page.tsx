import { AdminResourcePage } from "@/components/admin/AdminResourcePage";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminJumelagesPage() {
  return (
    <AdminShell>
      <AdminResourcePage title="Gestion jumelages" description="Affectations mentorales par periode." endpoint="/mentorship-assignments/" />
    </AdminShell>
  );
}
