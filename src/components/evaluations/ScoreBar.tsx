import { cn } from '@/lib/utils'
import type { ResultadoConsolidado } from '@/features/evaluations/types/resultado'

const barColor: Record<ResultadoConsolidado, string> = {
  Completado: 'bg-green-500',
  Rechazado: 'bg-orange-400',
  'En revisión': 'bg-slate-300',
}

export function ScoreBar({
  puntaje,
  resultado,
}: {
  puntaje: number | null
  resultado: ResultadoConsolidado
}) {
  if (puntaje === null) {
    return <span className="text-slate-300">—</span>
  }

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-slate-100">
        <div
          className={cn('h-1.5 rounded-full', barColor[resultado])}
          style={{ width: `${puntaje}%` }}
        />
      </div>
      <span className="text-xs text-slate-500">{puntaje}</span>
    </div>
  )
}