import { useUserScopedQuery } from "@/hooks/useUserScopedQuery";

import { getActiveCentrosSena } from "../services/centrosSenaService";

export function useCentrosSena() {
  return useUserScopedQuery(getActiveCentrosSena);
}
