import { useCallback } from "react";

import { useUserScopedQuery } from "@/hooks/useUserScopedQuery";

import { getAllEntrepreneurs } from "../services/entrepreneursService";
import { ALL_ENTREPRENEURS_SCOPE } from "../utils/entrepreneurUtils";

import type { EntrepreneurScope } from "../types/entrepreneur";

export function useEntrepreneurs(scope: EntrepreneurScope = ALL_ENTREPRENEURS_SCOPE) {
  const fetcher = useCallback(() => getAllEntrepreneurs(scope), [scope]);
  return useUserScopedQuery(fetcher);
}
