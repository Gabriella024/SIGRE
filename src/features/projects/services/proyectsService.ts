import { z } from "zod";

import { supabase } from "@/lib/supabase";
import { fetchAllPages, fetchAllPagesWithRetry, type PageResult } from "@/lib/pagination";

import {
  PROYECTO_DETAIL_COLUMNS,
  PROYECTO_EXPORT_COLUMNS,
  crearProyectoResultSchema,
  editarProyectoInputSchema,
  editarProyectoResultSchema,
  eliminarProyectoInputSchema,
  eliminarProyectoResultSchema,
  proyectoDetailRowSchema,
  proyectoExportRowSchema,
} from "../schemas/proyectSchema";
import { toProjectDetail, toProjectExportRow } from "../utils/proyectUtils";

import type {
  CrearProyectoAdminInput,
  EditarProyectoAdminInput,
  EliminarProyectoAdminInput,
  Project,
  ProjectDetail,
  ProjectExportRow,
} from "../types/proyect";

type DbError = { code?: string; message: string };

const DB_ERROR_MESSAGES: Record<string, string> = {
  "42501": "No tienes permisos para consultar este proyecto.",
  "22P02": "El identificador del proyecto no es válido.",
};

const NETWORK_ERROR_MESSAGE =
  "No fue posible conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.";

function isNetworkError(error: DbError): boolean {
  return !error.code && /fetch|network/i.test(error.message);
}

function toProjectError(error: DbError, fallback: string): Error {
  if (isNetworkError(error)) return new Error(NETWORK_ERROR_MESSAGE);
  const known = error.code ? DB_ERROR_MESSAGES[error.code] : undefined;
  return new Error(known ?? fallback);
}

async function getProjectsPage(
  from: number,
  to: number,
  emprendedorId?: string
): Promise<PageResult<ProjectExportRow>> {
  let query = supabase
    .from("proyectos")
    .select(PROYECTO_EXPORT_COLUMNS, { count: "exact" })
    .is("deleted_at", null);

  if (emprendedorId) query = query.eq("id_emprendedor_fk", emprendedorId);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);

  if (error) throw toProjectError(error, "No fue posible consultar los proyectos.");

  const parsed = z.array(proyectoExportRowSchema).safeParse(data);

  if (!parsed.success) {
    throw new Error("La respuesta de proyectos no tiene el formato esperado.");
  }

  return { rows: parsed.data.map(toProjectExportRow), total: count };
}

export function getProjects(): Promise<Project[]> {
  return fetchAllPagesWithRetry(getProjectsPage);
}

export function getProjectsForExport(): Promise<ProjectExportRow[]> {
  return fetchAllPages(getProjectsPage);
}

export function getProjectsByEntrepreneur(emprendedorId: string): Promise<Project[]> {
  return fetchAllPagesWithRetry((from, to) => getProjectsPage(from, to, emprendedorId));
}

function toCreateProjectError(error: DbError): Error {
  if (isNetworkError(error)) return new Error(NETWORK_ERROR_MESSAGE);

  switch (error.code) {
    case "42501":
      return new Error("No tienes autorización para crear proyectos.");
    case "23503":
      return new Error("El emprendedor seleccionado no existe o no está activo.");
    case "23514":
      return new Error(
        "Los datos del proyecto no cumplen las reglas de validación o el emprendedor no está activo. Si el emprendedor fue desactivado, debe reactivarse antes de crear proyectos."
      );
    case "22023":
      return new Error("Los datos enviados para crear el proyecto no son válidos.");
    case "PGRST202":
      return new Error("La función de creación de proyectos no está disponible en la base de datos.");
    default:
      return new Error("No fue posible crear el proyecto. Inténtalo nuevamente más tarde.");
  }
}

export async function crearProyectoAdmin(input: CrearProyectoAdminInput): Promise<string> {
  const { data, error } = await supabase.rpc("sigre_admin_crear_proyecto", {
    p_id_emprendedor: input.idEmprendedor,
    p_titulo: input.titulo,
    p_descripcion: input.descripcion,
    p_sector_economico: input.sectorEconomico,
    p_problema_oportunidad: input.problemaOportunidad,
    p_propuesta_valor: input.propuestaValor,
    p_observaciones: input.observaciones,
  });

  if (error) throw toCreateProjectError(error);

  const parsed = crearProyectoResultSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("La respuesta de la creación del proyecto no tiene el formato esperado.");
  }

  return parsed.data;
}

export class ProjectConflictError extends Error {}

function toEditProjectError(error: DbError): Error {
  if (isNetworkError(error)) return new Error(NETWORK_ERROR_MESSAGE);

  switch (error.code) {
    case "42501":
      return new Error("No tienes autorización para editar proyectos.");
    case "P0002":
      return new Error("El proyecto no existe o fue eliminado.");
    case "40001":
      return new ProjectConflictError(
        "Otra persona modificó este proyecto después de que lo abriste. Cierra el formulario y vuelve a abrirlo para cargar la versión actual."
      );
    case "22P02":
      return new Error("El identificador del proyecto no es válido.");
    case "23514":
    case "22023":
      return new Error("Los datos del proyecto no son válidos.");
    case "PGRST202":
      return new Error("La función de edición de proyectos no está disponible en la base de datos.");
    default:
      return new Error("No fue posible guardar los cambios del proyecto. Inténtalo nuevamente más tarde.");
  }
}

export async function editarProyectoAdmin(input: EditarProyectoAdminInput): Promise<string> {
  const valid = editarProyectoInputSchema.safeParse(input);

  if (!valid.success) {
    throw new Error(valid.error.issues[0]?.message ?? "Los datos del proyecto no son válidos.");
  }

  const { data, error } = await supabase.rpc("sigre_admin_editar_proyecto", {
    p_id_proyecto: valid.data.idProyecto,
    p_updated_at_esperado: valid.data.updatedAtEsperado,
    p_titulo: valid.data.titulo,
    p_descripcion: valid.data.descripcion,
    p_sector_economico: valid.data.sectorEconomico,
    p_problema_oportunidad: valid.data.problemaOportunidad,
    p_propuesta_valor: valid.data.propuestaValor,
    p_observaciones: valid.data.observaciones,
  });

  if (error) throw toEditProjectError(error);

  const parsed = editarProyectoResultSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("La respuesta de la edición del proyecto no tiene el formato esperado.");
  }

  return parsed.data;
}

function toDeleteProjectError(error: DbError): Error {
  if (isNetworkError(error)) return new Error(NETWORK_ERROR_MESSAGE);

  switch (error.code) {
    case "42501":
      return new Error("No tienes autorización para eliminar proyectos.");
    case "23514":
      return new Error("Los datos de la solicitud no son válidos o el proyecto ya fue eliminado.");
    case "P0002":
      return new Error("El proyecto no existe.");
    case "40001":
      return new ProjectConflictError(
        "El proyecto fue modificado después de que lo abriste. Actualiza la información antes de volver a intentar la eliminación."
      );
    case "22P02":
      return new Error("El identificador del proyecto no es válido.");
    case "PGRST202":
      return new Error("La función de eliminación de proyectos no está disponible en la base de datos.");
    default:
      return new Error("No fue posible eliminar el proyecto. Inténtalo nuevamente más tarde.");
  }
}

export async function eliminarProyectoAdmin(input: EliminarProyectoAdminInput): Promise<string> {
  const valid = eliminarProyectoInputSchema.safeParse(input);

  if (!valid.success) {
    throw new Error(valid.error.issues[0]?.message ?? "Los datos de la solicitud no son válidos.");
  }

  const { data, error } = await supabase.rpc("sigre_admin_eliminar_proyecto", {
    p_id_proyecto: valid.data.idProyecto,
    p_updated_at_esperado: valid.data.updatedAtEsperado,
  });

  if (error) throw toDeleteProjectError(error);

  const parsed = eliminarProyectoResultSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("La respuesta de la eliminación del proyecto no tiene el formato esperado.");
  }

  return parsed.data;
}

export async function getProjectById(id: string): Promise<ProjectDetail | null> {
  const { data, error } = await supabase
    .from("proyectos")
    .select(PROYECTO_DETAIL_COLUMNS)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw toProjectError(error, "No fue posible cargar el proyecto.");
  if (data === null) return null;

  const parsed = proyectoDetailRowSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("El proyecto no tiene el formato esperado.");
  }

  return toProjectDetail(parsed.data);
}
