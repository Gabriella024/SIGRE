
import { useAuth } from "@/features/auth/context/AuthContext";

import type {
  SigreAction,
  AccessLevel,
} from "../types/types";

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

  function getAccessLevel(
    moduleCode: string,
    action: SigreAction = "ver"
  ): AccessLevel | null {
    if (!can(moduleCode, action)) return null;

    return (
      permissions.find(
        (permission) =>
          permission.moduleCode === moduleCode &&
          permission.action === action &&
          permission.enabled
      )?.accessLevel ?? null
    );
  }

  function hasRole(role: string): boolean {
    if (permissionsLoading || permissionsError) {
      return false;
    }

    return roles.some((item) => item === role);
  }

  return {
    roles,
    permissions,
    isLoading: permissionsLoading,
    error: permissionsError,
    can,
    getAccessLevel,
    hasRole,
  };
}
