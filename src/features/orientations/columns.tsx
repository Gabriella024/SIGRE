import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Orientacion } from './types/orientations'

const estadoStyles: Record<Orientacion['estado'], string> = {
  Programada: 'bg-green-100 text-green-700',
  Finalizada: 'bg-slate-100 text-slate-500',
  "En Proceso": 'bg-blue-100 text-blue-700',
}

function SortableHeader({ label, column }: { label: string; column: any }) {
  return (
    <Button
      variant="ghost"
      className="-ml-3 h-8 gap-1 text-xs uppercase text-slate-400 hover:text-slate-600"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </Button>
  )
}

export const orientationColumn: ColumnDef<Orientacion>[] = [
  {
    accessorKey: 'nombre',
    header: ({ column }) => <SortableHeader label="Jornada" column={column} />,
    cell: ({ row }) => (
      <span className="font-medium text-slate-900">{row.original.nombre}</span>
    ),
  },
  {
    accessorKey: 'fechayhora',
    header: ({ column }) => <SortableHeader label="Fecha y Hora" column={column} />,
    cell: ({ row }) => (
      <span className="text-slate-500">
        {new Date(row.original.fechayhora).toLocaleString('es-CO', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })}
      </span>
    ),
  },
  {
    accessorKey: 'modalidad',
    header: ({ column }) => <SortableHeader label="Modalidad" column={column} />,
    cell: ({ row }) => (
      <span className="text-slate-500">{row.original.modalidad}</span>
    ),
  },
  {
    accessorKey: 'lugarylink',
    header: ({ column }) => <SortableHeader label="Lugar y Link" column={column} />,
    cell: ({ row }) => (
      <span className="text-slate-600">{row.original.lugarylink}</span>
    ),
  },
  {
    accessorKey: 'cupo',
    header: 'Cupo',
    cell: ({ row }) => (
      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
        {row.original.cupo}
      </span>
    ),
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({ row }) => (
      <span
        className={cn(
          'rounded-full px-2.5 py-0.5 text-xs font-medium',
          estadoStyles[row.original.estado]
        )}
      >
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