"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { ListTable } from "@/components/ui/list-table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Skeleton } from "@/components/ui/skeleton";
import { usePagination } from "@/hooks/usePagination";
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
  const { page, setPage, pageCount, visibleItems: visibleRows } = usePagination(rows, 8);

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
        <ListTable
          title="Liste des données"
          countLabel={`${rows.length} element${rows.length > 1 ? "s" : ""}`}
          minWidth={880}
          footer={pageCount > 1 ? <PaginationControls page={page} pageCount={pageCount} onPageChange={setPage} /> : null}
          headers={[
            { label: "Element" },
            { label: "Données" },
          ]}
          emptyState={rows.length === 0 ? <EmptyState icon={FileText} title="Aucune donnee pour le moment." /> : null}
        >
          {visibleRows.map((row, index) => (
            <tr key={String(row.id ?? (page - 1) * 8 + index)} className="align-top">
              <td className="px-4 py-3 font-medium text-foreground">#{String(row.id ?? (page - 1) * 8 + index + 1)}</td>
              <td className="px-4 py-3">
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
                  {JSON.stringify(row, null, 2)}
                </pre>
              </td>
            </tr>
          ))}
        </ListTable>
      ) : null}
    </div>
  );
}
