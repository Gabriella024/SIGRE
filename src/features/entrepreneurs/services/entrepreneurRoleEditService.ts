import { supabase } from "@/lib/supabase";

import {
  orientadorEntrepreneurEditInputSchema,
  ownEntrepreneurEditInputSchema,
  roleEditResultSchema,
} from "../schemas/entrepreneursSchema";
import { isNetworkError, NETWORK_ERROR_MESSAGE, type DbError } from "../utils/dbError";
import { EntrepreneurMutationError } from "./entrepreneursService";

import type {
  EntrepreneurEditorRole,
  OrientadorEntrepreneurEditInput,
  OwnEntrepreneurEditInput,
} from "../types/entrepreneur";

export const ROLE_EDIT_RPC_AVAILABLE: Record<EntrepreneurEditorRole, boolean> = {
  orientador: true,
  emprendedor: true,
};

export const ROLE_EDIT_UNAVAILABLE_MESSAGE =
  "El guardado de estos cambios aún no está habilitado: falta la función segura en la base de datos. No se envió ninguna solicitud.";

function assertValid<T>(result: { success: true; data: T } | { success: false; error: { issues: { message: string }[] } }): T {
  if (!result.success) {
    throw new EntrepreneurMutationError(result.error.issues[0]?.message ?? "Los datos del emprendedor no son válidos.");
  }
  return result.data;
}

function toRoleEditError(error: DbError, scopeMessage: string): EntrepreneurMutationError {
  if (isNetworkError(error)) return new EntrepreneurMutationError(NETWORK_ERROR_MESSAGE);

  switch (error.code) {
    case "42501":
      return new EntrepreneurMutationError(scopeMessage);
    case "P0002":
      return new EntrepreneurMutationError(
        "El emprendedor no existe o fue eliminado. Recarga la ficha para ver su estado actual.",
        "registro"
      );
    case "40001":
      return new EntrepreneurMutationError(
        "Otra persona modificó esta ficha después de que abriste el formulario. Recarga la ficha para ver la versión actual antes de volver a editar.",
        null,
        true
      );
    case "22023":
      return new EntrepreneurMutationError(
        "Los datos enviados no son válidos o no hay cambios para guardar. Revisa la información e inténtalo nuevamente."
      );
    case "23514":
      return new EntrepreneurMutationError(
        "Los cambios no cumplen las reglas de la base de datos o el emprendedor no está activo. Revisa la información o contacta al administrador.",
        "estado"
      );
    case "PGRST202":
      return new EntrepreneurMutationError(
        "La función de edición no está disponible en este momento. Inténtalo más tarde."
      );
    default:
      return new EntrepreneurMutationError("No fue posible guardar los cambios. Inténtalo nuevamente más tarde.");
  }
}

function parseResult(data: unknown): string {
  const parsed = roleEditResultSchema.safeParse(data);
  if (!parsed.success) {
    throw new EntrepreneurMutationError("La respuesta de la edición no tiene el formato esperado.");
  }
  return parsed.data;
}

export async function editarEmprendedorComoOrientador(input: OrientadorEntrepreneurEditInput): Promise<string> {
  const valid = assertValid(orientadorEntrepreneurEditInputSchema.safeParse(input));

  const { data, error } = await supabase.rpc("sigre_orientador_editar_emprendedor", {
    p_id_emprendedor: valid.idEmprendedor,
    p_updated_at_esperado: valid.updatedAtEsperado,
    p_numero_telefono: valid.numeroTelefono,
    p_programa_formacion: valid.programaFormacion,
    p_nivel_formacion: valid.nivelFormacion,
    p_tipo_emprendedor: valid.tipoEmprendedor,
    p_segmentacion: valid.segmentacion,
  });

  if (error) {
    throw toRoleEditError(error, "No tienes autorización para editar este emprendedor o ya no está asignado a ti.");
  }

  return parseResult(data);
}

export async function editarMiFichaEmprendedor(input: OwnEntrepreneurEditInput): Promise<string> {
  const valid = assertValid(ownEntrepreneurEditInputSchema.safeParse(input));

  const { data, error } = await supabase.rpc("sigre_emprendedor_editar_mi_ficha", {
    p_id_emprendedor: valid.idEmprendedor,
    p_updated_at_esperado: valid.updatedAtEsperado,
    p_nombre_completo: valid.nombreCompleto,
    p_numero_telefono: valid.numeroTelefono,
    p_programa_formacion: valid.programaFormacion,
    p_nivel_formacion: valid.nivelFormacion,
  });

  if (error) throw toRoleEditError(error, "No tienes autorización para editar esta ficha.");

  return parseResult(data);
}
