import type { Column } from '@/components/ui/table/types';
import type { Orientacion, OrientationStatus } from './types/orientations'

function EstadoBadge({ estado }: { estado: OrientationStatus }) {
  const styles: Record<OrientationStatus, string> = {
    Programada: "bg-emerald-100 text-emerald-700",
    Finalizada: "bg-indigo-100 text-indigo-700",
    "En Proceso": "bg-rose-100 text-rose-800",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[estado]}`}>
      {estado}
    </span>
  );
}


export const ORIENTATION_COLUMNS: Column<Orientacion>[] = [
  {
    key: "nombre",
    label: "JORNADA",
    sortable: true,
    render: (row) => (
      <span className="font-semibold text-slate-900">{row.nombre}</span>
    ),
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
    key: "lugarylink",
    label: "LUGAR Y LINK",
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
  },
]