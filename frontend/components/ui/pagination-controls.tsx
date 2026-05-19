"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type PaginationControlsProps = {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
};

export function PaginationControls({ page, pageCount, onPageChange }: PaginationControlsProps) {
  if (pageCount <= 1) {
    return null;
  }

  const safePage = Math.min(Math.max(page, 1), pageCount);

  return (
    <nav className="flex flex-wrap items-center justify-end gap-2" aria-label="Pagination">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={safePage <= 1}
        onClick={() => onPageChange(safePage - 1)}
      >
        <ChevronLeft aria-hidden="true" />
        Précédent
      </Button>
      <span className="rounded-lg border border-border bg-muted px-3 py-2 text-sm font-medium text-muted-foreground">
        Page {safePage} / {pageCount}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={safePage >= pageCount}
        onClick={() => onPageChange(safePage + 1)}
      >
        Suivant
        <ChevronRight aria-hidden="true" />
      </Button>
    </nav>
  );
}
