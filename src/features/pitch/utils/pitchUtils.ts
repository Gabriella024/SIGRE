import { localDateKey, matchesOption, matchesSearch } from "@/lib/format";
import { personName } from "@/lib/personName";
import {
  MAX_EVALUADORES_POR_PITCH,
  MIN_EVALUADORES_POR_PITCH,
} from "@/features/evaluators/utils/evaluatorUtils";

import { PITCH_ESTADOS, PITCH_ESTADOS_REQUIEREN_EVALUADORES, type AsignacionRow, type PitchRow, type PreparacionRow } from "../schemas/pitchSchema";
import type { Pitch, PitchAssignment, PitchFilters, PitchPreparation } from "../types/pitch";

export const INITIAL_PITCH_FILTERS: PitchFilters = { search: "", estado: "", modalidad: "", fecha: "" };

export function toPitchAssignment(row: AsignacionRow): PitchAssignment {
  return {
    id: row.id,
    evaluadorId: row.id_evaluador_fk,
    usuarioId: row.evaluador?.id_usuario_fk ?? null,
    nombre: personName(row.evaluador?.usuario),
    especialidad: row.evaluador?.especialidad ?? null,
    estado: row.estado,
    fechaAsignacion: row.fecha_asignacion,
    updatedAt: row.updated_at,
  };
}

export function toPitch(row: PitchRow): Pitch {
  const evaluadores = (row.asignacion_evaluadores ?? []).filter((item) => item.deleted_at === null).map(toPitchAssignment);
  return {
    id: row.id,
    proyectoId: row.id_proyecto_fk,
    proyecto: row.proyecto?.titulo ?? null,
    emprendedor: row.proyecto?.emprendedor?.nombre_completo ?? null,
    fechaHora: row.fecha_hora,
    modalidad: row.modalidad,
    lugarLink: row.lugar_link,
    estado: row.estado,
    observacion: row.observacion,
    updatedAt: row.updated_at,
    evaluadores,
    totalEvaluadores: evaluadores.length,
  };
}

export function toPitchPreparation(row: PreparacionRow): PitchPreparation {
  return {
    id: row.id,
    proyecto: row.proyecto?.titulo ?? null,
    emprendedor: row.proyecto?.emprendedor?.nombre_completo ?? null,
    orientador: personName(row.orientador),
    fecha: row.fecha,
    estado: row.estado,
    observacion: row.observacion,
  };
}

export function formatDateTime(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });
}

export function toDateTimeLocal(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

const PITCH_ESTADOS_SIN_CAMBIO_EVALUADORES: readonly string[] = ["en_evaluacion", "cerrado", "cancelado"];

export function pitchEstadoLabel(estado: string | null): string | null {
  return PITCH_ESTADOS.find((item) => item.value === estado)?.label ?? null;
}

export function canRemoveEvaluators(pitch: Pick<Pitch, "estado">): boolean {
  return !PITCH_ESTADOS_SIN_CAMBIO_EVALUADORES.includes(pitch.estado ?? "");
}

export function canAssignMoreEvaluators(pitch: Pick<Pitch, "totalEvaluadores">): boolean {
  return pitch.totalEvaluadores < MAX_EVALUADORES_POR_PITCH;
}

export function pitchEstadoBlockReason(pitch: Pick<Pitch, "totalEvaluadores">, estado: string): string | null {
  if (PITCH_ESTADOS_REQUIEREN_EVALUADORES.includes(estado) && pitch.totalEvaluadores < MIN_EVALUADORES_POR_PITCH) {
    return `Se requieren al menos ${MIN_EVALUADORES_POR_PITCH} evaluadores asignados para confirmar o iniciar la evaluación.`;
  }
  return null;
}

export function filterPitches(rows: readonly Pitch[], filters: PitchFilters): Pitch[] {
  return rows.filter(
    (row) =>
      matchesOption(filters.estado, row.estado) &&
      matchesOption(filters.modalidad, row.modalidad) &&
      (filters.fecha === "" || (row.fechaHora !== null && localDateKey(row.fechaHora) === filters.fecha)) &&
      matchesSearch(filters.search, row.proyecto, row.emprendedor, row.lugarLink, ...row.evaluadores.map((e) => e.nombre))
  );
}

export function filterPreparations(rows: readonly PitchPreparation[], filters: PitchFilters): PitchPreparation[] {
  return rows.filter(
    (row) =>
      matchesOption(filters.estado, row.estado) &&
      (filters.fecha === "" || (row.fecha !== null && row.fecha.slice(0, 10) === filters.fecha)) &&
      matchesSearch(filters.search, row.proyecto, row.emprendedor, row.orientador)
  );
}
