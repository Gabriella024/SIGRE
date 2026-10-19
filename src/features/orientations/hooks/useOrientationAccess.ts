import { useCallback, useMemo } from "react";

import { useAuth } from "@/features/auth/context/AuthContext";
import { useAccessControl } from "@/features/access-control/hooks/useAccessControl";
import { SCREEN_CODES } from "@/features/access-control/constants/screens";
import type { SigreRole } from "@/features/access-control/types/types";

import type { Orientacion, OrientationCapabilities, OrientationRoleView } from "../types/orientations";

const VIEW_PRECEDENCE: readonly OrientationRoleView[] = [
  "administrador",
  "coordinador",
  "orientador",
  "emprendedor",
];

export function resolveOrientationView(roles: readonly SigreRole[]): OrientationRoleView | null {
  return VIEW_PRECEDENCE.find((view) => roles.includes(view)) ?? null;
}

export function useOrientationAccess() {
  const { user } = useAuth();
  const { roles, can } = useAccessControl();
  const userId = user?.id ?? null;

  const capabilities = useMemo<OrientationCapabilities>(() => {
    const view = resolveOrientationView(roles);
    const isAdmin = view === "administrador";
    const screen = SCREEN_CODES.orientaciones;
    const canEdit = can("orientaciones", "editar", screen);
    const manageAssigned = isAdmin || (view === "orientador" && canEdit);

    return {
      view,
      createJornada: isAdmin && can("orientaciones", "crear", screen),
      editJornada: isAdmin && canEdit,
      assignOrientador: false,
      closeJornadas: false,
      manageAttendance: manageAssigned,
      enrollEntrepreneurs: manageAssigned,
      registerManualAttendee: false,
      exportOwnReport: false,
      enroll: false,
    };
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

  return { userId, ...capabilities, canManageAttendanceFor, canEnrollFor };
}
