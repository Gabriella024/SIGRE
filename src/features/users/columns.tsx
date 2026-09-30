import type { ColumnDef } from '@tanstack/react-table'
import { Pencil, Trash2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

import { AvatarInitials } from '@/components/ui/avatar-initials'
import { RoleBadge } from '@/components/users/RoleBadge'
import { StatusBadge } from '@/components/users/StatusBadge'
import type {User} from './types/users'

function formatFecha(fecha: string | null) {
  if (!fecha) return '—'
  return new Date(fecha).toLocaleDateString('es-CO')
}

export const usuarioColumns: ColumnDef<User>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
  },
  {
    accessorKey: 'nombre',
    header: 'NOMBRE',
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <AvatarInitials nombre={row.original.nombre} />
        <span className="font-medium text-slate-900">{row.original.nombre}</span>
      </div>
    ),
  },
  {
    accessorKey: 'correo',
    header: 'CORREO',
    cell: ({ row }) => <span className="text-slate-500">{row.original.correo}</span>,
  },
  {
    accessorKey: 'roles',
    header: 'ROL(ES)',
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1.5">
        {row.original.roles.map((rol) => (
          <RoleBadge key={rol} rol={rol} />
        ))}
      </div>
    ),
  },
  {
    accessorKey: 'estado',
    header: 'ESTADO',
    cell: ({ row }) => <StatusBadge estado={row.original.estado} />,
  },
  {
    accessorKey: 'ultimoAcceso',
    header: 'ÚLTIMO ACCESO',
    cell: ({ row }) => (
      <span className="text-slate-500">{formatFecha(row.original.ultimoAcceso)}</span>
    ),
  },
  {
    accessorKey: 'fechaCreacion',
    header: 'FECHA DE CREACIÓN',
    cell: ({ row }) => (
      <span className="text-slate-500">{formatFecha(row.original.fechaCreacion)}</span>
    ),
  },
  {
    id: 'acciones',
    header: '',
    cell: () => (
      <div className="flex items-center gap-1">
        <button className="rounded p-1.5 hover:bg-slate-100">
          <Pencil className="h-4 w-4 text-slate-400" />
        </button>
        <button className="rounded p-1.5 hover:bg-red-50">
          <Trash2 className="h-4 w-4 text-red-400" />
        </button>
      </div>
    ),
  },
]