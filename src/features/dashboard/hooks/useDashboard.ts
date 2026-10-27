import { Calendar, ClipboardCheck, FileBadge, Presentation, Sparkles, Target, Users, type LucideIcon } from "lucide-react";

import { useAvailableReports, useDataScope, useReportData } from "@/features/informes/hooks/useInformes";
import type { DataScope, ReportId } from "@/features/informes/types/types";

import { isPastDue } from "@/features/informes/utils/informesUtils";
import { localDateKey } from "@/lib/format";

import { buildAttentionRows, countBy, groupCounts, hasMissingEvaluators, isEstado, monthlyCounts, sumBy } from "../utils/dashboardUtils";

import type { AttentionRow, FunnelItem, MonthlyCount } from "../types/dashboard";

type Tone = "blue" | "green" | "red" | "amber";

export interface DashboardIndicator {
  id: ReportId;
  title: string;
  value: number | null;
  hint: string;
  icon: LucideIcon;
  tone: Tone;
}

export interface DashboardSection<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

export interface DashboardFailure {
  id: ReportId;
  label: string;
  error: string;
  reload: () => void;
}

const LABELS: Record<ReportId, string> = {
  emprendedores: "emprendedores",
  proyectos: "proyectos",
  orientaciones: "orientaciones",
  retos: "retos",
  pitch: "pitch",
  evaluaciones: "evaluaciones",
};

function titleFor(id: ReportId, scope: DataScope): string {
  const own = scope.kind === "emprendedor";
  const assigned = scope.kind === "orientador";
  switch (id) {
    case "emprendedores":
      return assigned ? "Mis emprendedores" : "Total de emprendedores";
    case "proyectos":
      return own ? "Mis proyectos" : assigned ? "Proyectos de mis emprendedores" : "Total de proyectos";
    case "orientaciones":
      return own ? "Mis orientaciones" : assigned ? "Mis jornadas asignadas" : "Jornadas de orientación";
    case "retos":
      return own ? "Mis retos asignados" : "Retos asignados a proyectos";
    case "pitch":
      return scope.kind === "evaluador" ? "Pitch asignados" : own ? "Mis pitch" : "Pitch programados";
    case "evaluaciones":
      return scope.kind === "evaluador" ? "Evaluaciones completadas" : "Pitch con calificación completa";
  }
}

function sectionOf<T, R>(query: { data: T[] | null; isLoading: boolean; error: string | null }, enabled: boolean, build: (rows: T[]) => R): DashboardSection<R> {
  if (!enabled) return { data: null, isLoading: false, error: null };
  return {
    data: query.data ? build(query.data) : null,
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useDashboard() {
  const scope = useDataScope();
  const available = useAvailableReports(scope);
  const enabled = (id: ReportId) =>
    available.includes(id) && !(id === "emprendedores" && scope?.kind === "emprendedor");

  const emprendedores = useReportData("emprendedores", scope, enabled("emprendedores"));
  const proyectos = useReportData("proyectos", scope, enabled("proyectos"));
  const orientaciones = useReportData("orientaciones", scope, enabled("orientaciones"));
  const retos = useReportData("retos", scope, enabled("retos"));
  const pitch = useReportData("pitch", scope, enabled("pitch"));
  const evaluaciones = useReportData("evaluaciones", scope, enabled("evaluaciones"));

  const queries = { emprendedores, proyectos, orientaciones, retos, pitch, evaluaciones };
  const enabledIds = (Object.keys(queries) as ReportId[]).filter(enabled);
  const year = new Date().getFullYear();

  const buildIndicators = (scope: DataScope): DashboardIndicator[] => {
    const tones: Tone[] = ["blue", "green", "amber", "red"];
    const hints: Record<ReportId, () => string> = {
      emprendedores: () => `${countBy(emprendedores.data ?? [], (row) => isEstado(row.estado, "activo"))} activos`,
      proyectos: () =>
        `${countBy(proyectos.data ?? [], (row) => localDateKey(row.createdAt).startsWith(`${year}-`))} registrados en ${year}`,
      orientaciones: () =>
        scope.kind === "emprendedor"
          ? `${countBy(orientaciones.data ?? [], (row) => row.miAsistencia === "Asistió")} con asistencia registrada`
          : `${sumBy(orientaciones.data ?? [], (row) => row.asistieron)} asistencias registradas`,
      retos: () => {
        const rows = retos.data ?? [];
        const sustentados = countBy(rows, (row) => row.sustentaciones > 0);
        const vencidos = countBy(rows, (row) => row.sustentaciones === 0 && isPastDue(row.fechaEntrega));
        return `${sustentados} con sustentación · ${vencidos} vencidos`;
      },
      pitch: () =>
        scope.kind === "evaluador"
          ? `${countBy(pitch.data ?? [], (row) => !isEstado(row.estado, "cerrado") && !isEstado(row.estado, "cancelado"))} sin cerrar`
          : `${countBy(pitch.data ?? [], hasMissingEvaluators)} con menos de 2 evaluadores`,
      evaluaciones: () =>
        scope.kind === "evaluador"
          ? `${countBy(evaluaciones.data ?? [], (row) => row.estado === "Pendiente")} pendientes`
          : `${countBy(evaluaciones.data ?? [], (row) => row.estado === "En revisión")} en revisión`,
    };
    const values: Record<ReportId, () => number> = {
      emprendedores: () => emprendedores.data?.length ?? 0,
      proyectos: () => proyectos.data?.length ?? 0,
      orientaciones: () => orientaciones.data?.length ?? 0,
      retos: () => retos.data?.length ?? 0,
      pitch: () => pitch.data?.length ?? 0,
      evaluaciones: () =>
        countBy(evaluaciones.data ?? [], (row) =>
          scope.kind === "evaluador" ? row.estado === "Completado" : row.estado === "Calificación completa"
        ),
    };
    const icons: Record<ReportId, LucideIcon> = {
      emprendedores: Users,
      proyectos: Presentation,
      orientaciones: Calendar,
      retos: Target,
      pitch: Sparkles,
      evaluaciones: scope.kind === "evaluador" ? ClipboardCheck : FileBadge,
    };

    return enabledIds.map((id, index) => {
      const query = queries[id];
      const ready = query.data !== null && !query.error;
      return {
        id,
        title: titleFor(id, scope),
        value: ready ? values[id]() : null,
        hint: query.error ? "No fue posible cargar" : ready ? hints[id]() : "Cargando...",
        icon: icons[id],
        tone: tones[index % tones.length],
      };
    });
  };

  const usesProjects = enabled("proyectos");
  const timeline: DashboardSection<MonthlyCount[]> = usesProjects
    ? sectionOf(proyectos, true, (rows) => monthlyCounts(rows.map((row) => row.createdAt), year))
    : sectionOf(pitch, enabled("pitch"), (rows) => monthlyCounts(rows.map((row) => row.fechaHora), year));

  const funnel: DashboardSection<FunnelItem[]> = usesProjects
    ? sectionOf(proyectos, true, (rows) => groupCounts(rows.map((row) => row.etapa), "Sin etapa"))
    : sectionOf(pitch, enabled("pitch"), (rows) => groupCounts(rows.map((row) => row.estado), "Sin estado"));

  const attentionEnabled = scope?.kind !== "evaluador" && (enabled("retos") || enabled("pitch"));
  const attention: DashboardSection<AttentionRow[]> = !attentionEnabled
    ? { data: null, isLoading: false, error: null }
    : {
        data:
          (!enabled("retos") || retos.data) && (!enabled("pitch") || pitch.data)
            ? buildAttentionRows(retos.data ?? [], pitch.data ?? [])
            : null,
        isLoading: (enabled("retos") && retos.isLoading) || (enabled("pitch") && pitch.isLoading),
        error: (enabled("retos") ? retos.error : null) ?? (enabled("pitch") ? pitch.error : null),
      };

  const failures: DashboardFailure[] = enabledIds.flatMap((id) => {
    const error = queries[id].error;
    return error ? [{ id, label: LABELS[id], error, reload: queries[id].reload }] : [];
  });

  return {
    scope,
    year,
    indicators: scope ? buildIndicators(scope) : [],
    timeline: { ...timeline, title: usesProjects ? "Proyectos registrados por mes" : "Pitch por mes" },
    funnel: { ...funnel, title: usesProjects ? "Proyectos por etapa" : "Pitch por estado" },
    attention,
    failures,
    isLoading: enabledIds.some((id) => queries[id].isLoading && !queries[id].data),
  };
}
