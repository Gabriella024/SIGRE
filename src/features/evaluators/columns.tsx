import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils'
import type { Evaluador } from "./types/evaluators";

const estadoStyles: Record<Evaluador['estado'], string> = {
  Activo: 'bg-green-100 text-green-700',
  Inactivo: 'bg-slate-100 text-slate-500',
}

function SortableHeader({ label, column }: { label: string; column: any }) {
  return (
    <Button
      variant="ghost"
      className="-m1-3 h-8 gap-1 text-xs uppercase text-slate-400 hover:text-slate-600"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
      {label}
      <ArrowUpDown className="h-3 w-3"></ArrowUpDown>
    </Button>
  )
}

export const EvaluatorsColumn: ColumnDef<Evaluador>[] = [
  {
    accessorKey: 'documento',
    header: ({ column }) => <SortableHeader label="Documento" column={column} />,
    cell: ({ row }) => (
      <span className="font-medium text-slate-900">{row.original.documento}</span>
    ),
  },
  {
    accessorKey: 'nombre',
    header: ({column}) => <SortableHeader label="Nombre" column={column}/>,
    cell: ({ row }) => (
      <span className="text-slate-600">{row.original.nombre}</span>
    )
  },
  {
    accessorKey: 'especialidad',
    header: ({column}) => <SortableHeader label="Especialidad" column={column}/>,
    cell: ({ row }) => (
      <span className="text-slate-500">{row.original.especialidad}</span>
    )
  },
  {
    accessorKey: 'entidad',
    header: ({column}) => <SortableHeader label="Entidad" column={column}/>,
    cell: ({ row }) => <span className="text-slate-500">{row.original.entidad}</span>
  },
  {
    accessorKey: 'telefono',
    header: ({column}) => <SortableHeader label="Teléfono" column={column}/>,
    cell: ({ row }) => <span className="text-slate-500">{row.original.telefono}</span>
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: ({row}) => (
      <span className={cn(
        'rounded-full px-2.5 py-0.5 text-xs font-medium',
        estadoStyles[row.original.estado]
      )}
      >
        {row.original.estado}
      </span>
    )
  },
  {
    id: 'acciones',
    cell: () => (
      <button className="rounded p-1 hover:bg-slate-100">
        <MoreVertical className="h-4 w-4 text-slate-400"></MoreVertical>
      </button>
    )
  }
]