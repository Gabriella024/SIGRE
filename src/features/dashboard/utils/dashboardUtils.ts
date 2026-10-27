import { formatStatusLabel, localDateKey, normalizeText } from "@/lib/format";
import { MIN_EVALUADORES_POR_PITCH } from "@/features/evaluators/utils/evaluatorUtils";
import { isPastDue } from "@/features/informes/utils/informesUtils";
import type { ComplianceReportRow, DataScope, PitchReportRow } from "@/features/informes/types/types";

import type { AttentionRow, FunnelItem, MonthlyCount } from "../types/dashboard";

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const CLOSED_PITCH_STATES = new Set(["cerrado", "cancelado"]);

export function countBy<T>(rows: readonly T[], predicate: (row: T) => boolean): number {
  return rows.reduce((total, row) => (predicate(row) ? total + 1 : total), 0);
}

export function sumBy<T>(rows: readonly T[], value: (row: T) => number | null): number {
  return rows.reduce((total, row) => total + (value(row) ?? 0), 0);
}

export function isEstado(value: string | null, estado: string): boolean {
  return normalizeText(value) === estado;
}

export function monthlyCounts(dates: ReadonlyArray<string | null>, year: number): MonthlyCount[] {
  const totals = new Array<number>(12).fill(0);
  for (const value of dates) {
    const key = value ? localDateKey(value) : "";
    if (key.startsWith(`${year}-`)) totals[Number(key.slice(5, 7)) - 1] += 1;
  }
  return MONTHS.map((mes, index) => ({ mes, total: totals[index] }));
}

export function groupCounts(values: ReadonlyArray<string | null>, emptyLabel: string): FunnelItem[] {
  const groups = new Map<string, FunnelItem>();
  for (const value of values) {
    const key = normalizeText(value);
    const etapa = key ? formatStatusLabel(value ?? "") : emptyLabel;
    const current = groups.get(key);
    groups.set(key, { etapa: current?.etapa ?? etapa, valor: (current?.valor ?? 0) + 1 });
  }
  return [...groups.values()].sort((a, b) => b.valor - a.valor);
}

export function hasMissingEvaluators(pitch: PitchReportRow): boolean {
  return !CLOSED_PITCH_STATES.has(normalizeText(pitch.estado)) && pitch.totalEvaluadores < MIN_EVALUADORES_POR_PITCH;
}

function daysSince(fecha: string, today: Date): number {
  const date = new Date(fecha.length > 10 ? fecha : `${fecha}T00:00:00`);
  return Math.max(0, Math.floor((today.getTime() - date.getTime()) / 86_400_000));
}

export function buildAttentionRows(
  compliance: readonly ComplianceReportRow[],
  pitches: readonly PitchReportRow[],
  today = new Date()
): AttentionRow[] {
  const overdue = compliance
    .filter((row) => row.sustentaciones === 0 && isPastDue(row.fechaEntrega))
    .map<AttentionRow>((row) => ({
      id: `reto-${row.id}`,
      proyecto: row.proyecto,
      emprendedor: row.emprendedor,
      etapa: `Reto ${row.nivel}`,
      motivo: "Entrega vencida sin sustentación",
      fecha: row.fechaEntrega,
      dias: row.fechaEntrega ? daysSince(row.fechaEntrega, today) : null,
    }));

  const missing = pitches.filter(hasMissingEvaluators).map<AttentionRow>((row) => ({
    id: `pitch-${row.id}`,
    proyecto: row.proyecto,
    emprendedor: row.emprendedor,
    etapa: "Pitch",
    motivo: `${row.totalEvaluadores} de ${MIN_EVALUADORES_POR_PITCH} evaluadores mínimos`,
    fecha: row.fechaHora,
    dias: null,
  }));

  return [...overdue.sort((a, b) => (b.dias ?? 0) - (a.dias ?? 0)), ...missing];
}

export function panelSubtitle(scope: DataScope, year: number): string {
  switch (scope.kind) {
    case "global":
      return scope.role === "administrador" ? `Año ${year} · Información global` : `Año ${year} · Alcance de coordinación`;
    case "orientador":
      return `Año ${year} · Tus emprendedores asignados`;
    case "evaluador":
      return `Año ${year} · Pitch asignados a ti`;
    case "emprendedor":
      return `Año ${year} · Tus registros`;
  }
}
