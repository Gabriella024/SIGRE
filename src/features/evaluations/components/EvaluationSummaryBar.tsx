import { Button } from "@/components/ui/button";

type EvaluationSummaryBarProps = {
  asignados: number
  sinAsignar: number
  completados: number
  pendientes: number
  onAssign?: () => void
}

export function EvaluationSummaryBar({ asignados, sinAsignar, completados, pendientes, onAssign }: EvaluationSummaryBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-500">
        {asignados} pitches asignados · {sinAsignar} pitches sin asignar · {completados} completados · {pendientes} pendientes
      </p>
      {onAssign && (
        <Button onClick={onAssign} className="bg-lime-500 hover:bg-lime-600">Realizar asignaciones</Button>
      )}
    </div>
  )
}
