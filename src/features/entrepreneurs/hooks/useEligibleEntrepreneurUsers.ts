import { useUserScopedQuery } from "@/hooks/useUserScopedQuery";

import { getEligibleEntrepreneurUsers } from "../services/eligibleUsersService";

export function useEligibleEntrepreneurUsers() {
  return useUserScopedQuery(getEligibleEntrepreneurUsers);
}
