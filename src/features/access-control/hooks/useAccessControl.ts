import { useCallback, useMemo } from "react";

import { useAuth } from "@/features/auth/context/AuthContext";
import { MODULE_ROUTES } from "@/app/router/moduleRoutes";

import type {
  AccessLevel,
  SigreAction,
  SigrePermission,
} from "../types/types";

function isAllowed(
  permissions: SigrePermission[],
  moduleCode: string,
  action: SigreAction,
  screenCode?: string
): boolean {
  const moduleGrants = permissions.filter(
    (permission) => permission.moduleCode === moduleCode
  );

  if (screenCode) {
    return moduleGrants.some(
      (permission) =>
        permission.screenCode === screenCode &&
        permission.action === action
    );
  }

  if (action === "ver") {
    return moduleGrants.some((permission) => permission.action === "ver");
  }

  const visibleScreens = new Set(
    moduleGrants
      .filter((permission) => permission.action === "ver")
      .map((permission) => permission.screenCode)
  );

  if (visibleScreens.size === 0) return false;

  return [...visibleScreens].every((screen) =>
    moduleGrants.some(
      (permission) =>
        permission.screenCode === screen &&
        permission.action === action
    )
  );
}

export function useAccessControl() {
  const {
    roles,
    permissions,
    permissionDifferences,
    permissionsLoading,
    permissionsError,
    refreshPermissions,
  } = useAuth();

  const ready = !permissionsLoading && !permissionsError;

  const can = useCallback(
    (
      moduleCode: string,
      action: SigreAction = "ver",
      screenCode?: string
    ): boolean =>
      ready && isAllowed(permissions, moduleCode, action, screenCode),
    [ready, permissions]
  );

  const getAccessLevel = useCallback(
    (
      moduleCode: string,
      action: SigreAction = "ver",
      screenCode?: string
    ): AccessLevel | null => {
      if (!can(moduleCode, action, screenCode)) return null;

      const levels = new Set(
        permissions
          .filter(
            (permission) =>
              permission.moduleCode === moduleCode &&
              permission.action === action &&
              (!screenCode || permission.screenCode === screenCode)
          )
          .flatMap((permission) => permission.accessLevels)
      );

      return levels.size === 1 ? [...levels][0] : null;
    },
    [can, permissions]
  );

  const authorize = useCallback(
    <T extends (...args: never[]) => unknown>(
      moduleCode: string,
      action: SigreAction,
      handler: T | undefined,
      screenCode?: string
    ): T | undefined =>
      handler && can(moduleCode, action, screenCode) ? handler : undefined,
    [can]
  );

  const hasRole = useCallback(
    (role: string): boolean => ready && roles.some((item) => item === role),
    [ready, roles]
  );

  const firstAllowedPath = useMemo(
    () =>
      MODULE_ROUTES.find((route) =>
        can(route.moduleCode, "ver", route.screenCode)
      )?.path ??
      null,
    [can]
  );

  return {
    roles,
    permissions,
    differences: permissionDifferences,
    isLoading: permissionsLoading,
    error: permissionsError,
    can,
    getAccessLevel,
    authorize,
    hasRole,
    firstAllowedPath,
    refreshPermissions,
  };
}
