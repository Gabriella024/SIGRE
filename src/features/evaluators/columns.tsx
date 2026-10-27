import { Pencil, Power } from "lucide-react"

import type { Column } from "@/components/ui/table/types"
import { NullableText } from "@/components/ui/nullable-text"
import { StatusBadge } from "@/components/ui/status-badge"

import type { Evaluator } from "./types/evaluators"
import { isActiveEvaluator } from "./utils/evaluatorUtils"

const iconButton =
  "rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"

interface EvaluatorColumnOptions {
  onEdit?: (evaluator: Evaluator) => void
  onToggleEstado?: (evaluator: Evaluator) => void
}

const BASE_COLUMNS: Column<Evaluator>[] = [
  {
    key: "documento",
    label: "DOCUMENTO",
    sortable: true,
    render: (row) => <NullableText value={row.documento} className="font-semibold text-slate-900" />,
  },
  { key: "nombre", label: "NOMBRE", sortable: true, render: (row) => <NullableText value={row.nombre} /> },
  { key: "especialidad", label: "ESPECIALIDAD", sortable: true, render: (row) => <NullableText value={row.especialidad} /> },
  { key: "entidad", label: "ENTIDAD", sortable: true, render: (row) => <NullableText value={row.entidad} /> },
  { key: "telefono", label: "TELÉFONO", render: (row) => <NullableText value={row.telefono} /> },
  { key: "asignaciones", label: "ASIGNACIONES", sortable: true, align: "center" },
  { key: "estado", label: "ESTADO", sortable: true, render: (row) => <StatusBadge value={row.estado} /> },
]

export function buildEvaluatorColumns({ onEdit, onToggleEstado }: EvaluatorColumnOptions): Column<Evaluator>[] {
  if (!onEdit && !onToggleEstado) return BASE_COLUMNS

  return [
    ...BASE_COLUMNS,
    {
      key: "acciones",
      label: "ACCIONES",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          {onEdit && (
            <button type="button" className={iconButton} onClick={() => onEdit(row)} title="Editar" aria-label={`Editar ${row.nombre ?? "evaluador"}`}>
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {onToggleEstado && (
            <button
              type="button"
              className={iconButton}
              onClick={() => onToggleEstado(row)}
              title={isActiveEvaluator(row) ? "Desactivar" : "Activar"}
              aria-label={`${isActiveEvaluator(row) ? "Desactivar" : "Activar"} ${row.nombre ?? "evaluador"}`}
            >
              <Power className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ]
}
