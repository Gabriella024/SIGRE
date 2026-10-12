import { useUserScopedQuery } from "@/hooks/useUserScopedQuery";

import { getEntrepreneurs } from "../services/entrepreneursService";

export function useEntrepreneurs() {
  return useUserScopedQuery(getEntrepreneurs);
}
