import { z } from "zod";

import { supabase } from "@/lib/supabase";
import { fetchAllPagesWithRetry, type PageResult } from "@/lib/pagination";
import { parseOperationId, toAdminOperationError, toQueryError } from "@/lib/adminOperation";
import { assertBackendAvailable } from "@/lib/backendContract";

import { CUMPLIMIENTO_COLUMNS, RETO_COLUMNS, cumplimientoRowSchema, retoRowSchema } from "../schemas/challengesSchema";
import { toChallenge, toChallengeCompliance } from "../utils/challengeUtils";

import type {
  AsignarRetoProyectoInput,
  CambiarEstadoRetoInput,
  Challenge,
  ChallengeCompliance,
  GuardarRetoInput,
} from "../types/Challenge";

const RETO_ERROR_COPY = {
  denied: "No tienes autorización para administrar retos.",
  notFound: "El reto no existe o fue eliminado. Recarga el listado.",
  invalid: "Los datos del reto no son válidos.",
  fallback: "No fue posible guardar el reto. Inténtalo nuevamente.",
};

async function getChallengesPage(from: number, to: number): Promise<PageResult<Challenge>> {
  const { data, error, count } = await supabase
    .from("retos")
    .select(RETO_COLUMNS, { count: "exact" })
    .is("deleted_at", null)
    .order("orden", { ascending: true, nullsFirst: false })
    .order("id", { ascending: true })
    .range(from, to);

  if (error) throw toQueryError(error, "los retos");

  const parsed = z.array(retoRowSchema).safeParse(data);
  if (!parsed.success) throw new Error("La respuesta de retos no tiene el formato esperado.");

  return { rows: parsed.data.map(toChallenge), total: count };
}

export function getChallenges(): Promise<Challenge[]> {
  return fetchAllPagesWithRetry(getChallengesPage);
}

export async function getChallengeCompliance(idReto: string): Promise<ChallengeCompliance[]> {
  const { data, error } = await supabase
    .from("cumplimiento_retos")
    .select(CUMPLIMIENTO_COLUMNS)
    .eq("id_reto_fk", idReto)
    .order("fecha_entrega", { ascending: true, nullsFirst: false });

  if (error) throw toQueryError(error, "el cumplimiento del reto");

  const parsed = z.array(cumplimientoRowSchema).safeParse(data);
  if (!parsed.success) throw new Error("La respuesta de cumplimiento no tiene el formato esperado.");

  return parsed.data.map(toChallengeCompliance);
}

export async function guardarRetoAdmin(input: GuardarRetoInput): Promise<string> {
  const operation = input.idReto ? "Editar reto" : "Crear reto";
  assertBackendAvailable({ name: "sigre_admin_guardar_reto", operation });

  const { data, error } = await supabase.rpc("sigre_admin_guardar_reto", {
    p_id_reto: input.idReto,
    p_updated_at_esperado: input.updatedAtEsperado,
    p_titulo: input.titulo,
    p_descripcion: input.descripcion,
    p_orden: input.orden,
    p_estado: input.estado,
  });

  if (error) throw toAdminOperationError(error, { ...RETO_ERROR_COPY, operation });
  return parseOperationId(data, operation);
}

export async function cambiarEstadoRetoAdmin(input: CambiarEstadoRetoInput): Promise<string> {
  const operation = "Cambiar estado del reto";
  assertBackendAvailable({ name: "sigre_admin_cambiar_estado_reto", operation });

  const { data, error } = await supabase.rpc("sigre_admin_cambiar_estado_reto", {
    p_id_reto: input.idReto,
    p_estado: input.estado,
    p_updated_at_esperado: input.updatedAtEsperado,
  });

  if (error) throw toAdminOperationError(error, { ...RETO_ERROR_COPY, operation });
  return parseOperationId(data, operation);
}

export async function asignarRetoProyectoAdmin(input: AsignarRetoProyectoInput): Promise<string> {
  const operation = "Asignar reto a proyecto";
  assertBackendAvailable({ name: "sigre_admin_asignar_reto_proyecto", operation });

  const { data, error } = await supabase.rpc("sigre_admin_asignar_reto_proyecto", {
    p_id_reto: input.idReto,
    p_id_proyecto: input.idProyecto,
    p_fecha_entrega: input.fechaEntrega,
  });

  if (error) {
    throw toAdminOperationError(error, {
      ...RETO_ERROR_COPY,
      operation,
      duplicate: "El proyecto ya tiene asignado este reto.",
      reference: "El reto o el proyecto seleccionado no existe.",
    });
  }
  return parseOperationId(data, operation);
}
