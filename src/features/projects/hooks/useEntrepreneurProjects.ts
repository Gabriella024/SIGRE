import { useCallback } from "react";

import { useUserScopedQuery } from "@/hooks/useUserScopedQuery";

import { getProjectsByEntrepreneur } from "../services/proyectsService";

export function useEntrepreneurProjects(entrepreneurId: string) {
  const fetcher = useCallback(() => getProjectsByEntrepreneur(entrepreneurId), [entrepreneurId]);
  return useUserScopedQuery(fetcher);
}
