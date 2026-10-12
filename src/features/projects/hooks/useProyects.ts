import { useUserScopedQuery } from "@/hooks/useUserScopedQuery";

import { getProjects } from "../services/proyectsService";

export function useProjects() {
  return useUserScopedQuery(getProjects);
}
