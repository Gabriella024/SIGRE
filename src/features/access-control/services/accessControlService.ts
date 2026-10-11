
import { supabase } from "@/lib/supabase";

import type {
  SigreAction,
  SigrePermission,
  SigreRole,
  SigreUserAccess,
  AccessLevel,
} from "../types/types";

type PermissionRow = {
  habilitado: boolean | null;
  nivel_acceso: string | null;
  pantalla_acciones: {
    app_acciones: { codigo: string } | null;
    app_pantallas: {
      codigo: string;
      app_modulos: { codigo: string } | null;
    } | null;
  } | null;
};

const validActions: SigreAction[] = [
  "ver",
  "crear",
  "editar",
  "eliminar",
  "exportar",
];

const validRoles: SigreRole[] = [
  "administrador",
  "coordinador",
  "orientador",
  "evaluador",
  "emprendedor",
];

const validLevels: AccessLevel[] = [
  "SA",
  "SL",
  "LE",
  "AT",
];

export async function getUserAccess(
  userId: string
): Promise<SigreUserAccess> {
  const { data: authData, error: authError } =
    await supabase.auth.getUser();

  if (authError) throw authError;

  if (!authData.user || authData.user.id !== userId) {
    throw new Error("Usuario no autorizado");
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("usuarios")
      .select("id")
      .eq("id", userId)
      .eq("estado", "activo")
      .is("deleted_at", null)
      .maybeSingle();

  if (profileError) throw profileError;

  if (!profile) {
    throw new Error("Perfil SIGRE inactivo o inexistente");
  }

  const { data: userRoles, error: rolesError } =
    await supabase
      .from("usuario_roles")
      .select(`
        id_rol_fk,
        roles:id_rol_fk (
          nombre_rol,
          estado,
          deleted_at
        )
      `)
      .eq("id_usuario_fk", userId)
      .eq("estado", "activo")
      .is("deleted_at", null);

  if (rolesError) throw rolesError;

  const activeRoles = (userRoles ?? []).flatMap((item) => {
    const relation = item.roles as unknown as {
      nombre_rol: string;
      estado: string;
      deleted_at: string | null;
    } | null;

    if (
      !relation ||
      relation.estado !== "activo" ||
      relation.deleted_at !== null ||
      !validRoles.includes(relation.nombre_rol as SigreRole)
    ) {
      return [];
    }

    return [{
      id: item.id_rol_fk,
      name: relation.nombre_rol as SigreRole,
    }];
  });

  const roleIds = [...new Set(activeRoles.map(r => r.id))];
  const roles = [...new Set(activeRoles.map(r => r.name))];

  if (roleIds.length === 0) {
    return { userId, roles: [], permissions: [] };
  }

  const { data, error } = await supabase
    .from("rol_pantalla_permisos")
    .select(`
      habilitado,
      nivel_acceso,
      pantalla_acciones:id_pantalla_accion_fk (
        app_acciones:id_accion_fk (codigo),
        app_pantallas:id_pantalla_fk (
          codigo,
          app_modulos:modulo_id (codigo)
        )
      )
    `)
    .in("id_rol_fk", roleIds)
    .eq("estado", "activo");

  if (error) throw error;

  const rows = data as unknown as PermissionRow[];
  const permissionMap = new Map<string, SigrePermission>();

  for (const row of rows) {
    if (row.habilitado !== true) continue;

    const relation = row.pantalla_acciones;
    const screen = relation?.app_pantallas;
    const moduleCode = screen?.app_modulos?.codigo;
    const action = relation?.app_acciones?.codigo;
    const level = row.nivel_acceso;

    if (
      !screen ||
      !moduleCode ||
      !action ||
      !validActions.includes(action as SigreAction) ||
      !validLevels.includes(level as AccessLevel)
    ) {
      continue;
    }

    const key = `${moduleCode}:${screen.codigo}:${action}`;

    // Se conserva el nivel de cada autorización sin
    // suponer que los niveles son intercambiables.
    const existing = permissionMap.get(key);

    if (existing && existing.accessLevel !== level) {
      throw new Error(
        `Niveles de acceso múltiples para ${key}. ` +
        "Se requiere definir su combinación."
      );
    }

    permissionMap.set(key, {
      moduleCode,
      screenCode: screen.codigo,
      action: action as SigreAction,
      enabled: true,
      accessLevel: level as AccessLevel,
    });
  }

  return {
    userId,
    roles,
    permissions: [...permissionMap.values()],
  };
}

export async function getUserPermissions(
  userId: string
): Promise<SigrePermission[]> {
  const access = await getUserAccess(userId);
  return access.permissions;
}

export async function checkPermission(
  moduleCode: string,
  action: SigreAction
): Promise<boolean> {
  const { data, error } = await supabase.rpc(
    "tiene_permiso",
    {
      p_modulo: moduleCode,
      p_accion: action,
    }
  );

  if (error) throw error;

  return data === true;
}
