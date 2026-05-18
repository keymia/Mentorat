import { AdminParametres } from "@/components/admin/AdminParametres";
import { Suspense } from "react";

export default function AdminParametresPage() {
  return (
    <Suspense fallback={null}>
      <AdminParametres />
    </Suspense>
  );
}
