"use client";

import { useMemo, useState } from "react";

export function usePagination<T>(items: T[], pageSize = 10) {
  const [rawPage, setRawPage] = useState(1);

  const pageCount = Math.max(Math.ceil(items.length / pageSize), 1);
  const page = Math.min(rawPage, pageCount);

  const visibleItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize],
  );

  return {
    page,
    setPage: (nextPage: number) => setRawPage(Math.max(1, nextPage)),
    pageCount,
    visibleItems,
  };
}
