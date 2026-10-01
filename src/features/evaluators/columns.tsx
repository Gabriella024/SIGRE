import type { Column } from "@/components/ui/table/types"
import type { Evaluator, EvaluatorStatus } from "./types/evaluators"

function EstadoBadge({ estado }: { estado: EvaluatorStatus }) {
  const styles: Record<EvaluatorStatus, string> = {
    Activo: "bg-emerald-100 text-emerald-700",
    Inactivo: "bg-rose-100 text-rose-800",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[estado]}`}>
      {estado}
    </span>
  );
}


export const EVALUATOR_COLUMNS: Column<Evaluator>[] = [
  {
    key: "documento",
    label: "DOCUMENTO",
    sortable: true,
    render: (row) => (
      <span className="font-semibold text-slate-900">{row.documento}</span>
    ),
  },
  {
    key: "nombre",
    label: "NOMBRE",
    sortable: true,
  },
  {
    key: "especialidad",
    label: "ESPECIALIDAD",
    sortable: true,
  },
  {
    key: "entidad",
    label: "ENTIDAD",
    sortable: true,
  },
  {
    key: "telefono",
    label: "TELÉFONO",
    sortable: true,
  },
  {
    key: "estado",
    label: "ESTADO",
    sortable: false,
    render: (row) => <EstadoBadge estado={row.estado} />,
  }
]