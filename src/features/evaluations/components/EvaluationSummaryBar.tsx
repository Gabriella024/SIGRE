import { Button } from "@/components/ui/button";

type EvaluationSummaryBarProps = {
  asignados: number
  sinAsignar: number
  completados: number
  pendientes: number
  onAssign?: () => void
}

function plural(value: number, singular: string, pluralForm: string): string {
  return `${value} ${value === 1 ? singular : pluralForm}`
}

export function EvaluationSummaryBar({ asignados, sinAsignar, completados, pendientes, onAssign }: EvaluationSummaryBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-surface px-5 py-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-600">
        {plural(asignados, "pitch asignado", "pitch asignados")} · {sinAsignar} pitch sin asignar ·{" "}
        {plural(completados, "completado", "completados")} · {plural(pendientes, "pendiente", "pendientes")}
      </p>
      {onAssign && (
        <Button onClick={onAssign} className="bg-brand-700 hover:bg-brand-800">Realizar asignaciones</Button>
      )}
    </div>
  )
}
