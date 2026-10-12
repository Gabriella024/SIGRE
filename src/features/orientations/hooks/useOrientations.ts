import { useUserScopedQuery } from "@/hooks/useUserScopedQuery";

import { getOrientations } from "../services/orientationsService";

export function useOrientations() {
  return useUserScopedQuery(getOrientations);
}
