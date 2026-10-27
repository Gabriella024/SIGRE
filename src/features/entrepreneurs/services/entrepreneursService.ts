import { z } from "zod";

import { supabase } from "@/lib/supabase";
import { fetchAllPages, fetchAllPagesWithRetry, type PageResult } from "@/lib/pagination";

import {
  EMPRENDEDOR_COLUMNS,
  asignarOrientadorInputSchema,
  asignarOrientadorResultSchema,
  cambiarEstadoInputSchema,
  cambiarEstadoResultSchema,
  EMPRENDEDOR_DETAIL_COLUMNS,
  crearEmprendedorResultSchema,
  editarEmprendedorInputSchema,
  editarEmprendedorResultSchema,
  emprendedorDetailRowSchema,
  emprendedorRowSchema,
} from "../schemas/entrepreneursSchema";
import { isNetworkError, NETWORK_ERROR_MESSAGE, type DbError } from "../utils/dbError";
import {
  ALL_ENTREPRENEURS_SCOPE,
  isValidEntrepreneurId,
  toEntrepreneur,
  toEntrepreneurDetail,
} from "../utils/entrepreneurUtils";

import type {
  AsignarOrientadorAdminInput,
  CambiarEstadoEmprendedorAdminInput,
  CrearEmprendedorAdminInput,
  EditarEmprendedorAdminInput,
  Entrepreneur,
  EntrepreneurErrorReason,
  EntrepreneurDetail,
  EntrepreneurScope,
} from "../types/entrepreneur";

function toEntrepreneurError(error: DbError): Error {
  if (isNetworkError(error)) return new Error(NETWORK_ERROR_MESSAGE);
  if (error.code === "42501") {
    return new Error("No tienes autorización para consultar emprendedores.");
  }
  return new Error("No fue posible consultar los emprendedores.");
}

async function getEntrepreneursPage(
  scope: EntrepreneurScope,
  from: number,
  to: number
): Promise<PageResult<Entrepreneur>> {
  let query = supabase
    .from("emprendedores")
    .select(EMPRENDEDOR_COLUMNS, { count: "exact" })
    .is("deleted_at", null);

  if (scope.kind === "assigned") query = query.eq("id_orientador_fk", scope.orientadorId);
  if (scope.kind === "own") query = query.eq("usuario_id", scope.usuarioId);

  const { data, error, count } = await query
    .order("nombre_completo", { ascending: true })
    .order("id", { ascending: true })
    .range(from, to);

  if (error) throw toEntrepreneurError(error);

  const parsed = z.array(emprendedorRowSchema).safeParse(data);

  if (!parsed.success) {
    throw new Error("La respuesta de emprendedores no tiene el formato esperado.");
  }

  return { rows: parsed.data.map(toEntrepreneur), total: count };
}

export async function getEntrepreneurById(id: string): Promise<EntrepreneurDetail | null> {
  if (!isValidEntrepreneurId(id)) return null;

  const { data, error } = await supabase
    .from("emprendedores")
    .select(EMPRENDEDOR_DETAIL_COLUMNS)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw toEntrepreneurError(error);
  if (data === null) return null;

  const parsed = emprendedorDetailRowSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("El emprendedor no tiene el formato esperado.");
  }

  return toEntrepreneurDetail(parsed.data);
}

export function getAllEntrepreneurs(scope: EntrepreneurScope = ALL_ENTREPRENEURS_SCOPE): Promise<Entrepreneur[]> {
  return fetchAllPagesWithRetry((from, to) => getEntrepreneursPage(scope, from, to));
}

export function getEntrepreneursForExport(scope: EntrepreneurScope = ALL_ENTREPRENEURS_SCOPE): Promise<Entrepreneur[]> {
  return fetchAllPages((from, to) => getEntrepreneursPage(scope, from, to));
}

export class EntrepreneurMutationError extends Error {
  readonly reason: EntrepreneurErrorReason;
  readonly conflict: boolean;

  constructor(message: string, reason: EntrepreneurErrorReason = null, conflict = false) {
    super(message);
    this.reason = reason;
    this.conflict = conflict;
  }
}

function toCreateEntrepreneurError(error: DbError): EntrepreneurMutationError {
  if (isNetworkError(error)) return new EntrepreneurMutationError(NETWORK_ERROR_MESSAGE);

  switch (error.code) {
    case "42501":
      return new EntrepreneurMutationError("No tienes autorización para registrar emprendedores.");
    case "23505":
      return new EntrepreneurMutationError(
        "El usuario seleccionado ya tiene un registro de emprendedor. Selecciona otro usuario.",
        "usuario"
      );
    case "22023":
      return new EntrepreneurMutationError(
        "Los datos están incompletos o el usuario seleccionado ya no es elegible. Revisa la información e inténtalo nuevamente.",
        "usuario"
      );
    case "23503":
      return new EntrepreneurMutationError(
        "El centro SENA seleccionado no es válido o ya no está activo. Selecciona otro centro.",
        "centro"
      );
    case "PGRST202":
      return new EntrepreneurMutationError(
        "La función de registro de emprendedores no está disponible en este momento. Inténtalo más tarde."
      );
    default:
      return new EntrepreneurMutationError("No fue posible registrar el emprendedor. Inténtalo nuevamente más tarde.");
  }
}

export async function crearEmprendedorAdmin(input: CrearEmprendedorAdminInput): Promise<string> {
  const { data, error } = await supabase.rpc("sigre_admin_crear_emprendedor", {
    p_usuario_id: input.usuarioId,
    p_nombre_completo: input.nombreCompleto,
    p_id_centro_sena: input.idCentroSena,
    p_programa_formacion: input.programaFormacion,
    p_nivel_formacion: input.nivelFormacion,
    p_tipo_emprendedor: input.tipoEmprendedor,
    p_segmentacion: input.segmentacion,
  });

  if (error) throw toCreateEntrepreneurError(error);

  const parsed = crearEmprendedorResultSchema.safeParse(data);

  if (!parsed.success) {
    throw new EntrepreneurMutationError("La respuesta del registro del emprendedor no tiene el formato esperado.");
  }

  return parsed.data;
}

function toEditEntrepreneurError(error: DbError): EntrepreneurMutationError {
  if (isNetworkError(error)) return new EntrepreneurMutationError(NETWORK_ERROR_MESSAGE);

  switch (error.code) {
    case "42501":
      return new EntrepreneurMutationError("No tienes autorización para editar emprendedores.");
    case "P0002":
      return new EntrepreneurMutationError(
        "El emprendedor no existe o fue eliminado. Recarga la ficha para ver su estado actual.",
        "registro"
      );
    case "40001":
      return new EntrepreneurMutationError(
        "Otra persona modificó este emprendedor después de que abriste el formulario. Recarga la ficha para ver la versión actual antes de volver a editar.",
        null,
        true
      );
    case "22023":
      return new EntrepreneurMutationError(
        "Los datos del emprendedor no son válidos. Revisa la información e inténtalo nuevamente."
      );
    case "23503":
      return new EntrepreneurMutationError(
        "El centro SENA seleccionado no es válido o ya no está activo. Selecciona otro centro.",
        "centro"
      );
    case "PGRST202":
      return new EntrepreneurMutationError(
        "La función de edición de emprendedores no está disponible en este momento. Inténtalo más tarde."
      );
    default:
      return new EntrepreneurMutationError(
        "No fue posible guardar los cambios del emprendedor. Inténtalo nuevamente más tarde."
      );
  }
}

export async function editarEmprendedorAdmin(input: EditarEmprendedorAdminInput): Promise<string> {
  const valid = editarEmprendedorInputSchema.safeParse(input);

  if (!valid.success) {
    throw new EntrepreneurMutationError(valid.error.issues[0]?.message ?? "Los datos del emprendedor no son válidos.");
  }

  const { data, error } = await supabase.rpc("sigre_admin_editar_emprendedor", {
    p_id_emprendedor: valid.data.idEmprendedor,
    p_updated_at_esperado: valid.data.updatedAtEsperado,
    p_nombre_completo: valid.data.nombreCompleto,
    p_id_centro_sena: valid.data.idCentroSena,
    p_programa_formacion: valid.data.programaFormacion,
    p_nivel_formacion: valid.data.nivelFormacion,
    p_tipo_emprendedor: valid.data.tipoEmprendedor,
    p_segmentacion: valid.data.segmentacion,
  });

  if (error) throw toEditEntrepreneurError(error);

  const parsed = editarEmprendedorResultSchema.safeParse(data);

  if (!parsed.success) {
    throw new EntrepreneurMutationError("La respuesta de la edición del emprendedor no tiene el formato esperado.");
  }

  return parsed.data;
}

function toAssignOrientadorError(error: DbError): EntrepreneurMutationError {
  if (isNetworkError(error)) return new EntrepreneurMutationError(NETWORK_ERROR_MESSAGE);

  switch (error.code) {
    case "42501":
      return new EntrepreneurMutationError("No tienes autorización para asignar orientadores.");
    case "P0002":
      return new EntrepreneurMutationError(
        "El emprendedor no existe o fue eliminado. Recarga la ficha para ver su estado actual.",
        "registro"
      );
    case "40001":
      return new EntrepreneurMutationError(
        "Otra persona modificó este emprendedor después de que abriste la asignación. Recarga la ficha para ver la versión actual antes de volver a intentarlo.",
        null,
        true
      );
    case "22023":
      return new EntrepreneurMutationError(
        "El orientador seleccionado ya no es elegible o la asignación no tiene cambios. Revisa la selección e inténtalo nuevamente.",
        "orientador"
      );
    case "PGRST202":
      return new EntrepreneurMutationError(
        "La función de asignación de orientadores no está disponible en este momento. Inténtalo más tarde."
      );
    default:
      return new EntrepreneurMutationError(
        "No fue posible guardar la asignación del orientador. Inténtalo nuevamente más tarde."
      );
  }
}

function toChangeStatusError(error: DbError): EntrepreneurMutationError {
  if (isNetworkError(error)) return new EntrepreneurMutationError(NETWORK_ERROR_MESSAGE);

  switch (error.code) {
    case "42501":
      return new EntrepreneurMutationError("No tienes autorización para cambiar el estado de emprendedores.");
    case "P0002":
      return new EntrepreneurMutationError(
        "El emprendedor no existe o fue eliminado. Recarga la ficha para ver su estado actual.",
        "registro"
      );
    case "40001":
      return new EntrepreneurMutationError(
        "Otra persona modificó este emprendedor después de que abriste el cambio de estado. Recarga la ficha para ver la versión actual antes de volver a intentarlo.",
        null,
        true
      );
    case "22023":
      return new EntrepreneurMutationError(
        "No se pudo aplicar el cambio: la justificación está vacía, el estado no es válido o el emprendedor ya tiene ese estado. Revisa la información o recarga la ficha.",
        "estado"
      );
    case "PGRST202":
      return new EntrepreneurMutationError(
        "La función de cambio de estado no está disponible en este momento. Inténtalo más tarde."
      );
    default:
      return new EntrepreneurMutationError(
        "No fue posible cambiar el estado del emprendedor. Inténtalo nuevamente más tarde."
      );
  }
}

export async function cambiarEstadoEmprendedorAdmin(input: CambiarEstadoEmprendedorAdminInput): Promise<string> {
  const valid = cambiarEstadoInputSchema.safeParse(input);

  if (!valid.success) {
    throw new EntrepreneurMutationError(valid.error.issues[0]?.message ?? "Los datos del cambio de estado no son válidos.");
  }

  const { data, error } = await supabase.rpc("sigre_admin_cambiar_estado_emprendedor", {
    p_id_emprendedor: valid.data.idEmprendedor,
    p_updated_at_esperado: valid.data.updatedAtEsperado,
    p_estado_nuevo: valid.data.estadoNuevo,
    p_justificacion: valid.data.justificacion,
  });

  if (error) throw toChangeStatusError(error);

  const parsed = cambiarEstadoResultSchema.safeParse(data);

  if (!parsed.success) {
    throw new EntrepreneurMutationError("La respuesta del cambio de estado no tiene el formato esperado.");
  }

  return parsed.data;
}

export async function asignarOrientadorAdmin(input: AsignarOrientadorAdminInput): Promise<string> {
  const valid = asignarOrientadorInputSchema.safeParse(input);

  if (!valid.success) {
    throw new EntrepreneurMutationError(valid.error.issues[0]?.message ?? "Los datos de la asignación no son válidos.");
  }

  const { data, error } = await supabase.rpc("sigre_admin_asignar_orientador", {
    p_id_emprendedor: valid.data.idEmprendedor,
    p_updated_at_esperado: valid.data.updatedAtEsperado,
    p_id_orientador: valid.data.idOrientador,
  });

  if (error) throw toAssignOrientadorError(error);

  const parsed = asignarOrientadorResultSchema.safeParse(data);

  if (!parsed.success) {
    throw new EntrepreneurMutationError("La respuesta de la asignación del orientador no tiene el formato esperado.");
  }

  return parsed.data;
}
