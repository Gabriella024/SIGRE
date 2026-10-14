import { useUserScopedQuery } from "@/hooks/useUserScopedQuery";

import { getOrientations } from "../services/orientationsService";

export function useOrientations() {
  const query = useUserScopedQuery(getOrientations);
  return { ...query, refreshOrientations: query.reload };
}
