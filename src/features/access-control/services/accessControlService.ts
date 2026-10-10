import { supabase } from "@/lib/supabase";

import type {
  SigreAction,
  SigrePermission,
} from "../types/types";

type PermissionRow = {
  habilitado: boolean | null;
  nivel_acceso: string | null;
  pantalla_acciones: {
    app_acciones: {
      codigo: string;
    } | null;
    app_pantallas: {
      codigo: string;
      app_modulos: {
        codigo: string;
      } | null;
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

export async function getUserPermissions(
  userId: string
): Promise<SigrePermission[]> {

  const { data: userRoles, error: rolesError } =
    await supabase
      .from("usuario_roles")
      .select("id_rol_fk")
      .eq("id_usuario_fk", userId)
      .eq("estado", "activo")
      .is("deleted_at", null);

  if (rolesError) {
    throw rolesError;
  }

  const roleIds = (userRoles ?? []).map(
    (role) => role.id_rol_fk
  );

  if (roleIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("rol_pantalla_permisos")
    .select(`
      habilitado,
      nivel_acceso,
      pantalla_acciones:id_pantalla_accion_fk (
        app_acciones:id_accion_fk (
          codigo
        ),
        app_pantallas:id_pantalla_fk (
          codigo,
          app_modulos:modulo_id (
            codigo
          )
        )
      )
    `)
    .in("id_rol_fk", roleIds)
    .eq("estado", "activo");

  if (error) {
    throw error;
  }

  const rows = data as unknown as PermissionRow[];

  return rows.flatMap((row) => {
    const relation = row.pantalla_acciones;
    const screen = relation?.app_pantallas;
    const action = relation?.app_acciones?.codigo;

    if (
      !screen ||
      !screen.app_modulos ||
      !action ||
      !validActions.includes(action as SigreAction)
    ) {
      return [];
    }

    const level = row.nivel_acceso;

    if (
      level !== "SA" &&
      level !== "SL" &&
      level !== "LE" &&
      level !== "AT"
    ) {
      return [];
    }

    return [{
      moduleCode: screen.app_modulos.codigo,
      screenCode: screen.codigo,
      action: action as SigreAction,
      enabled: row.habilitado === true,
      accessLevel: level,
    }];
  });
}