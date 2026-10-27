import { useCallback } from "react";

import { useAdminMutation } from "@/hooks/useAdminMutation";
import { useUserScopedQuery } from "@/hooks/useUserScopedQuery";
import { AdminOperationError } from "@/lib/adminOperation";
import { MISSING_VERSION_MESSAGE } from "@/features/users/utils/userUtils";

import { SCREEN_CODES } from "../constants/screens";
import { useAccessControl } from "./useAccessControl";
import {
  asignarRolesUsuarioAdmin,
  getRolePermissions,
  getRoles,
  getScreenActions,
  guardarPermisosRolAdmin,
} from "../services/accessControlService";

import type { PermissionChange } from "../types/types";

export function useRoles() {
  return useUserScopedQuery(getRoles);
}

export function useScreenActions() {
  return useUserScopedQuery(getScreenActions);
}

export function useRolePermissions() {
  return useUserScopedQuery(getRolePermissions);
}

export function useAccessAdminPermissions() {
  const { can } = useAccessControl();
  return { canEdit: can("control_accesos", "editar", SCREEN_CODES.control_accesos) };
}

const DENIED = "No tienes autorización para modificar el control de accesos.";

export function useAccessAdminMutations() {
  const { canEdit } = useAccessAdminPermissions();

  const savePermissions = useCallback(async (roleId: number, changes: PermissionChange[]) => {
    if (changes.length === 0) throw new AdminOperationError("No hay cambios para guardar.");
    return guardarPermisosRolAdmin(roleId, changes);
  }, []);

  const assignRoles = useCallback(async (idUsuario: string, updatedAt: string | null, idsRoles: number[]) => {
    if (!updatedAt) throw new AdminOperationError(MISSING_VERSION_MESSAGE);
    if (idsRoles.length === 0) throw new AdminOperationError("El usuario debe conservar al menos un rol.");
    return asignarRolesUsuarioAdmin({ idUsuario, updatedAtEsperado: updatedAt, idsRoles });
  }, []);

  return {
    permissions: useAdminMutation(savePermissions, {
      allowed: canEdit,
      deniedMessage: DENIED,
      fallbackMessage: "No fue posible guardar los permisos.",
      backend: { name: "sigre_admin_guardar_permisos_rol", operation: "Guardar permisos del rol" },
    }),
    roles: useAdminMutation(assignRoles, {
      allowed: canEdit,
      deniedMessage: DENIED,
      fallbackMessage: "No fue posible guardar los roles del usuario.",
      backend: { name: "sigre_admin_asignar_roles_usuario", operation: "Asignar roles a usuario" },
    }),
  };
}
