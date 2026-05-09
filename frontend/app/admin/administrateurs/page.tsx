import { AdminResourcePage } from "@/components/admin/AdminResourcePage";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminAdministrateursPage() {
  return (
    <AdminShell>
      <AdminResourcePage
        title="Administrateurs operationnels"
        description="Cette section doit etre utilisee par ADMIN_PRINCIPAL; le backend bloque la creation d'administrateurs par ADMIN_OPERATIONNEL."
        endpoint="/users/?role_nom=ADMIN_OPERATIONNEL"
      />
    </AdminShell>
  );
}
