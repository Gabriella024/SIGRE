import type { ResultadoEvaluacion } from '@/features/evaluations/types/resultado'

const pillStyles: Record<string, string> = {
  Completado: 'bg-green-100 text-green-700',
  Rechazado: 'bg-red-100 text-red-600',
  'En revisión': 'bg-orange-100 text-orange-600',
}

const labels: Record<string, string> = {
  Completado: 'Aprobados',
  Rechazado: 'Rechazados',
  'En revisión': 'En revisión',
}

export function ResultsSummaryPills({ resultados }: { resultados: ResultadoEvaluacion[] }) {
  const counts = resultados.reduce<Record<string, number>>((acc, r) => {
    acc[r.resultado] = (acc[r.resultado] ?? 0) + 1
    return acc
  }, {})

  const orden: (keyof typeof labels)[] = ['Completado', 'Rechazado', 'En revisión', 'Pendiente']

  return (
    <div className="flex flex-wrap gap-2">
      {orden
        .filter((key) => counts[key])
        .map((key) => (
          <span
            key={key}
            className={`rounded-full px-3 py-1 text-xs font-medium ${pillStyles[key]}`}
          >
            {counts[key]} {labels[key]}
          </span>
        ))}
    </div>
  )
}