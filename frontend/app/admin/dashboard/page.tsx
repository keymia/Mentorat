import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { HelpIconButton } from "@/components/help/HelpIconButton";

export default function AdminDashboardPage() {
  return (
    <div className="grid gap-5">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-3xl font-bold">Dashboard</h1>
          <HelpIconButton moduleKey="dashboard" scope="admin" />
        </div>
      </div>
      <AdminDashboard />
    </div>
  );
}
