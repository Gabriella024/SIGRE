import type { Column } from "@/components/ui/table/types";
import type { Challenge, EstadoReto} from "./types/Challenge";

function EstadoBadge({ estado }: { estado: EstadoReto }) {
  const styles: Record<EstadoReto, string> = {
    Programado: "bg-emerald-100 text-emerald-700",
    Cancelado: "bg-rose-100 text-rose-800",
    Finalizado: "bg-indigo-100 text-indigo-700",
    "En curso": "bg-orange-100 text-orange-700",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[estado]}`}>
      {estado}
    </span>
  );
}

export const CHALLENGE_COLUMNS: Column<Challenge>[] = [
  {
    key: "codigo",
    label: "CÓDIGO",
    sortable: true,
    render: (row) => (
      <span className="font-semibold text-slate-900">{row.codigo}</span>
    ),
  },
  {
    key: "nivel",
    label: "NIVEL",
    sortable: true,
  },
  {
    key: "sesion",
    label: "SESIÓN",
    sortable: true,
  },
  {
    key: "fechayhora",
    label: "FECHA Y HORA",
    sortable: true,
  },
  {
    key: "modalidad",
    label: "MODALIDAD",
    sortable: true,
  },
  {
    key: "cupo",
    label: "CUPO",
    sortable: true,
  },
  {
    key: "estado",
    label: "ESTADO",
    sortable: false,
    render: (row) => <EstadoBadge estado={row.estado} />,
  }

]