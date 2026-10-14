import { useMemo } from "react";

import { useAuth } from "@/features/auth/context/AuthContext";
import { useAccessControl } from "@/features/access-control/hooks/useAccessControl";
import { SCREEN_CODES } from "@/features/access-control/constants/screens";
import type { SigreRole } from "@/features/access-control/types/types";

import type { OrientationCapabilities, OrientationRoleView } from "../types/orientations";

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

  const capabilities = useMemo<OrientationCapabilities>(() => {
    const view = resolveOrientationView(roles);
    const isAdmin = view === "administrador";
    const screen = SCREEN_CODES.orientaciones;

    return {
      view,
      createJornada: isAdmin && can("orientaciones", "crear", screen),
      editJornada: isAdmin && can("orientaciones", "editar", screen),
      assignOrientador: false,
      closeJornadas: false,
      manageAttendance: false,
      registerManualAttendee: false,
      exportOwnReport: false,
      enroll: false,
    };
  }, [roles, can]);

  return { userId: user?.id ?? null, ...capabilities };
}
