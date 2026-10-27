import { z } from "zod";

import { supabase } from "@/lib/supabase";
import { fetchAllPagesWithRetry, type PageResult } from "@/lib/pagination";
import { parseOperationId, parseOperationIntegerId, toAdminOperationError, toQueryError } from "@/lib/adminOperation";
import { assertBackendAvailable } from "@/lib/backendContract";

import {
  CENTRO_SENA_COLUMNS,
  MUNICIPIO_COLUMNS,
  PANTALLA_COLUMNS,
  centroSenaAdminRowSchema,
  municipioRowSchema,
  pantallaRowSchema,
} from "../schemas/settingsSchema";
import { toMunicipality, toSenaCenter, toSystemScreen } from "../utils/settingUtils";

import type {
  CambiarEstadoCentroSenaInput,
  CambiarEstadoMunicipioInput,
  GuardarCentroSenaInput,
  GuardarMunicipioInput,
  Municipality,
  ScreenChange,
  SenaCenter,
  SystemScreen,
} from "../types/types";

async function getMunicipiosPage(from: number, to: number): Promise<PageResult<Municipality>> {
  const { data, error, count } = await supabase
    .from("municipios")
    .select(MUNICIPIO_COLUMNS, { count: "exact" })
    .order("departamento", { ascending: true })
    .order("nombre_municipio", { ascending: true })
    .order("id", { ascending: true })
    .range(from, to);

  if (error) throw toQueryError(error, "los municipios");

  const parsed = z.array(municipioRowSchema).safeParse(data);
  if (!parsed.success) throw new Error("La respuesta de municipios no tiene el formato esperado.");

  return { rows: parsed.data.map(toMunicipality), total: count };
}

export function getMunicipios(): Promise<Municipality[]> {
  return fetchAllPagesWithRetry(getMunicipiosPage);
}

const MUNICIPIO_ERROR_COPY = {
  denied: "No tienes autorización para administrar municipios.",
  notFound: "El municipio no existe. Recarga el catálogo.",
};

export async function guardarMunicipioAdmin(input: GuardarMunicipioInput): Promise<number> {
  const operation = input.id === null ? "Crear municipio" : "Editar municipio";
  assertBackendAvailable({ name: "sigre_admin_guardar_municipio", operation });

  const { data, error } = await supabase.rpc("sigre_admin_guardar_municipio", {
    p_id_municipio: input.id,
    p_nombre_municipio: input.nombre,
    p_departamento: input.departamento,
  });

  if (error) {
    throw toAdminOperationError(error, {
      ...MUNICIPIO_ERROR_COPY,
      operation,
      invalid: "Los datos del municipio no son válidos.",
      duplicate: "Ya existe un municipio con ese nombre en el departamento.",
      fallback: "No fue posible guardar el municipio. Inténtalo nuevamente más tarde.",
    });
  }

  return parseOperationIntegerId(data, operation);
}

export async function cambiarEstadoMunicipioAdmin(input: CambiarEstadoMunicipioInput): Promise<number> {
  const operation = input.estaActivo ? "Activar municipio" : "Inactivar municipio";
  assertBackendAvailable({ name: "sigre_admin_cambiar_estado_municipio", operation });

  const { data, error } = await supabase.rpc("sigre_admin_cambiar_estado_municipio", {
    p_id_municipio: input.id,
    p_esta_activo: input.estaActivo,
  });

  if (error) {
    throw toAdminOperationError(error, {
      ...MUNICIPIO_ERROR_COPY,
      operation,
      invalid: "El municipio ya tiene ese estado.",
      fallback: "No fue posible cambiar el estado del municipio. Inténtalo nuevamente más tarde.",
    });
  }

  return parseOperationIntegerId(data, operation);
}

export async function getCentrosSenaAdmin(): Promise<SenaCenter[]> {
  const { data, error } = await supabase
    .from("sena_centros")
    .select(CENTRO_SENA_COLUMNS)
    .is("deleted_at", null)
    .order("nombre", { ascending: true });

  if (error) throw toQueryError(error, "los centros SENA");

  const parsed = z.array(centroSenaAdminRowSchema).safeParse(data);
  if (!parsed.success) throw new Error("La respuesta de centros SENA no tiene el formato esperado.");

  return parsed.data.map(toSenaCenter);
}

const CENTRO_ERROR_COPY = {
  denied: "No tienes autorización para administrar centros SENA.",
  notFound: "El centro SENA no existe o fue eliminado. Recarga el catálogo.",
  invalid: "Los datos del centro SENA no son válidos o no tienen cambios.",
  duplicate: "Ya existe un centro SENA con ese código.",
};

export async function guardarCentroSenaAdmin(input: GuardarCentroSenaInput): Promise<string> {
  const operation = input.id ? "Editar centro SENA" : "Crear centro SENA";
  assertBackendAvailable({ name: "sigre_admin_guardar_centro_sena", operation });

  const { data, error } = await supabase.rpc("sigre_admin_guardar_centro_sena", {
    p_id_centro: input.id,
    p_updated_at_esperado: input.updatedAt,
    p_id_regional: input.idRegional,
    p_codigo: input.codigo,
    p_nombre: input.nombre,
  });

  if (error) {
    throw toAdminOperationError(error, {
      ...CENTRO_ERROR_COPY,
      operation,
      fallback: "No fue posible guardar el centro SENA. Inténtalo nuevamente más tarde.",
    });
  }

  return parseOperationId(data, operation);
}

export async function cambiarEstadoCentroSenaAdmin(input: CambiarEstadoCentroSenaInput): Promise<string> {
  const operation = "Cambiar estado de centro SENA";
  assertBackendAvailable({ name: "sigre_admin_cambiar_estado_centro_sena", operation });

  const { data, error } = await supabase.rpc("sigre_admin_cambiar_estado_centro_sena", {
    p_id_centro: input.id,
    p_updated_at_esperado: input.updatedAt,
    p_estado_nuevo: input.estadoNuevo,
  });

  if (error) {
    throw toAdminOperationError(error, {
      ...CENTRO_ERROR_COPY,
      operation,
      fallback: "No fue posible cambiar el estado del centro SENA. Inténtalo nuevamente más tarde.",
    });
  }

  return parseOperationId(data, operation);
}

export async function getPantallas(): Promise<SystemScreen[]> {
  const { data, error } = await supabase
    .from("app_pantallas")
    .select(PANTALLA_COLUMNS)
    .is("deleted_at", null)
    .order("orden", { ascending: true, nullsFirst: false })
    .order("nombre", { ascending: true });

  if (error) throw toQueryError(error, "los módulos y pantallas");

  const parsed = z.array(pantallaRowSchema).safeParse(data);
  if (!parsed.success) throw new Error("La respuesta de módulos y pantallas no tiene el formato esperado.");

  return parsed.data.map(toSystemScreen);
}

export async function actualizarPantallasAdmin(changes: ScreenChange[]): Promise<string> {
  const operation = "Actualizar módulos y pantallas";
  assertBackendAvailable({ name: "sigre_admin_actualizar_pantallas", operation });

  const { data, error } = await supabase.rpc("sigre_admin_actualizar_pantallas", {
    p_pantallas: changes.map((change) => ({
      id_pantalla: change.id,
      updated_at_esperado: change.updatedAt,
      orden: change.orden,
      estado: change.estado,
    })),
  });

  if (error) {
    throw toAdminOperationError(error, {
      operation,
      denied: "No tienes autorización para configurar módulos y pantallas.",
      notFound: "Una de las pantallas ya no existe. Recarga la configuración.",
      invalid: "La configuración de pantallas no es válida.",
      fallback: "No fue posible guardar la configuración de pantallas. Inténtalo nuevamente más tarde.",
    });
  }

  return parseOperationId(data, operation);
}
