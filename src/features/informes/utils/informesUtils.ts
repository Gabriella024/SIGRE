import { formatStatusLabel, formatTime, localDateKey, matchesOption, matchesSearch } from "@/lib/format";
import { personName } from "@/lib/personName";
import { challengeLevel } from "@/features/challenges/utils/challengeUtils";
import { MIN_EVALUADORES_POR_PITCH } from "@/features/evaluators/utils/evaluatorUtils";
import { ESTADO_ASISTENCIA_OPTIONS } from "@/features/orientations/constants/jornada";
import type { SigreRole } from "@/features/access-control/types/types";
import type { EntrepreneurScope } from "@/features/entrepreneurs/types/entrepreneur";
import type { EntrepreneurOrientationHistoryItem } from "@/features/orientations/types/orientations";
import type { Pitch } from "@/features/pitch/types/pitch";
import type { Evaluacion } from "@/features/evaluations/types/evaluacion";
import type { EvaluationResults } from "@/features/evaluations/types/resultado";

import type { CumplimientoReportRow, OrientacionReportRow } from "../schemas/informeSchema";
import type {
  ComplianceReportRow,
  DataScope,
  EvaluationReportRow,
  OrientationReportRow,
  PitchReportRow,
  ReportFilters,
} from "../types/types";

export const INITIAL_REPORT_FILTERS: ReportFilters = { search: "", estado: "", desde: "", hasta: "" };

export function resolveDataScope(roles: readonly SigreRole[], usuarioId: string | null): DataScope | null {
  if (roles.includes("administrador")) return { kind: "global", role: "administrador" };
  if (roles.includes("coordinador")) return { kind: "global", role: "coordinador" };
  if (!usuarioId) return null;
  if (roles.includes("orientador")) return { kind: "orientador", usuarioId };
  if (roles.includes("evaluador")) return { kind: "evaluador", usuarioId };
  if (roles.includes("emprendedor")) return { kind: "emprendedor", usuarioId };
  return null;
}

export function scopeDescription(scope: DataScope): string {
  switch (scope.kind) {
    case "global":
      return scope.role === "administrador"
        ? "Información global autorizada"
        : "Información dentro del alcance de coordinación autorizado";
    case "orientador":
      return "Tus emprendedores y actividades asignadas";
    case "evaluador":
      return "Pitch y evaluaciones asignados";
    case "emprendedor":
      return "Tus proyectos, orientaciones, retos y pitch";
  }
}

export function toEntrepreneurScope(scope: DataScope): EntrepreneurScope {
  switch (scope.kind) {
    case "orientador":
      return { kind: "assigned", orientadorId: scope.usuarioId };
    case "emprendedor":
      return { kind: "own", usuarioId: scope.usuarioId };
    default:
      return { kind: "all" };
  }
}

export interface EntrepreneurFilter {
  column: "id_orientador_fk" | "usuario_id";
  value: string;
}

export function entrepreneurFilter(scope: DataScope): EntrepreneurFilter | null {
  if (scope.kind === "orientador") return { column: "id_orientador_fk", value: scope.usuarioId };
  if (scope.kind === "emprendedor") return { column: "usuario_id", value: scope.usuarioId };
  return null;
}

export function innerJoin(columns: string, ...embeds: string[]): string {
  return embeds.reduce((result, embed) => result.replace(`${embed}(`, `${embed}!inner(`), columns);
}

function labelOf(value: string | null): string | null {
  return value?.trim() ? formatStatusLabel(value) : null;
}

const ASISTENCIA_LABELS = new Map<string, string>(ESTADO_ASISTENCIA_OPTIONS.map((option) => [option.value, option.label]));

function countActive<T extends { deleted_at: string | null }>(rows: readonly T[] | null, match: (row: T) => boolean = () => true) {
  return (rows ?? []).filter((row) => row.deleted_at === null && match(row)).length;
}

export function toOrientationReportRow(row: OrientacionReportRow): OrientationReportRow {
  return {
    id: row.id,
    tema: row.tema,
    fecha: row.fecha,
    horario: `${formatTime(row.hora_inicio)} - ${formatTime(row.hora_fin)}`,
    modalidad: row.modalidad,
    estado: row.estado,
    orientador: personName(row.orientador),
    cupo: row.cupo,
    inscritos: countActive(row.orientacion_inscripciones),
    asistieron: countActive(row.asistencias, (item) => item.estado_asistencia === "asistio"),
    noAsistieron: countActive(row.asistencias, (item) => item.estado_asistencia === "no_asistio"),
    miInscripcion: null,
    miAsistencia: null,
  };
}

export function toPersonalOrientationRow(item: EntrepreneurOrientationHistoryItem): OrientationReportRow {
  const estadoAsistencia = item.asistencia?.estado ?? null;
  return {
    id: item.orientacionId,
    tema: item.jornada?.tema ?? "Jornada no disponible",
    fecha: item.jornada?.fecha ?? null,
    horario: item.jornada ? `${formatTime(item.jornada.horaInicio)} - ${formatTime(item.jornada.horaFin)}` : null,
    modalidad: item.jornada?.modalidad ?? null,
    estado: item.jornada?.estado ?? null,
    orientador: null,
    cupo: null,
    inscritos: null,
    asistieron: null,
    noAsistieron: null,
    miInscripcion: item.inscripcion ? (labelOf(item.inscripcion.estado) ?? "Inscrito") : null,
    miAsistencia: estadoAsistencia ? (ASISTENCIA_LABELS.get(estadoAsistencia) ?? labelOf(estadoAsistencia)) : null,
  };
}

export function toComplianceReportRow(row: CumplimientoReportRow): ComplianceReportRow {
  const sustentaciones = [...(row.sustentacion_retos ?? [])].sort((a, b) =>
    (b.fecha_sustentacion ?? "").localeCompare(a.fecha_sustentacion ?? "")
  );
  const ultima = sustentaciones[0] ?? null;
  return {
    id: row.id,
    reto: row.reto?.titulo ?? null,
    nivel: challengeLevel(row.reto?.orden ?? null),
    proyecto: row.proyecto?.titulo ?? null,
    emprendedor: row.proyecto?.emprendedor?.nombre_completo ?? null,
    fechaEntrega: row.fecha_entrega,
    estado: row.estado_cumplimiento,
    evidencia: row.archivo_evidencia,
    observacion: row.observacion,
    sustentaciones: sustentaciones.length,
    ultimaSustentacion: ultima?.fecha_sustentacion ?? null,
    ultimoResultado: ultima?.resultado ?? null,
  };
}

export function toPitchReportRow(pitch: Pitch): PitchReportRow {
  const nombres = pitch.evaluadores.flatMap((item) => (item.nombre ? [item.nombre] : []));
  return {
    ...pitch,
    evaluadoresNombres: nombres.length ? nombres.join(", ") : null,
    cumpleMinimo: pitch.totalEvaluadores >= MIN_EVALUADORES_POR_PITCH,
  };
}

export function fromConsolidatedResult(row: EvaluationResults): EvaluationReportRow {
  return {
    id: row.id,
    proyecto: row.proyecto,
    emprendedor: row.emprendedor,
    fechaPitch: row.fechaPitch,
    estadoPitch: row.estadoPitch,
    asignados: row.asignados,
    calificados: row.calificados,
    votosAprobado: row.votosAprobado,
    votosNoAprobado: row.votosNoAprobado,
    puntaje: row.puntajePromedio,
    estado: row.resultado,
    miResultado: null,
  };
}

export function fromMyEvaluation(row: Evaluacion): EvaluationReportRow {
  return {
    id: row.id,
    proyecto: row.proyecto,
    emprendedor: row.emprendedor,
    fechaPitch: row.fechaPitch,
    estadoPitch: row.estadoPitch,
    asignados: null,
    calificados: null,
    votosAprobado: null,
    votosNoAprobado: null,
    puntaje: row.calificacion?.puntaje ?? null,
    estado: row.estado,
    miResultado: labelOf(row.calificacion?.resultado ?? null),
  };
}

export function isPastDue(fecha: string | null, today = localDateKey(new Date().toISOString())): boolean {
  return fecha !== null && fecha.slice(0, 10) < today;
}

export function filterReportRows<T>(
  rows: readonly T[],
  filters: ReportFilters,
  accessors: {
    searchFields: (row: T) => Array<string | null>;
    estado: (row: T) => string | null;
    fecha: (row: T) => string | null;
  }
): T[] {
  return rows.filter((row) => {
    const fecha = accessors.fecha(row);
    const key = fecha ? (fecha.length > 10 ? localDateKey(fecha) : fecha) : "";
    return (
      matchesOption(filters.estado, accessors.estado(row)) &&
      (filters.desde === "" || (key !== "" && key >= filters.desde)) &&
      (filters.hasta === "" || (key !== "" && key <= filters.hasta)) &&
      matchesSearch(filters.search, ...accessors.searchFields(row))
    );
  });
}
