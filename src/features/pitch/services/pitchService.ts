import { z } from "zod";

import { supabase } from "@/lib/supabase";
import { fetchAllPagesWithRetry, type PageResult } from "@/lib/pagination";
import { parseOperationId, toAdminOperationError, toQueryError } from "@/lib/adminOperation";
import { assertBackendAvailable } from "@/lib/backendContract";

import { PITCH_COLUMNS, PREPARACION_COLUMNS, pitchRowSchema, preparacionRowSchema } from "../schemas/pitchSchema";
import { toPitch, toPitchPreparation } from "../utils/pitchUtils";

import type {
  AsignarEvaluadorPitchInput,
  CambiarEstadoPitchInput,
  GuardarPitchInput,
  Pitch,
  PitchPreparation,
  RetirarEvaluadorPitchInput,
} from "../types/pitch";

const PITCH_ERROR_COPY = {
  denied: "No tienes autorización para gestionar pitch.",
  notFound: "El pitch no existe. Recarga el listado.",
  invalid: "Los datos del pitch no son válidos.",
  reference: "El proyecto o evaluador seleccionado no existe o no está activo.",
  fallback: "No fue posible guardar el pitch. Inténtalo nuevamente.",
};

async function getPitchPage(from: number, to: number, evaluadorIds?: string[]): Promise<PageResult<Pitch>> {
  const columns = evaluadorIds ? PITCH_COLUMNS.replace("asignacion_evaluadores(", "asignacion_evaluadores!inner(") : PITCH_COLUMNS;
  let query = supabase.from("pitch").select(columns, { count: "exact" });

  if (evaluadorIds) {
    query = query.in("asignacion_evaluadores.id_evaluador_fk", evaluadorIds).is("asignacion_evaluadores.deleted_at", null);
  }

  const { data, error, count } = await query
    .order("fecha_hora", { ascending: false, nullsFirst: false })
    .order("id", { ascending: true })
    .range(from, to);

  if (error) throw toQueryError(error, "los pitch");

  const parsed = z.array(pitchRowSchema).safeParse(data);
  if (!parsed.success) throw new Error("La respuesta de pitch no tiene el formato esperado.");

  return { rows: parsed.data.map(toPitch), total: count };
}

export function getPitches(): Promise<Pitch[]> {
  return fetchAllPagesWithRetry(getPitchPage);
}

export async function getMyEvaluatorIds(usuarioId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("evaluadores")
    .select("id")
    .eq("id_usuario_fk", usuarioId)
    .is("deleted_at", null);

  if (error) throw toQueryError(error, "tu perfil de evaluador");

  const parsed = z.array(z.object({ id: z.string() })).safeParse(data);
  if (!parsed.success) throw new Error("La respuesta del perfil de evaluador no tiene el formato esperado.");

  return parsed.data.map((row) => row.id);
}

export async function getAssignedPitches(usuarioId: string): Promise<Pitch[]> {
  const ids = await getMyEvaluatorIds(usuarioId);
  if (ids.length === 0) return [];
  return fetchAllPagesWithRetry((from, to) => getPitchPage(from, to, ids));
}

async function getPreparationsPage(from: number, to: number): Promise<PageResult<PitchPreparation>> {
  const { data, error, count } = await supabase
    .from("preparaciones_pitch")
    .select(PREPARACION_COLUMNS, { count: "exact" })
    .order("fecha", { ascending: false, nullsFirst: false })
    .order("id", { ascending: true })
    .range(from, to);

  if (error) throw toQueryError(error, "las preparaciones de pitch");

  const parsed = z.array(preparacionRowSchema).safeParse(data);
  if (!parsed.success) throw new Error("La respuesta de preparaciones de pitch no tiene el formato esperado.");

  return { rows: parsed.data.map(toPitchPreparation), total: count };
}

export function getPitchPreparations(): Promise<PitchPreparation[]> {
  return fetchAllPagesWithRetry(getPreparationsPage);
}

export async function guardarPitchAdmin(input: GuardarPitchInput): Promise<string> {
  const operation = input.idPitch ? "Editar pitch" : "Programar pitch";
  assertBackendAvailable({ name: "sigre_admin_guardar_pitch", operation });

  const { data, error } = await supabase.rpc("sigre_admin_guardar_pitch", {
    p_id_pitch: input.idPitch,
    p_updated_at_esperado: input.updatedAtEsperado,
    p_id_proyecto: input.idProyecto,
    p_fecha_hora: input.fechaHora,
    p_modalidad: input.modalidad,
    p_lugar_link: input.lugarLink,
    p_estado: input.estado,
    p_observacion: input.observacion,
  });

  if (error) throw toAdminOperationError(error, { ...PITCH_ERROR_COPY, operation });
  return parseOperationId(data, operation);
}

export async function cambiarEstadoPitchAdmin(input: CambiarEstadoPitchInput): Promise<string> {
  const operation = "Cambiar estado del pitch";
  assertBackendAvailable({ name: "sigre_admin_cambiar_estado_pitch", operation });

  const { data, error } = await supabase.rpc("sigre_admin_cambiar_estado_pitch", {
    p_id_pitch: input.idPitch,
    p_estado: input.estado,
    p_updated_at_esperado: input.updatedAtEsperado,
  });

  if (error) {
    throw toAdminOperationError(error, {
      ...PITCH_ERROR_COPY,
      operation,
      invalid: "El pitch necesita al menos 2 evaluadores asignados para confirmarse o iniciar la evaluación.",
    });
  }
  return parseOperationId(data, operation);
}

export async function asignarEvaluadorPitchAdmin(input: AsignarEvaluadorPitchInput): Promise<string> {
  const operation = "Asignar evaluador";
  assertBackendAvailable({ name: "sigre_admin_asignar_evaluador_pitch", operation });

  const { data, error } = await supabase.rpc("sigre_admin_asignar_evaluador_pitch", {
    p_id_pitch: input.idPitch,
    p_id_evaluador: input.idEvaluador,
  });

  if (error) {
    throw toAdminOperationError(error, {
      ...PITCH_ERROR_COPY,
      operation,
      invalid: "El pitch ya tiene el máximo de 3 evaluadores o el evaluador no está activo.",
      duplicate: "El evaluador ya está asignado a este pitch.",
    });
  }
  return parseOperationId(data, operation);
}

export async function retirarEvaluadorPitchAdmin(input: RetirarEvaluadorPitchInput): Promise<string> {
  const operation = "Retirar evaluador";
  assertBackendAvailable({ name: "sigre_admin_retirar_evaluador_pitch", operation });

  const { data, error } = await supabase.rpc("sigre_admin_retirar_evaluador_pitch", {
    p_id_asignacion: input.idAsignacion,
    p_updated_at_esperado: input.updatedAtEsperado,
  });

  if (error) {
    throw toAdminOperationError(error, {
      ...PITCH_ERROR_COPY,
      operation,
      invalid: "No se puede retirar un evaluador que ya registró su calificación.",
    });
  }
  return parseOperationId(data, operation);
}
