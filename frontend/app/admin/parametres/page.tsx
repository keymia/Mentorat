import { AdminParametres } from "@/components/admin/AdminParametres";
import { AdminShell } from "@/components/admin/AdminShell";
import { Suspense } from "react";

export default function AdminParametresPage() {
  return (
    <AdminShell>
      <Suspense fallback={null}>
        <AdminParametres />
      </Suspense>
    </AdminShell>
  );
}
