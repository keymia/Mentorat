import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ListTableHeader = {
  label: string;
  className?: string;
};

type ListTableProps = {
  title?: string;
  countLabel?: string;
  action?: ReactNode;
  headers: ListTableHeader[];
  children: ReactNode;
  emptyState?: ReactNode;
  minWidth?: number;
  footer?: ReactNode;
};

export function ListTable({
  title,
  countLabel,
  action,
  headers,
  children,
  emptyState,
  minWidth = 980,
  footer,
}: ListTableProps) {
  return (
    <Card className="overflow-hidden">
      {(title || countLabel || action) ? (
        <div className="flex flex-col gap-3 border-b border-border bg-muted/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title ? <p className="text-sm font-semibold text-foreground">{title}</p> : null}
            {countLabel ? <p className="text-xs text-muted-foreground">{countLabel}</p> : null}
          </div>
          {action ? <div className="flex items-center gap-2">{action}</div> : null}
        </div>
      ) : null}

      {emptyState ? (
        <div className="p-4">{emptyState}</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="list-table-max-five w-full text-left text-sm" style={{ minWidth }}>
              <thead className="border-b border-border bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  {headers.map((header) => (
                    <th key={header.label} className={cn("px-4 py-3", header.className)}>
                      {header.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">{children}</tbody>
            </table>
          </div>
          {footer ? <div className="border-t border-border px-4 py-3">{footer}</div> : null}
        </>
      )}
    </Card>
  );
}
