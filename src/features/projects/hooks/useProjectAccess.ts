import { useMemo } from "react";

import { useAccessControl } from "@/features/access-control/hooks/useAccessControl";
import { SCREEN_CODES } from "@/features/access-control/constants/screens";
import type { SigreRole } from "@/features/access-control/types/types";

import type {
  ProjectCapabilities,
  ProjectEntrepreneurScope,
  ProjectRoleView,
} from "../types/proyect";

const VIEW_PRECEDENCE: readonly ProjectRoleView[] = [
  "administrador",
  "coordinador",
  "orientador",
  "emprendedor",
  "evaluador",
];

export function resolveProjectView(roles: readonly SigreRole[]): ProjectRoleView | null {
  return VIEW_PRECEDENCE.find((view) => roles.includes(view)) ?? null;
}

function resolveEntrepreneurScope(roles: readonly SigreRole[]): ProjectEntrepreneurScope | null {
  if (roles.includes("administrador")) return "all";
  if (roles.includes("orientador")) return "assigned";
  if (roles.includes("emprendedor")) return "own";
  return null;
}

export function useProjectAccess(): ProjectCapabilities {
  const { roles, can } = useAccessControl();

  return useMemo<ProjectCapabilities>(() => {
    const screen = SCREEN_CODES.proyectos;
    const canCreate = can("proyectos", "crear", screen);
    const canEdit = can("proyectos", "editar", screen);
    const canDelete = can("proyectos", "eliminar", screen);
    const managesObservations = roles.includes("administrador") || roles.includes("orientador");
    const view = resolveProjectView(roles);
    const canManage = view === "administrador";
    const granted = [
      canCreate && "crear",
      canEdit && "editar",
      canDelete && "eliminar",
    ].filter((action): action is string => Boolean(action));

    return {
      view,
      canManage,
      grantedWithoutBackend: canManage ? [] : granted,
      canCreate,
      canEdit,
      canDelete,
      canManageObservations: managesObservations && (canCreate || canEdit),
      entrepreneurScope: canCreate ? resolveEntrepreneurScope(roles) : null,
    };
  }, [roles, can]);
}
