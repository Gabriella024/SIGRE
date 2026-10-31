import { useCallback, useMemo } from "react";

import { useAuth } from "@/features/auth/context/AuthContext";
import { useAccessControl } from "@/features/access-control/hooks/useAccessControl";
import { SCREEN_CODES } from "@/features/access-control/constants/screens";

import type { Orientacion } from "../types/orientations";
import { buildOrientationCapabilities } from "../utils/orientationCapabilities";

export function useOrientationAccess() {
  const { user } = useAuth();
  const { roles, can } = useAccessControl();
  const userId = user?.id ?? null;

  const capabilities = useMemo(() => {
    const screen = SCREEN_CODES.orientaciones;
    return buildOrientationCapabilities(roles, {
      crear: can("orientaciones", "crear", screen),
      editar: can("orientaciones", "editar", screen),
    });
  }, [roles, can]);

  const isInScope = useCallback(
    (jornada: Pick<Orientacion, "idOrientador">): boolean =>
      capabilities.view === "administrador" || (userId !== null && jornada.idOrientador === userId),
    [capabilities.view, userId]
  );

  const canManageAttendanceFor = useCallback(
    (jornada: Pick<Orientacion, "idOrientador">): boolean => capabilities.manageAttendance && isInScope(jornada),
    [capabilities.manageAttendance, isInScope]
  );

  const canEnrollFor = useCallback(
    (jornada: Pick<Orientacion, "idOrientador">): boolean => capabilities.enrollEntrepreneurs && isInScope(jornada),
    [capabilities.enrollEntrepreneurs, isInScope]
  );

  const canCloseFor = useCallback(
    (jornada: Pick<Orientacion, "idOrientador">): boolean => capabilities.closeJornadas && isInScope(jornada),
    [capabilities.closeJornadas, isInScope]
  );

  return { userId, ...capabilities, canManageAttendanceFor, canEnrollFor, canCloseFor };
}
