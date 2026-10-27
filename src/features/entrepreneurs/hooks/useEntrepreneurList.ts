import { useDeferredValue, useMemo } from "react";

import { slicePage } from "@/lib/pagination";

import {
  ENTREPRENEUR_PAGE_SIZE,
  filterEntrepreneurs,
  sortEntrepreneurs,
} from "../utils/entrepreneurUtils";

import type { Entrepreneur, EntrepreneurFilters, EntrepreneurSort } from "../types/entrepreneur";

interface EntrepreneurListOptions {
  filters: EntrepreneurFilters;
  sort: EntrepreneurSort;
  page: number;
  pageSize?: number;
}

export function useEntrepreneurList(
  rows: readonly Entrepreneur[],
  { filters, sort, page, pageSize = ENTREPRENEUR_PAGE_SIZE }: EntrepreneurListOptions
) {
  const deferredFilters = useDeferredValue(filters);

  const ordered = useMemo(
    () => sortEntrepreneurs(filterEntrepreneurs(rows, deferredFilters), sort),
    [rows, deferredFilters, sort]
  );

  return useMemo(() => slicePage(ordered, page, pageSize), [ordered, page, pageSize]);
}
