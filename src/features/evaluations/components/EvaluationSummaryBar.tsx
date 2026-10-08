import { Button } from "../ui/button";
import type { Evaluacion } from "@/features/evaluations/types/evaluacion";

export function EvaluationSummaryBar({ evaluaciones }: { evaluaciones: Evaluacion[] }) {
  const totalAsignados = evaluaciones.length
  const sinAsignar = 5
  const completados = evaluaciones.filter((e) => e.estado === 'Completado').length
  const pendientes = evaluaciones.filter((e) => e.estado === 'Pendiente').length

  return (
    <div className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 shadow-sm">
      <p className="text-sm text-slate-500">
        {totalAsignados} pitches asignados · {sinAsignar} pitches sin asignar ·{' '}
        {completados} completados · {pendientes} pendientes
      </p>
      <Button className="bg-lime-500 hover:bg-lime-600">Realizar asignaciones</Button>
    </div>
  )
}