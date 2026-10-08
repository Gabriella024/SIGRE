import type { Column } from "@/components/ui/table/types"
import type { EvaluationResults, ConsolidatedResult } from "./types/resultado"
import { ScoreBar } from '@/features/evaluations/components/ScoreBar'
import { AvatarGroup } from '@/features/evaluations/components/AvatarGroup'

function EstadoBadge({ estado }: { estado: ConsolidatedResult }) {
  const styles: Record<ConsolidatedResult, string> = {
    Completado: "bg-emerald-100 text-emerald-700",
    Rechazado: "bg-rose-100 text-rose-800",
    'En revisión': "bg-yellow-100 text-yellow-700"
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[estado]}`}>
      {estado}
    </span>
  );
}


export const RESULT_COLUMNS: Column<EvaluationResults>[] = [
 {
    key: "codigo",
    label: "CÓDIGO",
    sortable: true,
    render: (row) => (
      <span className="font-semibold text-slate-900">{row.codigo}</span>
    ),
  },
  {
    key: "proyecto",
    label: "PROYECTO",
    sortable: true,
  },
  {
    key: "fechaPitch",
    label: "FECHA PITCH",
    sortable: true,
  },
  {
    key: "evaluadores",
    label: "EVALUADORES",
    sortable: true,
    render: (row) => <AvatarGroup evaluadores={row.evaluadores}/>
  },
  {
    key: "puntajePromedio",
    label: "PUNTAJE",
    sortable: true,
    render: (row) => <ScoreBar puntaje={row.puntajePromedio} resultado={row.resultado}/>
  },
  {
    key: "resultado",
    label: "RESULTADO",
    sortable: true,
    render: (row) => <EstadoBadge estado={row.resultado} />,
  },

]