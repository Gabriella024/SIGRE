import type { ComplianceReportRow, EvaluationReportRow, OrientationReportRow, PitchReportRow } from "@/features/informes/types/types";

import type {
  AgendaItem,
  AlertItem,
  ChecklistItem,
  DashboardData,
  DashboardOptions,
  DashboardRole,
  DashboardSectionModel,
  DistributionItem,
  KpiItem,
  MonthlyPoint,
  MonthlySeries,
  NextStep,
  ProgressItem,
  RoleDashboardModel,
  SourceId,
} from "../types/dashboard";

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const AGENDA_LIMIT = 6;
const PROGRESS_LIMIT = 6;
const DISTRIBUTION_LIMIT = 6;

const RETO_POR_ENTREGAR = ["asignado", "requiere_ajustes", ""];
const RETO_ORDER = ["asignado", "entregado", "requiere_ajustes", "aprobado", "no_aprobado"];
const RETO_LABELS: Record<string, string> = {
  asignado: "Por entregar",
  entregado: "Entregado, por revisar",
  requiere_ajustes: "Requiere ajustes",
  aprobado: "Aprobado",
  no_aprobado: "No aprobado",
};

const PITCH_EN_CURSO = ["programado", "confirmado", "en_evaluacion"];
const PITCH_SIN_INICIAR = ["programado", "confirmado"];
const PITCH_LABELS: Record<string, string> = {
  programado: "Programado",
  confirmado: "Confirmado",
  en_evaluacion: "En evaluación",
  cerrado: "Cerrado",
  cancelado: "Cancelado",
};

const JORNADA_CANCELADA = ["cancelada", "cancelado"];

function norm(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function isOneOf(value: string | null | undefined, states: readonly string[]): boolean {
  return states.includes(norm(value));
}

function statusLabel(value: string | null, labels: Record<string, string> = {}): string | null {
  const key = norm(value);
  if (!key) return null;
  if (labels[key]) return labels[key];
  const text = (value ?? "").replace(/_/g, " ").trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function dayKey(value: string | null): string {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("en-CA");
}

function dateOnly(value: string | null): string {
  return value && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : "";
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00`) - Date.parse(`${from}T00:00:00`)) / 86_400_000);
}

function shortDate(key: string): string {
  return new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" }).format(new Date(`${key}T00:00:00`));
}

function count<T>(rows: readonly T[], predicate: (row: T) => boolean): number {
  return rows.reduce((total, row) => (predicate(row) ? total + 1 : total), 0);
}

function sum<T>(rows: readonly T[], value: (row: T) => number | null): number {
  return rows.reduce((total, row) => total + (value(row) ?? 0), 0);
}

function plural(value: number, singular: string, pluralForm: string): string {
  return `${value} ${value === 1 ? singular : pluralForm}`;
}

function joinParts(...parts: Array<string | null | undefined>): string | null {
  const text = parts.filter((part): part is string => Boolean(part?.trim())).join(" · ");
  return text || null;
}

interface Context {
  data: DashboardData;
  enabled: ReadonlySet<SourceId>;
  today: string;
  year: number;
  minEvaluadores: number;
}

function hasAll(ctx: Context, deps: readonly SourceId[]): boolean {
  return deps.every((dep) => ctx.enabled.has(dep));
}

function retoPendienteEntrega(row: ComplianceReportRow): boolean {
  return isOneOf(row.estado, RETO_POR_ENTREGAR);
}

function retoVencido(row: ComplianceReportRow, today: string): boolean {
  const fecha = dateOnly(row.fechaEntrega);
  return retoPendienteEntrega(row) && fecha !== "" && fecha < today;
}

function retoPorRevisar(row: ComplianceReportRow): boolean {
  return isOneOf(row.estado, ["entregado"]);
}

function pitchEnCurso(row: { estado: string | null }): boolean {
  return isOneOf(row.estado, PITCH_EN_CURSO);
}

function pitchSinMinimo(row: PitchReportRow, minEvaluadores: number): boolean {
  return pitchEnCurso(row) && row.totalEvaluadores < minEvaluadores;
}

function jornadaProxima(row: OrientationReportRow, today: string): boolean {
  return row.fecha !== null && dayKey(row.fecha) >= today && !isOneOf(row.estado, JORNADA_CANCELADA);
}

function evaluacionActiva(row: EvaluationReportRow): boolean {
  return !isOneOf(row.estadoPitch, ["cancelado"]);
}

function evaluacionCalificable(row: EvaluationReportRow): boolean {
  return isOneOf(row.estadoPitch, PITCH_EN_CURSO);
}

interface EvaluacionTotales {
  asignadas: number;
  calificadas: number;
  pendientes: number;
}

export function evaluacionTotales(rows: readonly EvaluationReportRow[]): EvaluacionTotales {
  const vigentes = rows.filter(evaluacionActiva);
  return {
    asignadas: sum(vigentes, (row) => row.asignados),
    calificadas: sum(vigentes, (row) => row.calificados),
    pendientes: sum(vigentes.filter(evaluacionCalificable), (row) => Math.max((row.asignados ?? 0) - (row.calificados ?? 0), 0)),
  };
}

function jornadaVigente(row: OrientationReportRow): boolean {
  return !isOneOf(row.estado, JORNADA_CANCELADA);
}

function monthly(dates: ReadonlyArray<{ date: string | null; weight: number }>, year: number): number[] {
  const totals = new Array<number>(12).fill(0);
  for (const item of dates) {
    const key = dayKey(item.date);
    if (key.startsWith(`${year}-`)) totals[Number(key.slice(5, 7)) - 1] += item.weight;
  }
  return totals;
}

function groupBy(values: ReadonlyArray<string | null>, emptyLabel: string, labels: Record<string, string> = {}, order?: readonly string[]): DistributionItem[] {
  const groups = new Map<string, DistributionItem>();
  for (const value of values) {
    const key = norm(value);
    const current = groups.get(key);
    groups.set(key, { label: current?.label ?? statusLabel(value, labels) ?? emptyLabel, value: (current?.value ?? 0) + 1 });
  }
  const entries = [...groups.entries()];
  if (order) {
    const rank = (key: string) => (order.includes(key) ? order.indexOf(key) : order.length);
    return entries.sort(([a], [b]) => rank(a) - rank(b)).map(([, item]) => item);
  }
  const sorted = entries.map(([, item]) => item).sort((a, b) => b.value - a.value);
  if (sorted.length <= DISTRIBUTION_LIMIT) return sorted;
  const rest = sorted.slice(DISTRIBUTION_LIMIT - 1);
  return [...sorted.slice(0, DISTRIBUTION_LIMIT - 1), { label: "Otros", value: sum(rest, (item) => item.value) }];
}

function monthlySection(ctx: Context): DashboardSectionModel | null {
  const candidates: Array<{ dep: SourceId; series: MonthlySeries; values: () => number[] }> = [
    {
      dep: "proyectos",
      series: { key: "proyectos", label: "Proyectos registrados", color: "brand" },
      values: () => monthly(ctx.data.proyectos.map((row) => ({ date: row.createdAt, weight: 1 })), ctx.year),
    },
    {
      dep: "orientaciones",
      series: { key: "asistencias", label: "Asistencias efectivas", color: "sky" },
      values: () => monthly(ctx.data.orientaciones.map((row) => ({ date: row.fecha, weight: row.asistieron ?? 0 })), ctx.year),
    },
  ];
  const active = candidates.filter((item) => ctx.enabled.has(item.dep));
  if (active.length === 0) return null;
  const values = active.map((item) => item.values());
  const data: MonthlyPoint[] = MONTHS.map((mes, index) => {
    const point: MonthlyPoint = { mes };
    active.forEach((item, position) => {
      point[item.series.key] = values[position][index];
    });
    return point;
  });
  return {
    kind: "monthly",
    id: "evolucion",
    title: "Evolución mensual",
    description: `Año ${ctx.year}`,
    deps: active.map((item) => item.dep),
    span: "wide",
    series: active.map((item) => item.series),
    data,
  };
}

function etapasSection(ctx: Context, title: string): DashboardSectionModel {
  return {
    kind: "distribution",
    id: "etapas",
    title,
    description: "Proyectos según su etapa actual",
    deps: ["proyectos"],
    span: "narrow",
    items: groupBy(ctx.data.proyectos.map((row) => row.etapa), "Sin etapa"),
    emptyMessage: "No hay proyectos registrados.",
  };
}

function retosSection(ctx: Context): DashboardSectionModel {
  return {
    kind: "distribution",
    id: "retos-estado",
    title: "Retos por estado",
    description: "Retos asignados a proyectos según su cumplimiento",
    deps: ["retos"],
    span: "narrow",
    items: groupBy(ctx.data.retos.map((row) => row.estado ?? "asignado"), "Por entregar", RETO_LABELS, RETO_ORDER),
    emptyMessage: "No hay retos asignados.",
  };
}

function evaluacionesProgress(ctx: Context, span: "narrow" | "wide", title: string): DashboardSectionModel {
  const items: ProgressItem[] = ctx.data.evaluaciones
    .filter((row) => evaluacionActiva(row) && (row.asignados ?? 0) > 0)
    .sort((a, b) => {
      const pendingA = (a.calificados ?? 0) < (a.asignados ?? 0) ? 0 : 1;
      const pendingB = (b.calificados ?? 0) < (b.asignados ?? 0) ? 0 : 1;
      return pendingA - pendingB || dayKey(b.fechaPitch).localeCompare(dayKey(a.fechaPitch));
    })
    .slice(0, PROGRESS_LIMIT)
    .map((row) => {
      const fecha = dayKey(row.fechaPitch);
      return {
        id: row.id,
        label: row.proyecto ?? "Proyecto no disponible",
        detail: joinParts(statusLabel(row.estadoPitch, PITCH_LABELS), fecha ? shortDate(fecha) : null),
        done: row.calificados ?? 0,
        total: row.asignados ?? 0,
      };
    });
  return {
    kind: "progress",
    id: "evaluaciones",
    title,
    description: "Calificaciones registradas frente a evaluadores asignados por pitch",
    deps: ["evaluaciones"],
    span,
    items,
    emptyMessage: "No hay pitch con evaluadores asignados.",
  };
}

function agendaItems(ctx: Context, include: { jornadas?: boolean; pitch?: boolean; retos?: boolean }): AgendaItem[] {
  const items: AgendaItem[] = [];
  if (include.jornadas) {
    for (const row of ctx.data.orientaciones) {
      if (!jornadaProxima(row, ctx.today)) continue;
      items.push({
        id: `jornada-${row.id}`,
        kind: "jornada",
        title: row.tema,
        detail: joinParts(row.horario, statusLabel(row.modalidad)),
        date: dayKey(row.fecha),
        status: row.miInscripcion,
        overdue: false,
      });
    }
  }
  if (include.pitch) {
    for (const row of ctx.data.pitch) {
      const fecha = dayKey(row.fechaHora);
      if (!pitchEnCurso(row) || !fecha || fecha < ctx.today) continue;
      items.push({
        id: `pitch-${row.id}`,
        kind: "pitch",
        title: row.proyecto ? `Pitch · ${row.proyecto}` : "Pitch",
        detail: joinParts(row.emprendedor, statusLabel(row.modalidad)),
        date: row.fechaHora ?? fecha,
        status: statusLabel(row.estado, PITCH_LABELS),
        overdue: false,
      });
    }
  }
  if (include.retos) {
    for (const row of ctx.data.retos) {
      const fecha = dateOnly(row.fechaEntrega);
      if (!retoPendienteEntrega(row) || !fecha || fecha < ctx.today) continue;
      items.push({
        id: `reto-${row.id}`,
        kind: "reto",
        title: `Entrega ${row.nivel}${row.reto ? ` · ${row.reto}` : ""}`,
        detail: joinParts(row.proyecto, row.emprendedor),
        date: fecha,
        status: statusLabel(row.estado ?? "asignado", RETO_LABELS),
        overdue: false,
      });
    }
  }
  return items.sort((a, b) => a.date.localeCompare(b.date)).slice(0, AGENDA_LIMIT);
}

function retoAlerts(ctx: Context, includeReview: boolean): AlertItem[] {
  const alerts: AlertItem[] = [];
  for (const row of ctx.data.retos) {
    const fecha = dateOnly(row.fechaEntrega);
    if (retoVencido(row, ctx.today)) {
      alerts.push({
        id: `reto-vencido-${row.id}`,
        severity: "alta",
        reason: "Entrega de reto vencida",
        subject: row.proyecto,
        detail: joinParts(row.nivel, row.emprendedor),
        date: fecha,
        days: daysBetween(fecha, ctx.today),
      });
    } else if (includeReview && retoPorRevisar(row)) {
      alerts.push({
        id: `reto-revision-${row.id}`,
        severity: "media",
        reason: "Entrega pendiente de revisión",
        subject: row.proyecto,
        detail: joinParts(row.nivel, row.emprendedor),
        date: fecha || null,
        days: null,
      });
    }
  }
  return alerts;
}

function pitchAlerts(ctx: Context): AlertItem[] {
  const alerts: AlertItem[] = [];
  for (const row of ctx.data.pitch) {
    const fecha = dayKey(row.fechaHora);
    if (pitchSinMinimo(row, ctx.minEvaluadores)) {
      alerts.push({
        id: `pitch-evaluadores-${row.id}`,
        severity: "alta",
        reason: `Pitch con ${row.totalEvaluadores} de ${ctx.minEvaluadores} evaluadores mínimos`,
        subject: row.proyecto,
        detail: row.emprendedor,
        date: row.fechaHora,
        days: null,
      });
    } else if (isOneOf(row.estado, PITCH_SIN_INICIAR) && fecha && fecha < ctx.today) {
      alerts.push({
        id: `pitch-fecha-${row.id}`,
        severity: "media",
        reason: "Pitch con fecha pasada sin iniciar evaluación",
        subject: row.proyecto,
        detail: joinParts(statusLabel(row.estado, PITCH_LABELS), row.emprendedor),
        date: row.fechaHora,
        days: daysBetween(fecha, ctx.today),
      });
    }
  }
  return alerts;
}

function sortAlerts(alerts: AlertItem[]): AlertItem[] {
  const rank = { alta: 0, media: 1 } as const;
  return alerts.sort((a, b) => rank[a.severity] - rank[b.severity] || (b.days ?? -1) - (a.days ?? -1));
}

function proyectosDelAnio(ctx: Context): number {
  return count(ctx.data.proyectos, (row) => dayKey(row.createdAt).startsWith(`${ctx.year}-`));
}

function emprendedoresActivos(ctx: Context): number {
  return count(ctx.data.emprendedores, (row) => isOneOf(row.estado, ["activo"]));
}

function jornadasProximas(ctx: Context): number {
  return count(ctx.data.orientaciones, (row) => jornadaProxima(row, ctx.today));
}

function inscripcionesActivas(ctx: Context): number {
  return sum(ctx.data.orientaciones, (row) => row.inscritos);
}

function asistencias(ctx: Context): number {
  return sum(ctx.data.orientaciones, (row) => row.asistieron);
}

function finalize(ctx: Context, role: DashboardRole, description: string, kpis: KpiItem[], sections: Array<DashboardSectionModel | null>): RoleDashboardModel {
  return {
    role,
    description,
    kpis: kpis.filter((kpi) => hasAll(ctx, kpi.deps)),
    sections: sections.filter((section): section is DashboardSectionModel => section !== null && section.deps.length > 0 && hasAll(ctx, section.deps)),
  };
}

function buildAdministrador(ctx: Context): RoleDashboardModel {
  const { data } = ctx;
  const evaluaciones = evaluacionTotales(data.evaluaciones);

  const kpis: KpiItem[] = [
    { id: "emprendedores", title: "Emprendedores", value: data.emprendedores.length, hint: plural(emprendedoresActivos(ctx), "activo", "activos"), icon: "users", tone: "green", deps: ["emprendedores"] },
    { id: "proyectos", title: "Proyectos", value: data.proyectos.length, hint: `${plural(proyectosDelAnio(ctx), "registrado", "registrados")} en ${ctx.year}`, icon: "projects", tone: "blue", deps: ["proyectos"] },
    { id: "jornadas", title: "Jornadas de orientación", value: count(data.orientaciones, jornadaVigente), hint: plural(jornadasProximas(ctx), "próxima", "próximas"), icon: "calendar", tone: "green", deps: ["orientaciones"] },
    { id: "asistencias", title: "Asistencias efectivas", value: asistencias(ctx), hint: plural(inscripcionesActivas(ctx), "inscripción activa", "inscripciones activas"), icon: "attendance", tone: "blue", deps: ["orientaciones"] },
    { id: "retos", title: "Retos asignados", value: data.retos.length, hint: plural(count(data.retos, (row) => isOneOf(row.estado, ["aprobado"])), "aprobado", "aprobados"), icon: "target", tone: "amber", deps: ["retos"] },
    { id: "pitch", title: "Pitch registrados", value: data.pitch.length, hint: `${count(data.pitch, pitchEnCurso)} en curso`, icon: "pitch", tone: "green", deps: ["pitch"] },
    { id: "evaluaciones", title: "Evaluaciones completas", value: evaluaciones.calificadas, hint: `de ${plural(evaluaciones.asignadas, "asignada", "asignadas")}`, icon: "evaluation", tone: "blue", deps: ["evaluaciones"] },
    { id: "usuarios", title: "Usuarios activos", value: count(data.usuarios, (row) => isOneOf(row.estado, ["activo"])), hint: `de ${plural(data.usuarios.length, "registrado", "registrados")}`, icon: "userCheck", tone: "green", deps: ["usuarios"] },
  ];

  const alertDeps: SourceId[] = (["retos", "pitch"] as const).filter((id) => ctx.enabled.has(id));
  return finalize(ctx, "administrador", "Indicadores globales de la ruta emprendedora.", kpis, [
    monthlySection(ctx),
    etapasSection(ctx, "Distribución por etapas"),
    evaluacionesProgress(ctx, "wide", "Seguimiento de evaluaciones"),
    retosSection(ctx),
    {
      kind: "alerts",
      id: "alertas",
      title: "Alertas y proyectos que requieren atención",
      description: "Entregas vencidas o por revisar y pitch sin el mínimo de evaluadores o con fecha pasada",
      deps: alertDeps,
      span: "full",
      items: sortAlerts([...(ctx.enabled.has("retos") ? retoAlerts(ctx, true) : []), ...(ctx.enabled.has("pitch") ? pitchAlerts(ctx) : [])]),
      emptyMessage: "No hay alertas abiertas.",
    },
  ]);
}

function buildCoordinador(ctx: Context): RoleDashboardModel {
  const { data } = ctx;
  const orientadores = new Set(data.emprendedores.flatMap((row) => (row.orientadorId ? [row.orientadorId] : [])));
  const sinOrientador = count(data.emprendedores, (row) => !row.orientadorId);
  const evaluaciones = evaluacionTotales(data.evaluaciones);

  const kpis: KpiItem[] = [
    { id: "emprendedores", title: "Emprendedores", value: data.emprendedores.length, hint: plural(emprendedoresActivos(ctx), "activo", "activos"), icon: "users", tone: "green", deps: ["emprendedores"] },
    { id: "orientadores", title: "Orientadores con emprendedores", value: orientadores.size, hint: plural(sinOrientador, "emprendedor sin orientador", "emprendedores sin orientador"), icon: "orientador", tone: sinOrientador > 0 ? "amber" : "blue", deps: ["emprendedores"] },
    { id: "proyectos", title: "Proyectos", value: data.proyectos.length, hint: `${plural(proyectosDelAnio(ctx), "registrado", "registrados")} en ${ctx.year}`, icon: "projects", tone: "blue", deps: ["proyectos"] },
    { id: "jornadas", title: "Jornadas de orientación", value: count(data.orientaciones, jornadaVigente), hint: plural(asistencias(ctx), "asistencia efectiva", "asistencias efectivas"), icon: "calendar", tone: "green", deps: ["orientaciones"] },
    { id: "retos-revision", title: "Retos por revisar", value: count(data.retos, retoPorRevisar), hint: plural(count(data.retos, (row) => retoVencido(row, ctx.today)), "entrega vencida", "entregas vencidas"), icon: "review", tone: "amber", deps: ["retos"] },
    { id: "evaluaciones-pendientes", title: "Evaluaciones pendientes", value: evaluaciones.pendientes, hint: plural(evaluaciones.calificadas, "evaluación completa", "evaluaciones completas"), icon: "pending", tone: "red", deps: ["evaluaciones"] },
  ];

  const alertDeps: SourceId[] = (["retos", "pitch"] as const).filter((id) => ctx.enabled.has(id));
  const agendaDeps: SourceId[] = (["orientaciones", "pitch"] as const).filter((id) => ctx.enabled.has(id));
  return finalize(ctx, "coordinador", "Seguimiento de la ruta emprendedora dentro de tu alcance de coordinación.", kpis, [
    etapasSection(ctx, "Avance por etapas"),
    {
      kind: "distribution",
      id: "orientadores",
      title: "Emprendedores por orientador",
      description: "Carga de acompañamiento asignada",
      deps: ["emprendedores"],
      span: "narrow",
      items: groupBy(data.emprendedores.map((row) => (row.orientadorId ? (row.orientador?.nombre ?? "Orientador sin nombre") : null)), "Sin orientador"),
      emptyMessage: "No hay emprendedores registrados.",
    },
    retosSection(ctx),
    {
      kind: "agenda",
      id: "agenda",
      title: "Próximas jornadas y pitch",
      description: "Actividades programadas desde hoy",
      deps: agendaDeps,
      span: "wide",
      items: agendaItems(ctx, { jornadas: ctx.enabled.has("orientaciones"), pitch: ctx.enabled.has("pitch") }),
      emptyMessage: "No hay jornadas ni pitch programados.",
    },
    evaluacionesProgress(ctx, "narrow", "Calificaciones en curso"),
    {
      kind: "alerts",
      id: "alertas",
      title: "Alertas de seguimiento",
      description: "Entregas vencidas o por revisar y pitch sin el mínimo de evaluadores o con fecha pasada",
      deps: alertDeps,
      span: "full",
      items: sortAlerts([...(ctx.enabled.has("retos") ? retoAlerts(ctx, true) : []), ...(ctx.enabled.has("pitch") ? pitchAlerts(ctx) : [])]),
      emptyMessage: "No hay alertas abiertas.",
    },
  ]);
}

function buildOrientador(ctx: Context): RoleDashboardModel {
  const { data } = ctx;
  const kpis: KpiItem[] = [
    { id: "emprendedores", title: "Mis emprendedores", value: data.emprendedores.length, hint: plural(emprendedoresActivos(ctx), "activo", "activos"), icon: "users", tone: "green", deps: ["emprendedores"] },
    { id: "proyectos", title: "Proyectos de mis emprendedores", value: data.proyectos.length, hint: `${plural(proyectosDelAnio(ctx), "registrado", "registrados")} en ${ctx.year}`, icon: "projects", tone: "blue", deps: ["proyectos"] },
    { id: "jornadas", title: "Mis jornadas", value: count(data.orientaciones, jornadaVigente), hint: plural(jornadasProximas(ctx), "próxima", "próximas"), icon: "calendar", tone: "green", deps: ["orientaciones"] },
    { id: "asistencias", title: "Asistencias efectivas", value: asistencias(ctx), hint: plural(inscripcionesActivas(ctx), "inscripción activa", "inscripciones activas"), icon: "attendance", tone: "blue", deps: ["orientaciones"] },
    { id: "retos-revision", title: "Retos por revisar", value: count(data.retos, retoPorRevisar), hint: plural(count(data.retos, (row) => retoVencido(row, ctx.today)), "entrega vencida", "entregas vencidas"), icon: "review", tone: "amber", deps: ["retos"] },
  ];

  const agendaDeps: SourceId[] = (["orientaciones", "pitch", "retos"] as const).filter((id) => ctx.enabled.has(id));
  return finalize(ctx, "orientador", "Tus emprendedores asignados y tus compromisos de acompañamiento.", kpis, [
    {
      kind: "agenda",
      id: "agenda",
      title: "Próximos compromisos",
      description: "Jornadas, pitch y entregas de retos desde hoy",
      deps: agendaDeps,
      span: "wide",
      items: agendaItems(ctx, { jornadas: ctx.enabled.has("orientaciones"), pitch: ctx.enabled.has("pitch"), retos: ctx.enabled.has("retos") }),
      emptyMessage: "No tienes compromisos programados.",
    },
    retosSection(ctx),
    {
      kind: "alerts",
      id: "alertas",
      title: "Requieren tu atención",
      description: "Entregas por revisar y entregas vencidas de tus emprendedores",
      deps: ["retos"],
      span: "wide",
      items: sortAlerts(retoAlerts(ctx, true)),
      emptyMessage: "No hay entregas pendientes de revisión ni vencidas.",
    },
    etapasSection(ctx, "Proyectos por etapa"),
  ]);
}

function buildEvaluador(ctx: Context): RoleDashboardModel {
  const { data } = ctx;
  const pendientes = data.evaluaciones.filter((row) => row.estado === "Pendiente" && evaluacionCalificable(row));
  const proximas = data.evaluaciones
    .filter((row) => evaluacionCalificable(row) && dayKey(row.fechaPitch) !== "" && dayKey(row.fechaPitch) >= ctx.today)
    .sort((a, b) => (a.fechaPitch ?? "").localeCompare(b.fechaPitch ?? ""));

  const kpis: KpiItem[] = [
    { id: "pitch", title: "Pitch asignados", value: data.evaluaciones.length, hint: `${count(data.evaluaciones, evaluacionCalificable)} en curso`, icon: "pitch", tone: "green", deps: ["evaluaciones"] },
    { id: "pendientes", title: "Evaluaciones pendientes", value: pendientes.length, hint: plural(count(pendientes, (row) => { const fecha = dayKey(row.fechaPitch); return fecha !== "" && fecha < ctx.today; }), "de pitch ya realizado", "de pitch ya realizados"), icon: "pending", tone: "amber", deps: ["evaluaciones"] },
    { id: "completadas", title: "Evaluaciones completadas", value: count(data.evaluaciones, (row) => row.estado === "Completado" && evaluacionActiva(row)), hint: null, icon: "evaluation", tone: "blue", deps: ["evaluaciones"] },
    { id: "proximas", title: "Próximas sesiones", value: proximas.length, hint: proximas.length ? `Próxima: ${shortDate(dayKey(proximas[0].fechaPitch))}` : "Sin sesiones programadas", icon: "clock", tone: "green", deps: ["evaluaciones"] },
  ];

  const alertas: AlertItem[] = pendientes.map((row) => {
    const fecha = dayKey(row.fechaPitch);
    const realizado = fecha !== "" && fecha < ctx.today;
    return {
      id: `evaluacion-${row.id}`,
      severity: realizado ? "alta" : "media",
      reason: realizado ? "Pitch realizado sin tu calificación" : "Calificación pendiente",
      subject: row.proyecto,
      detail: statusLabel(row.estadoPitch, PITCH_LABELS),
      date: row.fechaPitch,
      days: realizado ? daysBetween(fecha, ctx.today) : null,
    };
  });

  return finalize(ctx, "evaluador", "Los pitch que tienes asignados y tus calificaciones.", kpis, [
    {
      kind: "agenda",
      id: "sesiones",
      title: "Próximas sesiones de pitch",
      description: "Pitch asignados programados desde hoy",
      deps: ["evaluaciones"],
      span: "wide",
      items: proximas.slice(0, AGENDA_LIMIT).map((row) => ({
        id: `sesion-${row.id}`,
        kind: "pitch",
        title: row.proyecto ? `Pitch · ${row.proyecto}` : "Pitch",
        detail: row.emprendedor,
        date: row.fechaPitch ?? "",
        status: row.estado === "Completado" ? "Calificado" : statusLabel(row.estadoPitch, PITCH_LABELS),
        overdue: false,
      })),
      emptyMessage: "No tienes sesiones de pitch programadas.",
    },
    {
      kind: "alerts",
      id: "vencimientos",
      title: "Calificaciones pendientes",
      description: "Primero las de pitch ya realizados",
      deps: ["evaluaciones"],
      span: "narrow",
      items: sortAlerts(alertas),
      emptyMessage: "No tienes calificaciones pendientes.",
    },
  ]);
}

function retoChecklist(row: ComplianceReportRow, today: string): ChecklistItem {
  const estado = norm(row.estado) || "asignado";
  const fecha = dateOnly(row.fechaEntrega);
  const label = row.reto ? `${row.nivel} · ${row.reto}` : row.nivel;
  switch (estado) {
    case "aprobado":
      return { id: row.id, label, detail: null, state: "done", stateLabel: "Aprobado" };
    case "entregado":
      return { id: row.id, label, detail: "Tu orientador revisará la entrega", state: "review", stateLabel: "En revisión" };
    case "no_aprobado":
      return { id: row.id, label, detail: null, state: "blocked", stateLabel: "No aprobado" };
    default: {
      const vencido = fecha !== "" && fecha < today;
      return {
        id: row.id,
        label,
        detail: fecha ? `${vencido ? "Venció el" : "Entrega hasta el"} ${shortDate(fecha)}` : "Sin fecha de entrega",
        state: vencido ? "blocked" : "current",
        stateLabel: estado === "requiere_ajustes" ? "Requiere ajustes" : vencido ? "Vencido" : "Por entregar",
      };
    }
  }
}

function nextSteps(ctx: Context, latestPitch: PitchReportRow | null): NextStep[] {
  const steps: NextStep[] = [];
  if (ctx.enabled.has("proyectos") && ctx.data.proyectos.length === 0) {
    steps.push({ id: "proyecto", text: "Registra tu proyecto", detail: "Aún no tienes un proyecto en la ruta. Consulta con tu orientador.", tone: "action" });
  }
  if (ctx.enabled.has("retos")) {
    const ordered = [...ctx.data.retos].sort((a, b) => a.nivel.localeCompare(b.nivel, "es", { numeric: true }));
    for (const row of ordered) {
      const fecha = dateOnly(row.fechaEntrega);
      if (isOneOf(row.estado, ["requiere_ajustes"])) {
        steps.push({ id: `reto-${row.id}`, text: `Ajusta y vuelve a entregar ${row.nivel}`, detail: row.observacion ?? row.reto, tone: "action" });
      } else if (retoPendienteEntrega(row)) {
        steps.push({
          id: `reto-${row.id}`,
          text: `Entrega ${row.nivel}${row.reto ? ` · ${row.reto}` : ""}`,
          detail: fecha ? `${fecha < ctx.today ? "Venció el" : "Fecha límite:"} ${shortDate(fecha)}` : null,
          tone: "action",
        });
      } else if (retoPorRevisar(row)) {
        steps.push({ id: `reto-${row.id}`, text: `${row.nivel} está en revisión`, detail: "Tu orientador revisará la entrega.", tone: "waiting" });
      }
    }
  }
  if (ctx.enabled.has("orientaciones")) {
    const proxima = ctx.data.orientaciones
      .filter((row) => jornadaProxima(row, ctx.today) && norm(row.miInscripcion) !== "cancelado")
      .sort((a, b) => dayKey(a.fecha).localeCompare(dayKey(b.fecha)))[0];
    if (proxima) {
      steps.push({ id: `jornada-${proxima.id}`, text: `Asiste a «${proxima.tema}»`, detail: joinParts(shortDate(dayKey(proxima.fecha)), proxima.horario), tone: "action" });
    }
  }
  if (latestPitch) {
    const fecha = dayKey(latestPitch.fechaHora);
    if (isOneOf(latestPitch.estado, PITCH_SIN_INICIAR) && fecha >= ctx.today) {
      steps.push({ id: "pitch", text: "Prepara la presentación de tu pitch", detail: `Programado para el ${shortDate(fecha)}`, tone: "action" });
    } else if (isOneOf(latestPitch.estado, ["en_evaluacion"])) {
      steps.push({ id: "pitch", text: "Tu pitch está en evaluación", detail: "El panel de evaluadores registra sus calificaciones.", tone: "waiting" });
    }
  }
  if (steps.length === 0) {
    steps.push({ id: "al-dia", text: "Estás al día", detail: "No tienes acciones pendientes en este momento.", tone: "done" });
  }
  return steps.slice(0, 5);
}

function buildEmprendedor(ctx: Context): RoleDashboardModel {
  const { data } = ctx;
  const proyectos = [...data.proyectos].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const principal = proyectos[0] ?? null;
  const pitches = [...data.pitch]
    .filter((row) => !principal || !row.proyectoId || row.proyectoId === principal.id)
    .sort((a, b) => Number(isOneOf(a.estado, ["cancelado"])) - Number(isOneOf(b.estado, ["cancelado"])) || (b.fechaHora ?? "").localeCompare(a.fechaHora ?? ""));
  const latestPitch = ctx.enabled.has("pitch") ? (pitches[0] ?? null) : null;
  const retos = [...data.retos].sort((a, b) => a.nivel.localeCompare(b.nivel, "es", { numeric: true }));

  const agenda: AgendaItem[] = [...data.orientaciones]
    .sort((a, b) => {
      const fa = dayKey(a.fecha);
      const fb = dayKey(b.fecha);
      const ua = fa >= ctx.today ? 0 : 1;
      const ub = fb >= ctx.today ? 0 : 1;
      return ua - ub || (ua === 0 ? fa.localeCompare(fb) : fb.localeCompare(fa));
    })
    .slice(0, AGENDA_LIMIT)
    .map((row) => ({
      id: `jornada-${row.id}`,
      kind: "jornada",
      title: row.tema,
      detail: joinParts(row.horario, statusLabel(row.modalidad)),
      date: dayKey(row.fecha),
      status: row.miAsistencia ?? row.miInscripcion,
      overdue: false,
    }));

  const stepDeps: SourceId[] = (["proyectos", "retos", "orientaciones", "pitch"] as const).filter((id) => ctx.enabled.has(id));
  return finalize(ctx, "emprendedor", "Tu proyecto y tus próximos pasos en la ruta emprendedora.", [], [
    {
      kind: "project",
      id: "proyecto",
      title: "Mi proyecto",
      description: "Etapa, estado y pitch de tu proyecto",
      deps: ["proyectos"],
      span: "wide",
      project: principal
        ? { titulo: principal.titulo, etapa: principal.etapa, estado: principal.estado, sector: principal.sector, otros: proyectos.length - 1 }
        : null,
      pitch: latestPitch ? { estado: latestPitch.estado, estadoLabel: statusLabel(latestPitch.estado, PITCH_LABELS), fechaHora: latestPitch.fechaHora, modalidad: statusLabel(latestPitch.modalidad) } : null,
      showPitch: ctx.enabled.has("pitch"),
    },
    { kind: "steps", id: "pasos", title: "Próximos pasos", description: "Lo que sigue en tu ruta", deps: stepDeps, span: "narrow", items: nextSteps(ctx, latestPitch) },
    {
      kind: "checklist",
      id: "retos",
      title: "Avance de retos",
      description: "Retos asignados a tu proyecto",
      deps: ["retos"],
      span: "narrow",
      items: retos.map((row) => retoChecklist(row, ctx.today)),
      done: count(retos, (row) => isOneOf(row.estado, ["aprobado"])),
      emptyMessage: "Aún no tienes retos asignados.",
    },
    {
      kind: "agenda",
      id: "orientaciones",
      title: "Mis orientaciones",
      description: "Jornadas en las que estás inscrito y tu asistencia",
      deps: ["orientaciones"],
      span: "wide",
      items: agenda,
      emptyMessage: "Aún no estás inscrito en jornadas de orientación.",
    },
  ]);
}

export function buildRoleDashboard(
  role: DashboardRole,
  data: DashboardData,
  enabled: ReadonlySet<SourceId>,
  options: DashboardOptions
): RoleDashboardModel {
  const vigentes: DashboardData = {
    ...data,
    retos: data.retos.filter((row) => !row.archivado),
    pitch: data.pitch.filter((row) => !row.proyectoArchivado),
    evaluaciones: data.evaluaciones.filter((row) => !row.proyectoArchivado),
  };
  const ctx: Context = {
    data: vigentes,
    enabled,
    today: options.now.toLocaleDateString("en-CA"),
    year: options.now.getFullYear(),
    minEvaluadores: options.minEvaluadores,
  };
  switch (role) {
    case "administrador":
      return buildAdministrador(ctx);
    case "coordinador":
      return buildCoordinador(ctx);
    case "orientador":
      return buildOrientador(ctx);
    case "evaluador":
      return buildEvaluador(ctx);
    case "emprendedor":
      return buildEmprendedor(ctx);
  }
}

export const DASHBOARD_SOURCES_BY_ROLE: Record<DashboardRole, readonly SourceId[]> = {
  administrador: ["emprendedores", "proyectos", "orientaciones", "retos", "pitch", "evaluaciones", "usuarios"],
  coordinador: ["emprendedores", "proyectos", "orientaciones", "retos", "pitch", "evaluaciones"],
  orientador: ["emprendedores", "proyectos", "orientaciones", "retos", "pitch"],
  evaluador: ["evaluaciones"],
  emprendedor: ["proyectos", "orientaciones", "retos", "pitch"],
};
