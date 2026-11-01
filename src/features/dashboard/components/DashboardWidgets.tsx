import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Circle,
  CircleDot,
  Clock,
  Presentation,
  Sparkles,
  Target,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { EmptyPanel } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EtapaBadge } from "@/features/projects/components/ProjectEtapaBadge";
import { cn } from "@/lib/utils";

import type {
  AgendaItem,
  AgendaKind,
  AlertItem,
  ChecklistItem,
  ChecklistState,
  DistributionItem,
  MonthlyPoint,
  MonthlySeries,
  NextStep,
  PitchSummary,
  ProgressItem,
  ProjectSummary,
  StepTone,
} from "../types/dashboard";

const SERIES_COLORS: Record<MonthlySeries["color"], string> = { brand: "#39a900", sky: "#0284c7" };
const AXIS = "#94a3b8";
const ALERT_LIMIT = 8;

function dayParts(value: string) {
  const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(isDateOnly ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return null;
  return {
    day: date.getDate(),
    month: new Intl.DateTimeFormat("es-CO", { month: "short" }).format(date).replace(".", ""),
    weekday: new Intl.DateTimeFormat("es-CO", { weekday: "long" }).format(date),
    time: isDateOnly ? null : new Intl.DateTimeFormat("es-CO", { hour: "numeric", minute: "2-digit" }).format(date),
    full: new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short", year: "numeric" }).format(date),
  };
}

function formatShort(value: string | null): string {
  if (!value) return "Sin fecha";
  return dayParts(value)?.full ?? value;
}

function ProgressBar({ done, total, className }: { done: number; total: number; className?: string }) {
  const percent = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-100", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
    >
      <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${percent}%` }} />
    </div>
  );
}

export function MonthlyChart({ series, data }: { series: readonly MonthlySeries[]; data: readonly MonthlyPoint[] }) {
  const hasData = data.some((point) => series.some((item) => Number(point[item.key]) > 0));
  if (!hasData) return <EmptyPanel>No hay registros en este periodo.</EmptyPanel>;

  return (
    <div className="space-y-3">
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
        {series.map((item) => (
          <li key={item.key} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: SERIES_COLORS[item.color] }} aria-hidden="true" />
            {item.label}
          </li>
        ))}
      </ul>
      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={[...data]} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barGap={2}>
            <CartesianGrid vertical={false} stroke="#eef2f0" />
            <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={12} stroke={AXIS} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} stroke={AXIS} />
            <Tooltip
              cursor={{ fill: "#f2f9ec" }}
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px -4px rgba(15,23,42,0.12)", fontSize: 12 }}
            />
            {series.map((item) => (
              <Bar key={item.key} dataKey={item.key} name={item.label} fill={SERIES_COLORS[item.color]} radius={[5, 5, 0, 0]} maxBarSize={22} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function DistributionList({ items, emptyMessage }: { items: readonly DistributionItem[]; emptyMessage: string }) {
  if (items.length === 0) return <EmptyPanel>{emptyMessage}</EmptyPanel>;
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.label} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="truncate font-medium text-slate-600">{item.label}</span>
            <span className="font-semibold text-slate-900 tabular-nums">{item.value}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${Math.max((item.value / max) * 100, 6)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

const AGENDA_ICONS: Record<AgendaKind, LucideIcon> = { jornada: CalendarDays, pitch: Sparkles, reto: Target };

export function AgendaList({ items, emptyMessage }: { items: readonly AgendaItem[]; emptyMessage: string }) {
  if (items.length === 0) return <EmptyPanel>{emptyMessage}</EmptyPanel>;

  return (
    <ul className="divide-y divide-slate-100">
      {items.map((item) => {
        const parts = dayParts(item.date);
        const Icon = AGENDA_ICONS[item.kind];
        return (
          <li key={item.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
            <div className="flex w-12 shrink-0 flex-col items-center rounded-xl bg-brand-50 py-1.5 ring-1 ring-inset ring-brand-100">
              <span className="text-[0.625rem] font-semibold uppercase tracking-wide text-brand-700">{parts?.month ?? "—"}</span>
              <span className="text-lg font-semibold leading-none text-brand-900 tabular-nums">{parts?.day ?? "—"}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate text-sm font-medium text-slate-900">
                <Icon className="h-3.5 w-3.5 shrink-0 stroke-[1.75] text-slate-400" aria-hidden="true" />
                <span className="truncate">{item.title}</span>
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-600">
                {[parts?.weekday, parts?.time, item.detail].filter(Boolean).join(" · ")}
              </p>
            </div>
            {item.status && (
              <span className="hidden shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200 sm:inline-flex">
                {item.status}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function AlertList({ items, emptyMessage }: { items: readonly AlertItem[]; emptyMessage: string }) {
  if (items.length === 0) {
    return (
      <p className="flex items-center gap-3 rounded-xl bg-brand-50 px-4 py-4 text-sm text-brand-800 ring-1 ring-inset ring-brand-100">
        <CheckCircle2 className="h-5 w-5 shrink-0 stroke-[1.75] text-brand-600" aria-hidden="true" />
        {emptyMessage}
      </p>
    );
  }

  const visible = items.slice(0, ALERT_LIMIT);
  return (
    <div className="space-y-3">
      <ul className="divide-y divide-slate-100">
        {visible.map((item) => (
          <li key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <span
              className={cn(
                "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
                item.severity === "alta" ? "bg-rose-50 text-rose-600 ring-rose-100" : "bg-amber-50 text-amber-600 ring-amber-100"
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5 stroke-[2]" aria-hidden="true" />
              <span className="sr-only">Prioridad {item.severity}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900">{item.reason}</p>
              <p className="mt-0.5 truncate text-xs text-slate-600">
                {[item.subject ?? "Proyecto no disponible", item.detail].filter(Boolean).join(" · ")}
              </p>
            </div>
            <div className="shrink-0 text-right text-xs">
              <p className="text-slate-600 tabular-nums">{formatShort(item.date)}</p>
              {item.days !== null && item.days > 0 && (
                <p className={cn("font-medium tabular-nums", item.severity === "alta" ? "text-rose-600" : "text-amber-700")}>
                  hace {item.days} {item.days === 1 ? "día" : "días"}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
      {items.length > visible.length && (
        <p className="text-xs text-slate-500">y {items.length - visible.length} más. Consulta el detalle en el módulo correspondiente.</p>
      )}
    </div>
  );
}

export function ProgressList({ items, emptyMessage }: { items: readonly ProgressItem[]; emptyMessage: string }) {
  if (items.length === 0) return <EmptyPanel>{emptyMessage}</EmptyPanel>;

  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.id} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{item.label}</p>
              {item.detail && <p className="truncate text-xs text-slate-600">{item.detail}</p>}
            </div>
            <span className={cn("shrink-0 text-xs font-semibold tabular-nums", item.done >= item.total ? "text-brand-700" : "text-slate-700")}>
              {item.done}/{item.total}
            </span>
          </div>
          <ProgressBar done={item.done} total={item.total} />
        </li>
      ))}
    </ul>
  );
}

const CHECKLIST_STYLES: Record<ChecklistState, { icon: LucideIcon; iconClass: string; badge: string }> = {
  done: { icon: CheckCircle2, iconClass: "text-brand-600", badge: "bg-brand-50 text-brand-800 ring-brand-100" },
  review: { icon: Clock, iconClass: "text-sky-600", badge: "bg-sky-50 text-sky-800 ring-sky-100" },
  current: { icon: CircleDot, iconClass: "text-amber-600", badge: "bg-amber-50 text-amber-800 ring-amber-100" },
  blocked: { icon: XCircle, iconClass: "text-rose-600", badge: "bg-rose-50 text-rose-700 ring-rose-100" },
};

export function Checklist({ items, done, emptyMessage }: { items: readonly ChecklistItem[]; done: number; emptyMessage: string }) {
  if (items.length === 0) return <EmptyPanel>{emptyMessage}</EmptyPanel>;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-slate-600">Aprobados</span>
          <span className="font-semibold text-slate-900 tabular-nums">
            {done} de {items.length}
          </span>
        </div>
        <ProgressBar done={done} total={items.length} />
      </div>
      <ul className="space-y-3">
        {items.map((item) => {
          const style = CHECKLIST_STYLES[item.state];
          const Icon = style.icon;
          return (
            <li key={item.id} className="flex items-start gap-3">
              <Icon className={cn("mt-0.5 h-[18px] w-[18px] shrink-0 stroke-[1.75]", style.iconClass)} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium break-words text-slate-900">{item.label}</p>
                {item.detail && <p className="text-xs break-words text-slate-600">{item.detail}</p>}
              </div>
              <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", style.badge)}>{item.stateLabel}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const STEP_ICONS: Record<StepTone, { icon: LucideIcon; className: string }> = {
  action: { icon: Circle, className: "text-brand-600" },
  waiting: { icon: Clock, className: "text-sky-600" },
  done: { icon: CheckCircle2, className: "text-brand-600" },
};

export function StepsList({ items }: { items: readonly NextStep[] }) {
  return (
    <ol className="space-y-4">
      {items.map((step) => {
        const { icon: Icon, className } = STEP_ICONS[step.tone];
        return (
          <li key={step.id} className="flex gap-3">
            <Icon className={cn("mt-0.5 h-[18px] w-[18px] shrink-0 stroke-[1.75]", className)} aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900">{step.text}</p>
              {step.detail && <p className="mt-0.5 text-xs text-slate-600">{step.detail}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function ProjectOverview({ project, pitch, showPitch }: { project: ProjectSummary | null; pitch: PitchSummary | null; showPitch: boolean }) {
  if (!project) return <EmptyPanel>Aún no tienes un proyecto registrado en la ruta emprendedora.</EmptyPanel>;
  const pitchDate = pitch?.fechaHora ? dayParts(pitch.fechaHora) : null;

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-100">
            <Presentation className="h-5 w-5 stroke-[1.75]" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold text-slate-900">{project.titulo}</p>
            {project.sector && <p className="text-xs text-slate-600">{project.sector}</p>}
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <dt className="text-slate-500">Etapa actual</dt>
            <dd><EtapaBadge etapa={project.etapa} /></dd>
          </div>
          <div className="space-y-1">
            <dt className="text-slate-500">Estado</dt>
            <dd><StatusBadge value={project.estado} /></dd>
          </div>
        </dl>
        {project.otros > 0 && (
          <p className="text-xs text-slate-500">Tienes {project.otros} {project.otros === 1 ? "proyecto adicional" : "proyectos adicionales"} registrados.</p>
        )}
      </div>

      {showPitch && (
        <div className="rounded-xl bg-surface-muted p-4 ring-1 ring-inset ring-slate-200/70">
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-slate-500">Estado del pitch</p>
          {pitch ? (
            <div className="mt-3 space-y-2">
              <StatusBadge value={pitch.estado} label={pitch.estadoLabel} />
              <p className="text-sm text-slate-700">
                {pitchDate ? `${pitchDate.full}${pitchDate.time ? ` · ${pitchDate.time}` : ""}` : "Fecha por definir"}
                {pitch.modalidad ? ` · ${pitch.modalidad}` : ""}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">Aún no tienes un pitch programado.</p>
          )}
        </div>
      )}
    </div>
  );
}
