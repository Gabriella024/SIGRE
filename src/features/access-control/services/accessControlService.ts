import { supabase } from "@/lib/supabase";

import { buildUserAccess, isPermissionRow } from "../utils/permissionMapper";

import type { SigreAction, SigreUserAccess } from "../types/types";

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
