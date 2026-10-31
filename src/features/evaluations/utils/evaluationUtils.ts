import { localDateKey, matchesSearch, normalizeText } from "@/lib/format";
import { initials, personName } from "@/lib/personName";
import { MIN_EVALUADORES_POR_PITCH } from "@/features/evaluators/utils/evaluatorUtils";

import type { MiAsignacionRow, ResultadoPitchRow } from "../schemas/evaluationsSchema";
import type { Evaluacion } from "../types/evaluacion";
import type { ConsolidatedResult, EvaluationResults, ResultFiltersValue } from "../types/resultado";

const AVATAR_COLORS = ["bg-blue-500", "bg-red-400", "bg-teal-500"];

export const INITIAL_RESULT_FILTERS: ResultFiltersValue = { search: "", resultado: "", fechaPitch: "" };

export function toEvaluacion(row: MiAsignacionRow): Evaluacion {
  const calificacion = row.calificaciones_pitch;
  return {
    id: row.id,
    pitchId: row.pitch?.id ?? null,
    proyecto: row.pitch?.proyecto?.titulo ?? null,
    emprendedor: row.pitch?.proyecto?.emprendedor?.nombre_completo ?? null,
    fechaPitch: row.pitch?.fecha_hora ?? null,
    estadoPitch: row.pitch?.estado ?? null,
    modalidad: row.pitch?.modalidad ?? null,
    estado: calificacion ? "Completado" : "Pendiente",
    calificacion,
  };
}

export const APPROVAL_RULE_PENDING_MESSAGE =
  "La regla de aprobación final del pitch (por ejemplo, mayoría de evaluadores) está pendiente de confirmación. Se muestran los votos registrados sin emitir un resultado definitivo.";

function consolidate(asignados: number, calificados: number): ConsolidatedResult {
  return asignados < MIN_EVALUADORES_POR_PITCH || calificados < asignados ? "En revisión" : "Calificación completa";
}

function countVotes(resultados: readonly (string | null)[], value: string): number {
  return resultados.filter((resultado) => normalizeText(resultado) === value).length;
}

export function toEvaluationResult(row: ResultadoPitchRow): EvaluationResults {
  const activas = (row.asignacion_evaluadores ?? []).filter((item) => item.deleted_at === null);
  const calificaciones = activas.flatMap((item) => (item.calificaciones_pitch ? [item.calificaciones_pitch] : []));
  const puntajes = calificaciones.flatMap((item) => (item.puntaje === null ? [] : [item.puntaje]));
  const calificados = calificaciones.length;
  const resultados = calificaciones.map((item) => item.resultado);

  return {
    id: row.id,
    proyecto: row.proyecto?.titulo ?? null,
    emprendedor: row.proyecto?.emprendedor?.nombre_completo ?? null,
    fechaPitch: row.fecha_hora,
    estadoPitch: row.estado,
    evaluadores: activas.map((item, index) => {
      const nombre = personName(item.evaluador?.usuario);
      return {
        nombre,
        iniciales: initials(nombre),
        color: AVATAR_COLORS[index % AVATAR_COLORS.length],
        calificado: item.calificaciones_pitch !== null,
      };
    }),
    asignados: activas.length,
    calificados,
    votosAprobado: countVotes(resultados, "aprobado"),
    votosNoAprobado: countVotes(resultados, "no_aprobado"),
    puntajePromedio: puntajes.length ? Math.round(puntajes.reduce((sum, value) => sum + value, 0) / puntajes.length) : null,
    resultado: consolidate(activas.length, calificados),
  };
}

export function filterResults(rows: readonly EvaluationResults[], filters: ResultFiltersValue): EvaluationResults[] {
  return rows.filter(
    (row) =>
      (filters.resultado === "" || row.resultado === filters.resultado) &&
      (filters.fechaPitch === "" || (row.fechaPitch !== null && localDateKey(row.fechaPitch) === filters.fechaPitch)) &&
      matchesSearch(filters.search, row.proyecto, row.emprendedor, ...row.evaluadores.map((e) => e.nombre))
  );
}
