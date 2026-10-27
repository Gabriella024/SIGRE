import { useCallback } from "react";

import { useUserScopedQuery } from "@/hooks/useUserScopedQuery";

import { getOrientationHistoryByEntrepreneur } from "../services/entrepreneurHistoryService";

export function useEntrepreneurOrientationHistory(entrepreneurId: string) {
  const fetcher = useCallback(() => getOrientationHistoryByEntrepreneur(entrepreneurId), [entrepreneurId]);
  return useUserScopedQuery(fetcher);
}
