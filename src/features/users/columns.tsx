import type { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { User } from './types/users'

const estadoStyles: Record<User['estado'], string> = {
  Activo: 'bg-green-100 text-green-700',
  Inactivo: 'bg-slate-100 text-slate-500',
  Suspendido: 'bg-gray-100 text-gray-700',
}

const rolStyles: Record<User['rol'], string> = {
  Administrador: 'bg-lime-100 text-lime-700',
  Coordinador: 'bg-cyan-100 text-cyan-700',
  Orientador: 'bg-slate-200 text-slate-500',
  Evaluador: 'bg-mauve-100 text-mauve-700',
  Emprendedor: 'bg-taupe-200 text-taupe-600'
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

export const usuariosColumns: ColumnDef<User>[] = [
  {
    accessorKey: 'nombre',
    header: ({ column }) => <SortableHeader label="Proyecto" column={column} />,
    cell: ({ row }) => (
      <span className="font-medium text-slate-900">{row.original.nombre}</span>
    ),
  },
  {
    accessorKey: 'correo',
    header: ({ column }) => <SortableHeader label="Correo" column={column} />,
    cell: ({ row }) => <span className="text-slate-600">{row.original.correo}</span>,
  },
  {
    accessorKey: 'rol',
    header: ({ column }) => <SortableHeader label="Rol(es)" column={column} />,
    cell: ({ row }) => (
     <span
        className={cn(
          'rounded-full px-2.5 py-0.5 text-xs font-medium',
          rolStyles[row.original.rol]
        )}
      >
        {row.original.rol}
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
    accessorKey: 'ultimoAccceso',
    header: ({ column }) => <SortableHeader label="Último acceso" column={column} />,
    cell: ({ row }) => (
      <span className="text-slate-500">
        {new Date(row.original.ultimoAcceso).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })}
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