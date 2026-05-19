import type { ReactNode } from "react";
import { Suspense } from "react";

import { AdminRouteShell } from "@/components/admin/AdminRouteShell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <AdminRouteShell>{children}</AdminRouteShell>
    </Suspense>
  );
}
