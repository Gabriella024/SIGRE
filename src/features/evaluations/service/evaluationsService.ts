import { z } from "zod";

import { supabase } from "@/lib/supabase";
import { fetchAllPagesWithRetry, type PageResult } from "@/lib/pagination";
import { parseOperationId, toAdminOperationError, toQueryError } from "@/lib/adminOperation";
import { assertBackendAvailable } from "@/lib/backendContract";
import { getMyEvaluatorIds } from "@/features/pitch/services/pitchService";

import {
  MI_ASIGNACION_COLUMNS,
  RESULTADO_PITCH_COLUMNS,
  miAsignacionRowSchema,
  resultadoPitchRowSchema,
} from "../schemas/evaluationsSchema";
import { toEvaluacion, toEvaluationResult } from "../utils/evaluationUtils";

import type { Evaluacion, RegistrarCalificacionInput } from "../types/evaluacion";
import type { EvaluationResults } from "../types/resultado";

async function getMyAssignmentsPage(from: number, to: number, evaluadorIds: string[]): Promise<PageResult<Evaluacion>> {
  const { data, error, count } = await supabase
    .from("asignacion_evaluadores")
    .select(MI_ASIGNACION_COLUMNS, { count: "exact" })
    .in("id_evaluador_fk", evaluadorIds)
    .is("deleted_at", null)
    .order("fecha_asignacion", { ascending: false, nullsFirst: false })
    .order("id", { ascending: true })
    .range(from, to);

  if (error) throw toQueryError(error, "tus pitch asignados");

  const parsed = z.array(miAsignacionRowSchema).safeParse(data);
  if (!parsed.success) throw new Error("La respuesta de asignaciones no tiene el formato esperado.");

  return { rows: parsed.data.map(toEvaluacion), total: count };
}

export async function getMyEvaluations(usuarioId: string): Promise<Evaluacion[]> {
  const ids = await getMyEvaluatorIds(usuarioId);
  if (ids.length === 0) return [];
  return fetchAllPagesWithRetry((from, to) => getMyAssignmentsPage(from, to, ids));
}

async function getResultsPage(from: number, to: number): Promise<PageResult<EvaluationResults>> {
  const { data, error, count } = await supabase
    .from("pitch")
    .select(RESULTADO_PITCH_COLUMNS, { count: "exact" })
    .order("fecha_hora", { ascending: false, nullsFirst: false })
    .order("id", { ascending: true })
    .range(from, to);

  if (error) throw toQueryError(error, "los resultados de evaluación");

  const parsed = z.array(resultadoPitchRowSchema).safeParse(data);
  if (!parsed.success) throw new Error("La respuesta de resultados no tiene el formato esperado.");

  return { rows: parsed.data.map(toEvaluationResult), total: count };
}

export function getConsolidatedResults(): Promise<EvaluationResults[]> {
  return fetchAllPagesWithRetry(getResultsPage);
}

export async function registrarCalificacion(input: RegistrarCalificacionInput): Promise<string> {
  const operation = "Registrar calificación";
  assertBackendAvailable({ name: "sigre_evaluador_registrar_calificacion", operation });

  const { data, error } = await supabase.rpc("sigre_evaluador_registrar_calificacion", {
    p_id_asignacion: input.idAsignacion,
    p_puntaje: input.puntaje,
    p_resultado: input.resultado,
    p_observacion: input.observacion,
  });

  if (error) {
    throw toAdminOperationError(error, {
      operation,
      denied: "No puedes calificar un pitch que no tienes asignado.",
      notFound: "La asignación no existe o fue retirada. Recarga el listado.",
      invalid: "La calificación no es válida o el pitch no está en evaluación.",
      duplicate: "Ya registraste una calificación para este pitch.",
      fallback: "No fue posible registrar la calificación.",
    });
  }
  return parseOperationId(data, operation);
}
