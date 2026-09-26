import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Evaluacion } from '@/features/evaluations/types/evaluacion'

const borderColor: Record<Evaluacion['estado'], string> = {
  Pendiente: 'border-l-orange-400',
  Completado: 'border-l-green-500',
}

const badgeStyles: Record<Evaluacion['estado'], string> = {
  Pendiente: 'bg-orange-100 text-orange-600',
  Completado: 'bg-green-100 text-green-700',
}

export function EvaluationCard({ evaluacion }: { evaluacion: Evaluacion }) {
  const fecha = new Date(evaluacion.fechaPitch)
  const fechaStr = fecha.toLocaleDateString('es-CO')
  const horaStr = fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-lg border border-l-4 bg-white p-4 shadow-sm',
        borderColor[evaluacion.estado]
      )}
    >
      <div className="flex items-center gap-4">
        <div className="w-24 shrink-0">
          <p className="text-xs font-semibold text-slate-500">{evaluacion.codigoPitch}</p>
          <span className="mt-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500">
            {evaluacion.codigoProyecto}
          </span>
        </div>
        <div>
          <p className="font-semibold text-slate-900">{evaluacion.proyecto}</p>
          <p className="text-sm text-slate-500">{evaluacion.emprendedor}</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right text-xs text-slate-400">
          <p>FECHA PITCH</p>
          <p className="text-slate-500">{fechaStr}</p>
          <p className="text-slate-500">{horaStr}</p>
        </div>

        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', badgeStyles[evaluacion.estado])}>
          {evaluacion.estado}
        </span>

        {evaluacion.estado === 'Completado' ? (
          <span className="font-semibold text-slate-900">{evaluacion.puntaje}/100</span>
        ) : (
          <Button size="sm" className="gap-1 bg-lime-500 hover:bg-lime-600">
            Calificación
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}