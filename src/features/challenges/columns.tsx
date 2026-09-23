import type { ColumnDef } from '@tanstack/react-table'
import { MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Reto } from './types/Challenge'

const estadoStyles: Record<Reto['estado'], string> = {
  Programado: 'bg-blue-100 text-blue-700',
  'En curso': 'bg-green-100 text-green-700',
  Finalizado: 'bg-slate-100 text-slate-500',
  Cancelado: 'bg-red-100 text-red-700',
}

export const retoColumns: ColumnDef<Reto>[] = [
  {
    accessorKey: 'codigo',
    header: 'CÓDIGO',
    cell: ({ row }) => (
      <span className="font-medium text-slate-900">{row.original.codigo}</span>
    ),
  },
  {
    accessorKey: 'nivel',
    header: 'RETO',
    cell: ({ row }) => <span className="text-slate-600">{row.original.nivel}</span>,
  },
  {
    accessorKey: 'sesion',
    header: 'SESIÓN',
    cell: ({ row }) => <span className="text-slate-600">{row.original.sesion}</span>,
  },
  {
    accessorKey: 'fechaHora',
    header: 'FECHA Y HORA',
    cell: ({ row }) => {
      const fecha = new Date(row.original.fechaHora)
      const fechaStr = fecha.toLocaleDateString('es-CO')
      const horaStr = fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
      return <span className="text-slate-500">{fechaStr} | {horaStr}</span>
    },
  },
  {
    accessorKey: 'modalidad',
    header: 'MODALIDAD',
    cell: ({ row }) => <span className="text-slate-500">{row.original.modalidad}</span>,
  },
  {
    accessorKey: 'cupo',
    header: 'CUPO',
    cell: ({ row }) => <span className="text-slate-500">{row.original.cupo}</span>,
  },
  {
    accessorKey: 'estado',
    header: 'ESTADO',
    cell: ({ row }) => (
      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', estadoStyles[row.original.estado])}>
        {row.original.estado}
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