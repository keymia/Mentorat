"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatApiError, getAdminCollection } from "@/lib/api";

type AdminResourcePageProps = {
  title: string;
  description: string;
  endpoint: string;
};

function normalizeRows(payload: Record<string, unknown>[] | { results?: Record<string, unknown>[] }) {
  if (Array.isArray(payload)) {
    return payload;
  }
  return payload.results ?? [];
}

export function AdminResourcePage({ title, description, endpoint }: AdminResourcePageProps) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getAdminCollection(endpoint)
      .then((payload) => {
        if (isMounted) {
          setRows(normalizeRows(payload));
        }
      })
      .catch((apiError) => {
        if (isMounted) {
          setError(formatApiError(apiError));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [endpoint]);

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {isLoading ? <Skeleton className="h-56" /> : null}
      {error ? <p className="notice error">{error}</p> : null}
      {!isLoading && !error ? (
        <Card className="overflow-hidden">
          <div className="border-b border-border bg-muted px-4 py-3 text-sm font-medium">
            {rows.length} element{rows.length > 1 ? "s" : ""}
          </div>
          <div className="max-h-[560px] overflow-auto">
            {rows.length === 0 ? (
              <div className="p-4">
                <EmptyState icon={FileText} title="Aucune donnee pour le moment." />
              </div>
            ) : (
              rows.map((row, index) => (
                <pre
                  key={String(row.id ?? index)}
                  className="border-b border-border px-4 py-3 text-xs text-muted-foreground"
                >
                  {JSON.stringify(row, null, 2)}
                </pre>
              ))
            )}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
