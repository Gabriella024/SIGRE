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

export function buildOrientationCapabilities(
  roles: readonly SigreRole[],
  permisos: { crear: boolean; editar: boolean }
): OrientationCapabilities {
  const view = resolveOrientationView(roles);
  const isAdmin = view === "administrador";
  const manageAssigned = isAdmin || (view === "orientador" && permisos.editar);

  return {
    view,
    createJornada: isAdmin && permisos.crear,
    editJornada: isAdmin && permisos.editar,
    assignOrientador: isAdmin && permisos.editar,
    closeJornadas: manageAssigned,
    manageAttendance: manageAssigned,
    enrollEntrepreneurs: manageAssigned,
    registerManualAttendee: false,
    exportOwnReport: false,
    enroll: view === "emprendedor",
  };
}
