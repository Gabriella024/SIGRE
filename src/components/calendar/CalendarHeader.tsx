import { ChevronLeft, ChevronRight, Download, Plus } from "lucide-react";

import type { CalendarModule, CalendarView } from "../../features/calendar/types/calendar";
 
interface CalendarHeaderProps {
  title: string;
  view: CalendarView;
  module: CalendarModule;
  onViewChange: (view: CalendarView) => void;
  onPrev: () => void;
  onNext: () => void;
  onTomorrow: () => void;
  onExport?: () => void;
  onCreate?: () => void;
}
 
const VIEW_OPTIONS: ReadonlyArray<{ value: CalendarView; label: string }> = [
  { value: "day", label: "Día" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
];
 
const CREATE_LABEL: Record<CalendarModule, string> = {
  orientaciones: "Nueva Orientación",
  pitch: "Nuevo Pitch",
};
 
const iconButton =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400";
 
export default function CalendarHeader({
  title,
  view,
  module,
  onViewChange,
  onPrev,
  onNext,
  onTomorrow,
  onExport,
  onCreate,
}: CalendarHeaderProps) {
  return (
    <header className="flex flex-col gap-3 border-b border-slate-200 bg-white p-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={onPrev} aria-label="Anterior" className={iconButton}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onTomorrow}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            Mañana
          </button>
          <button type="button" onClick={onNext} aria-label="Siguiente" className={iconButton}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      </div>
 
      <div className="flex flex-wrap items-center gap-2">
        <div
          role="tablist"
          aria-label="Vista del calendario"
          className="inline-flex rounded-lg bg-slate-100 p-1"
        >
          {VIEW_OPTIONS.map((option) => {
            const active = option.value === view;
            return (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onViewChange(option.value)}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                  active
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
 
        <button
          type="button"
          onClick={onExport}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
        >
          <Download className="h-4 w-4" />
          Exportar
        </button>
 
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex h-9 items-center gap-2 roun ded-lg bg-lime-900 px-3 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          {CREATE_LABEL[module]}
        </button>
      </div>
    </header>
  );
}
 