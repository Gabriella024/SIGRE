import { Eye, Pencil } from "lucide-react"

import type { Column } from "@/components/ui/table/types"
import { NullableText } from "@/components/ui/nullable-text"
import { StatusBadge } from "@/components/ui/status-badge"
import { formatDateOnly, formatStatusLabel } from "@/lib/format"
import { MAX_EVALUADORES_POR_PITCH, MIN_EVALUADORES_POR_PITCH } from "@/features/evaluators/utils/evaluatorUtils"

import type { Pitch, PitchPreparation } from "./types/pitch"
import { formatDateTime, pitchEstadoLabel } from "./utils/pitchUtils"

const iconButton =
  "rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"

interface PitchColumnOptions {
  onDetail: (pitch: Pitch) => void
  onEdit?: (pitch: Pitch) => void
}

export function buildPitchColumns({ onDetail, onEdit }: PitchColumnOptions): Column<Pitch>[] {
  return [
    {
      key: "proyecto",
      label: "PROYECTO",
      sortable: true,
      render: (row) => <NullableText value={row.proyecto} className="font-semibold text-slate-900" />,
    },
    { key: "emprendedor", label: "EMPRENDEDOR", sortable: true, render: (row) => <NullableText value={row.emprendedor} /> },
    { key: "fechaHora", label: "FECHA Y HORA", sortable: true, render: (row) => <NullableText value={formatDateTime(row.fechaHora)} /> },
    {
      key: "modalidad",
      label: "MODALIDAD",
      sortable: true,
      render: (row) => <NullableText value={row.modalidad ? formatStatusLabel(row.modalidad) : null} />,
    },
    { key: "lugarLink", label: "LUGAR Y LINK", render: (row) => <NullableText value={row.lugarLink} className="break-all" /> },
    {
      key: "totalEvaluadores",
      label: "EVALUADORES",
      sortable: true,
      align: "center",
      render: (row) => (
        <span className={row.totalEvaluadores < MIN_EVALUADORES_POR_PITCH ? "font-semibold text-amber-600" : "text-slate-700"}>
          {row.totalEvaluadores}/{MAX_EVALUADORES_POR_PITCH}
        </span>
      ),
    },
    { key: "estado", label: "ESTADO", sortable: true, render: (row) => <StatusBadge value={row.estado} label={pitchEstadoLabel(row.estado)} /> },
    {
      key: "acciones",
      label: "ACCIONES",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button type="button" className={iconButton} onClick={() => onDetail(row)} title="Ver detalle" aria-label="Ver detalle del pitch">
            <Eye className="h-4 w-4" />
          </button>
          {onEdit && (
            <button type="button" className={iconButton} onClick={() => onEdit(row)} title="Editar" aria-label="Editar pitch">
              <Pencil className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ]
}

export const PREPARATION_COLUMNS: Column<PitchPreparation>[] = [
  {
    key: "proyecto",
    label: "PROYECTO",
    sortable: true,
    render: (row) => <NullableText value={row.proyecto} className="font-semibold text-slate-900" />,
  },
  { key: "emprendedor", label: "EMPRENDEDOR", sortable: true, render: (row) => <NullableText value={row.emprendedor} /> },
  { key: "orientador", label: "ORIENTADOR", sortable: true, render: (row) => <NullableText value={row.orientador} /> },
  {
    key: "fecha",
    label: "FECHA",
    sortable: true,
    render: (row) => <NullableText value={row.fecha ? formatDateOnly(row.fecha.slice(0, 10)) : null} />,
  },
  { key: "observacion", label: "OBSERVACIÓN", render: (row) => <NullableText value={row.observacion} /> },
  { key: "estado", label: "ESTADO", sortable: true, render: (row) => <StatusBadge value={row.estado} /> },
]
