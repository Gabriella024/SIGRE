import { useAuth } from "@/features/auth/context/AuthContext";
import type { SigreAction } from "../types/types";

export function useAccessControl() {
  const {
    roles,
    permissions,
    permissionsLoading,
    permissionsError,
  } = useAuth();

  function can(
    moduleCode: string,
    action: SigreAction = "ver"
  ): boolean {
    if (permissionsLoading || permissionsError) {
      return false;
    }

    return permissions.some(
      (permission) =>
        permission.moduleCode === moduleCode &&
        permission.action === action &&
        permission.enabled
    );
  }

  return {
    roles,
    permissions,
    isLoading: permissionsLoading,
    error: permissionsError,
    can,
  };
}