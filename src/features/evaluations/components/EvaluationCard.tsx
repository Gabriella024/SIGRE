import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import type { Evaluacion } from '@/features/evaluations/types/evaluacion'

const borderColor: Record<Evaluacion['estado'], string> = {
  Pendiente: 'border-l-orange-400',
  Completado: 'border-l-green-500',
}

const badgeStyles: Record<Evaluacion['estado'], string> = {
  Pendiente: 'bg-orange-100 text-orange-600',
  Completado: 'bg-green-100 text-green-700',
}

type EvaluationCardProps = {
  evaluacion: Evaluacion
  onGrade?: (evaluacion: Evaluacion) => void
}

export function EvaluationCard({ evaluacion, onGrade }: EvaluationCardProps) {
  const fecha = evaluacion.fechaPitch ? new Date(evaluacion.fechaPitch) : null
  const valid = fecha !== null && !Number.isNaN(fecha.getTime())

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-l-4 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between',
        borderColor[evaluacion.estado]
      )}
    >
      <div className="flex items-center gap-4">
        <div className="w-28 shrink-0">
          <StatusBadge value={evaluacion.estadoPitch} />
        </div>
        <div>
          <p className="font-semibold text-slate-900">{evaluacion.proyecto ?? 'Proyecto no disponible'}</p>
          <p className="text-sm text-slate-500">{evaluacion.emprendedor ?? 'Emprendedor no disponible'}</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right text-xs text-slate-400">
          <p>FECHA PITCH</p>
          <p className="text-slate-500">{valid ? fecha.toLocaleDateString('es-CO') : 'Sin fecha'}</p>
          {valid && <p className="text-slate-500">{fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</p>}
        </div>

        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', badgeStyles[evaluacion.estado])}>
          {evaluacion.estado}
        </span>

        {evaluacion.calificacion ? (
          <span className="font-semibold text-slate-900">{evaluacion.calificacion.puntaje ?? '—'}/100</span>
        ) : onGrade && (
          <Button size="sm" onClick={() => onGrade(evaluacion)} className="gap-1 bg-lime-500 hover:bg-lime-600">
            Calificación
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
