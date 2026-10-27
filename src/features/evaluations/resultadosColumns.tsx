import type { Column } from "@/components/ui/table/types"
import { NullableText } from "@/components/ui/nullable-text"
import { formatTimestamp } from "@/lib/format"
import type { EvaluationResults } from "./types/resultado"
import { ScoreBar } from '@/features/evaluations/components/ScoreBar'
import { AvatarGroup } from '@/features/evaluations/components/AvatarGroup'
import { ResultBadge } from '@/features/evaluations/components/ResultBadge'

export const RESULT_COLUMNS: Column<EvaluationResults>[] = [
  {
    key: "proyecto",
    label: "PROYECTO",
    sortable: true,
    render: (row) => <NullableText value={row.proyecto} className="font-semibold text-slate-900" />,
  },
  {
    key: "emprendedor",
    label: "EMPRENDEDOR",
    sortable: true,
    render: (row) => <NullableText value={row.emprendedor} />,
  },
  {
    key: "fechaPitch",
    label: "FECHA PITCH",
    sortable: true,
    render: (row) => <NullableText value={row.fechaPitch ? formatTimestamp(row.fechaPitch) : null} />,
  },
  {
    key: "evaluadores",
    label: "EVALUADORES",
    render: (row) => <AvatarGroup evaluadores={row.evaluadores}/>
  },
  {
    key: "calificados",
    label: "CALIFICACIONES",
    sortable: true,
    align: "center",
    render: (row) => `${row.calificados}/${row.asignados}`,
  },
  {
    key: "votosAprobado",
    label: "VOTOS",
    sortable: true,
    align: "center",
    render: (row) => `${row.votosAprobado} aprob. · ${row.votosNoAprobado} no aprob.`,
  },
  {
    key: "puntajePromedio",
    label: "PUNTAJE",
    sortable: true,
    render: (row) => <ScoreBar puntaje={row.puntajePromedio} resultado={row.resultado}/>
  },
  {
    key: "resultado",
    label: "ESTADO DE CALIFICACIÓN",
    sortable: true,
    render: (row) => <ResultBadge estado={row.resultado} />,
  },
]
