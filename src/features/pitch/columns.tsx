import type { Column } from "@/components/ui/table/types"
import type { Pitch, PitchStatus, PitchModalities  } from "./types/pitch"

function EstadoBadge({ estado }: { estado: PitchStatus }) {
  const styles: Record<PitchStatus, string> = {
    Programado: "bg-emerald-100 text-emerald-700",
    Cerrado: "bg-indigo-100 text-indigo-700",
    "En Evaluación": "bg-rose-100 text-rose-800",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[estado]}`}>
      {estado}
    </span>
  );
}

function ModalidadBadge({modalidad}: {modalidad: PitchModalities}) {
  const modalityStage: Record<PitchModalities, string> = {
    Virtual: "bg-violet-100 text-violet-700",
    Presencial: "bg-pink-100 text-pink-700",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${modalityStage[modalidad]}`}>
      {modalidad}
    </span>
  )
}

export const PITCH_COLUMNS: Column<Pitch>[] = [
  {
    key: "etapa",
    label: "ETAPA",
    sortable: true,
    render: (row) => (
      <span className="font-semibold text-slate-900">{row.etapa}</span>
    ),
  },
  {
    key: "nombre",
    label: "SESIÓN",
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
    render: (row) => <ModalidadBadge modalidad={row.modalidad}/>
  },
  {
    key: "lugarylink",
    label: "LUGAR Y LINK",
    sortable: true,
  },
  {
    key: "estado",
    label: "ESTADO",
    sortable: false,
    render: (row) => <EstadoBadge estado={row.estado} />,
  },
]