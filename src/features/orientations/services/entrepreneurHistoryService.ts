import { z } from "zod";

import { supabase } from "@/lib/supabase";
import { isNetworkError, NETWORK_ERROR_MESSAGE, type DbError } from "@/features/entrepreneurs/utils/dbError";

import {
  ASISTENCIA_HISTORY_COLUMNS,
  INSCRIPCION_HISTORY_COLUMNS,
  asistenciaHistoryRowSchema,
  inscripcionHistoryRowSchema,
} from "../schemas/entrepreneurHistorySchema";
import { buildEntrepreneurOrientationHistory } from "../utils/orientationUtils";

import type { EntrepreneurOrientationHistoryItem } from "../types/orientations";

function toHistoryError(error: DbError): Error {
  if (isNetworkError(error)) return new Error(NETWORK_ERROR_MESSAGE);
  if (error.code === "42501") return new Error("No tienes autorización para consultar el historial de orientaciones.");
  return new Error("No fue posible consultar el historial de orientaciones.");
}

async function getInscripciones(emprendedorId: string) {
  const { data, error } = await supabase
    .from("orientacion_inscripciones")
    .select(INSCRIPCION_HISTORY_COLUMNS)
    .eq("id_emprendedor_fk", emprendedorId)
    .is("deleted_at", null);

  if (error) throw toHistoryError(error);

  const parsed = z.array(inscripcionHistoryRowSchema).safeParse(data);
  if (!parsed.success) throw new Error("La respuesta de inscripciones no tiene el formato esperado.");
  return parsed.data;
}

async function getAsistencias(emprendedorId: string) {
  const { data, error } = await supabase
    .from("asistencias")
    .select(ASISTENCIA_HISTORY_COLUMNS)
    .eq("id_emprendedor_fk", emprendedorId)
    .is("deleted_at", null);

  if (error) throw toHistoryError(error);

  const parsed = z.array(asistenciaHistoryRowSchema).safeParse(data);
  if (!parsed.success) throw new Error("La respuesta de asistencias no tiene el formato esperado.");
  return parsed.data;
}

export async function getOrientationHistoryByEntrepreneur(
  emprendedorId: string
): Promise<EntrepreneurOrientationHistoryItem[]> {
  const [inscripciones, asistencias] = await Promise.all([
    getInscripciones(emprendedorId),
    getAsistencias(emprendedorId),
  ]);
  return buildEntrepreneurOrientationHistory(inscripciones, asistencias);
}
