import { z } from "zod";

import { supabase } from "@/lib/supabase";
import { fetchAllPagesWithRetry, type PageResult } from "@/lib/pagination";
import { parseOperationId, toAdminOperationError, toQueryError } from "@/lib/adminOperation";
import { assertBackendAvailable } from "@/lib/backendContract";

import { EVALUADOR_COLUMNS, evaluadorRowSchema } from "../schemas/evaluatorsSchema";
import { toEvaluator } from "../utils/evaluatorUtils";

import type { CambiarEstadoEvaluadorInput, Evaluator, GuardarEvaluadorInput } from "../types/evaluators";

const EVALUADOR_ERROR_COPY = {
  denied: "No tienes autorización para administrar evaluadores.",
  notFound: "El evaluador no existe o fue eliminado. Recarga el listado.",
  invalid: "Los datos del evaluador no son válidos.",
  duplicate: "El usuario seleccionado ya está registrado como evaluador.",
  reference: "El usuario seleccionado no existe o no tiene el rol evaluador.",
  fallback: "No fue posible guardar el evaluador. Inténtalo nuevamente.",
};

async function getEvaluatorsPage(from: number, to: number, usuarioId?: string): Promise<PageResult<Evaluator>> {
  let query = supabase
    .from("evaluadores")
    .select(EVALUADOR_COLUMNS, { count: "exact" })
    .is("deleted_at", null);

  if (usuarioId) query = query.eq("id_usuario_fk", usuarioId);

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: true })
    .range(from, to);

  if (error) throw toQueryError(error, "los evaluadores");

  const parsed = z.array(evaluadorRowSchema).safeParse(data);
  if (!parsed.success) throw new Error("La respuesta de evaluadores no tiene el formato esperado.");

  return { rows: parsed.data.map(toEvaluator), total: count };
}

export function getEvaluators(): Promise<Evaluator[]> {
  return fetchAllPagesWithRetry(getEvaluatorsPage);
}

export function getEvaluatorsByUser(usuarioId: string): Promise<Evaluator[]> {
  return fetchAllPagesWithRetry((from, to) => getEvaluatorsPage(from, to, usuarioId));
}

export async function guardarEvaluadorAdmin(input: GuardarEvaluadorInput): Promise<string> {
  const operation = input.idEvaluador ? "Editar evaluador" : "Registrar evaluador";
  assertBackendAvailable({ name: "sigre_admin_guardar_evaluador", operation });

  const { data, error } = await supabase.rpc("sigre_admin_guardar_evaluador", {
    p_id_evaluador: input.idEvaluador,
    p_id_usuario: input.idUsuario,
    p_updated_at_esperado: input.updatedAtEsperado,
    p_especialidad: input.especialidad,
    p_entidad: input.entidad,
    p_experiencia: input.experiencia,
  });

  if (error) throw toAdminOperationError(error, { ...EVALUADOR_ERROR_COPY, operation });
  return parseOperationId(data, operation);
}

export async function cambiarEstadoEvaluadorAdmin(input: CambiarEstadoEvaluadorInput): Promise<string> {
  const operation = "Cambiar estado del evaluador";
  assertBackendAvailable({ name: "sigre_admin_cambiar_estado_evaluador", operation });

  const { data, error } = await supabase.rpc("sigre_admin_cambiar_estado_evaluador", {
    p_id_evaluador: input.idEvaluador,
    p_estado: input.estado,
    p_updated_at_esperado: input.updatedAtEsperado,
  });

  if (error) throw toAdminOperationError(error, { ...EVALUADOR_ERROR_COPY, operation });
  return parseOperationId(data, operation);
}
