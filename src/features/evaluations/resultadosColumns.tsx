import type { ColumnDef } from '@tanstack/react-table'
import { MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AvatarGroup } from '@/components/evaluations/AvatarGroup'
import { ScoreBar } from '@/components/evaluations/ScoreBar'
import type { ResultadoEvaluacion } from './types/resultado'

const badgeStyles: Record<ResultadoEvaluacion['resultado'], string> = {
  Completado: 'bg-green-100 text-green-700',
  Rechazado: 'bg-red-100 text-red-600',
  'En revisión': 'bg-orange-100 text-orange-600',
}

export const resultadosColumns: ColumnDef<ResultadoEvaluacion>[] = [
  {
    accessorKey: 'codigo',
    header: 'CÓDIGO',
    cell: ({ row }) => <span className="font-medium text-slate-900">{row.original.codigo}</span>,
  },
  {
    accessorKey: 'proyecto',
    header: 'PROYECTO',
    cell: ({ row }) => <span className="text-slate-600">{row.original.proyecto}</span>,
  },
  {
    accessorKey: 'fechaPitch',
    header: 'FECHA PITCH',
    cell: ({ row }) => (
      <span className="text-slate-500">
        {new Date(row.original.fechaPitch).toLocaleDateString('es-CO')}
      </span>
    ),
  },
  {
    accessorKey: 'evaluadores',
    header: 'EVALUADORES',
    cell: ({ row }) => <AvatarGroup evaluadores={row.original.evaluadores} />,
  },
  {
    accessorKey: 'puntajePromedio',
    header: 'PUNTAJE PROMEDIO',
    cell: ({ row }) => (
      <ScoreBar puntaje={row.original.puntajePromedio} resultado={row.original.resultado} />
    ),
  },
  {
    accessorKey: 'resultado',
    header: 'RESULTADO',
    cell: ({ row }) => (
      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', badgeStyles[row.original.resultado])}>
        {row.original.resultado}
      </span>
    ),
  },
  {
    id: 'acciones',
    cell: () => (
      <button className="rounded p-1 hover:bg-slate-100">
        <MoreVertical className="h-4 w-4 text-slate-400" />
      </button>
    ),
  },
]