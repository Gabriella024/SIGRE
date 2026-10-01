import type { Column } from "@/components/ui/table/types";
import type { Entrepreneur, EntrepreneurStatus } from './types/entrepreneur'

function EstadoBadge({ estado }: { estado: EntrepreneurStatus }) {
  const styles: Record<EntrepreneurStatus, string> = {
    Activo: "bg-emerald-100 text-emerald-700",
    Inactivo: "bg-rose-100 text-rose-800",
    Suspendido: "bg-indigo-100 text-indigo-700",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[estado]}`}>
      {estado}
    </span>
  );
}

export const ENTREPRENEUR_COLUMNS: Column<Entrepreneur>[] = [
  {
    key: "nombre",
    label: "EMPRENDEDOR",
    sortable: true,
    render: (row) => (
      <span className="font-semibold text-slate-900">{row.nombre}</span>
    ),
  },
  {
    key: "documento",
    label: "DOCUMENTO",
    sortable: true,
  },
  {
    key: "correo",
    label: "CORREO",
    sortable: true,
  },
  {
    key: "municipio",
    label: "MUNICIPIO",
    sortable: true,
  },
  {
    key: "centro",
    label: "CENTRO",
    sortable: true,
  },
  {
    key: "estado",
    label: "ESTADO",
    sortable: false,
    render: (row) => <EstadoBadge estado={row.estado} />,
  }
]