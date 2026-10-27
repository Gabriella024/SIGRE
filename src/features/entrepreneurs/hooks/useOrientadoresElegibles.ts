import { useUserScopedQuery } from "@/hooks/useUserScopedQuery";

import { getOrientadoresElegibles } from "../services/orientadoresService";

export function useOrientadoresElegibles() {
  return useUserScopedQuery(getOrientadoresElegibles);
}
