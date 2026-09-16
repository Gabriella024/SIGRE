import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Proyecto } from './types/proyect'

const estadoStyles: Record<Proyecto['estado'], string> = {
  Activo: 'bg-green-100 text-green-700',
  Inactivo: 'bg-slate-100 text-slate-500',
  Finalizado: 'bg-blue-100 text-blue-700',
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

export const proyectoColumns: ColumnDef<Proyecto>[] = [
  {
    accessorKey: 'nombre',
    header: ({ column }) => <SortableHeader label="Proyecto" column={column} />,
    cell: ({ row }) => (
      <span className="font-medium text-slate-900">{row.original.nombre}</span>
    ),
  },
  {
    accessorKey: 'emprendedor',
    header: ({ column }) => <SortableHeader label="Emprendedor" column={column} />,
    cell: ({ row }) => <span className="text-slate-600">{row.original.emprendedor}</span>,
  },
  {
    accessorKey: 'municipio',
    header: ({ column }) => <SortableHeader label="Municipio" column={column} />,
    cell: ({ row }) => (
      <span className="text-slate-500">{row.original.municipio}</span>
    ),
  },
  {
    accessorKey: 'sector',
    header: ({ column }) => <SortableHeader label="Sector" column={column} />,
    cell: ({ row }) => (
      <span className="text-slate-600">{row.original.sector}</span>
    ),
  },
  {
    accessorKey: 'etapa',
    header: 'Etapa',
    cell: ({ row }) => (
      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
        {row.original.etapa}
      </span>
    ),
  },
  {
    accessorKey: 'fechaRegistro',
    header: ({ column }) => <SortableHeader label="Fecha" column={column} />,
    cell: ({ row }) => (
      <span className="text-slate-500">
        {new Date(row.original.fechaRegistro).toLocaleDateString()}
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