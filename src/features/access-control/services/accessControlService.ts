import { z } from "zod";

import { supabase } from "@/lib/supabase";
import { fetchAllPagesWithRetry, type PageResult } from "@/lib/pagination";
import { parseOperationId, toAdminOperationError, toQueryError } from "@/lib/adminOperation";
import { assertBackendAvailable } from "@/lib/backendContract";

import {
  PANTALLA_ACCION_COLUMNS,
  ROL_COLUMNS,
  ROL_PERMISO_COLUMNS,
  pantallaAccionRowSchema,
  rolPermisoRowSchema,
  rolRowSchema,
} from "../schemas/accessControlSchema";
import { buildUserAccess, isPermissionRow } from "../utils/permissionMapper";
import { toAccessRole, toRolePermissionEntry, toScreenActionEntries } from "../utils/accessControlUtils";

import type {
  AccessRole,
  AsignarRolesUsuarioInput,
  PermissionChange,
  RolePermissionEntry,
  ScreenActionEntry,
  SigreAction,
  SigreUserAccess,
} from "../types/types";

export async function getMyAccess(): Promise<SigreUserAccess> {
  const { data, error } = await supabase.rpc("obtener_mis_permisos");

  if (error) throw new Error(error.message);

  if (!Array.isArray(data) || !data.every(isPermissionRow)) {
    throw new Error("Respuesta de permisos con formato inválido");
  }

  return buildUserAccess(data);
}

export async function checkPermission(
  moduleCode: string,
  action: SigreAction
): Promise<boolean> {
  const { data, error } = await supabase.rpc("tiene_permiso", {
    p_modulo: moduleCode,
    p_accion: action,
  });

  if (error) throw error;

  return data === true;
}

export async function getRoles(): Promise<AccessRole[]> {
  const { data, error } = await supabase.from("roles").select(ROL_COLUMNS).order("nombre_rol", { ascending: true });

  if (error) throw toQueryError(error, "los roles");

  const parsed = z.array(rolRowSchema).safeParse(data);
  if (!parsed.success) throw new Error("La respuesta de roles no tiene el formato esperado.");

  return parsed.data.map(toAccessRole);
}

export async function getScreenActions(): Promise<ScreenActionEntry[]> {
  const { data, error } = await supabase.from("pantalla_acciones").select(PANTALLA_ACCION_COLUMNS);

  if (error) throw toQueryError(error, "las pantallas y acciones");

  const parsed = z.array(pantallaAccionRowSchema).safeParse(data);
  if (!parsed.success) throw new Error("La respuesta de pantallas y acciones no tiene el formato esperado.");

  return toScreenActionEntries(parsed.data);
}

async function getRolePermissionsPage(from: number, to: number): Promise<PageResult<RolePermissionEntry>> {
  const { data, error, count } = await supabase
    .from("rol_pantalla_permisos")
    .select(ROL_PERMISO_COLUMNS, { count: "exact" })
    .order("id", { ascending: true })
    .range(from, to);

  if (error) throw toQueryError(error, "los permisos por rol");

  const parsed = z.array(rolPermisoRowSchema).safeParse(data);
  if (!parsed.success) throw new Error("La respuesta de permisos por rol no tiene el formato esperado.");

  return { rows: parsed.data.map(toRolePermissionEntry), total: count };
}

export function getRolePermissions(): Promise<RolePermissionEntry[]> {
  return fetchAllPagesWithRetry(getRolePermissionsPage);
}

export async function guardarPermisosRolAdmin(roleId: number, changes: PermissionChange[]): Promise<string> {
  const operation = "Guardar permisos del rol";
  assertBackendAvailable({ name: "sigre_admin_guardar_permisos_rol", operation });

  const { data, error } = await supabase.rpc("sigre_admin_guardar_permisos_rol", {
    p_id_rol: roleId,
    p_permisos: changes.map((change) => ({
      id_pantalla_accion: change.screenActionId,
      nivel_acceso: change.level,
    })),
  });

  if (error) {
    throw toAdminOperationError(error, {
      operation,
      denied: "No tienes autorización para modificar permisos.",
      notFound: "El rol o una de las pantallas ya no existe. Recarga la matriz.",
      invalid: "La matriz de permisos contiene niveles no válidos o deja al sistema sin administración.",
      fallback: "No fue posible guardar los permisos. Inténtalo nuevamente más tarde.",
    });
  }

  return parseOperationId(data, operation);
}

export async function asignarRolesUsuarioAdmin(input: AsignarRolesUsuarioInput): Promise<string> {
  const operation = "Asignar roles a usuario";
  assertBackendAvailable({ name: "sigre_admin_asignar_roles_usuario", operation });

  const { data, error } = await supabase.rpc("sigre_admin_asignar_roles_usuario", {
    p_id_usuario: input.idUsuario,
    p_updated_at_esperado: input.updatedAtEsperado,
    p_ids_roles: input.idsRoles,
  });

  if (error) {
    throw toAdminOperationError(error, {
      operation,
      denied: "No tienes autorización para asignar roles.",
      notFound: "El usuario no existe o fue eliminado. Recarga el listado.",
      invalid: "La asignación no es válida: el usuario debe conservar al menos un rol y no puedes quitarte tu propio rol de administrador.",
      reference: "Uno de los roles seleccionados no es válido.",
      fallback: "No fue posible guardar los roles del usuario. Inténtalo nuevamente más tarde.",
    });
  }

  return parseOperationId(data, operation);
}
