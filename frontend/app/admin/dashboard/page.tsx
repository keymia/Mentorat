import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminShell } from "@/components/admin/AdminShell";
import { HelpIconButton } from "@/components/help/HelpIconButton";

export default function AdminDashboardPage() {
  return (
    <AdminShell>
      <div className="grid gap-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-bold">Dashboard</h1>
            <HelpIconButton moduleKey="dashboard" scope="admin" />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Vue d&apos;ensemble du programme BMC Mentorat.</p>
        </div>
        <AdminDashboard />
      </div>
    </AdminShell>
  );
}
