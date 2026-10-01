
import type { Column } from "@/components/ui/table/types";
import type { Project, ProjectStage, ProjectStatus } from "./types/proyect";


function EtapaBadge({ etapa }: { etapa: ProjectStage }) {
  const stageStyles: Record<ProjectStage, string> = {
    Retos: "bg-amber-100 text-amber-900 border-amber-200",
    Orientación: "bg-sky-100 text-sky-900 border-sky-200",
    Pitch: "bg-purple-100 text-purple-900 border-purple-200",
    Registro: "bg-slate-100 text-slate-800 border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${stageStyles[etapa]}`}
    >
      {etapa}
    </span>
  );
}


function EstadoBadge({ estado }: { estado: ProjectStatus }) {
  const styles: Record<ProjectStatus, string> = {
    Activo: "bg-emerald-100 text-emerald-700",
    Finalizado: "bg-indigo-100 text-indigo-700",
    Inactivo: "bg-rose-100 text-rose-800",
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[estado]}`}>
      {estado}
    </span>
  );
}

export const PROJECT_COLUMNS: Column<Project>[] = [
  {
    key: "nombre",
    label: "PROYECTO",
    sortable: true,
    render: (row) => (
      <span className="font-semibold text-slate-900">{row.nombre}</span>
    ),
  },
  {
    key: "emprendedor",
    label: "EMPRENDEDOR",
    sortable: true,
  },
  {
    key: "municipio",
    label: "MUNICIPIO",
    sortable: true,
  },
  {
    key: "sector",
    label: "SECTOR",
    sortable: true,
  },
  {
    key: "etapa",
    label: "ETAPA",
    sortable: false, 
    render: (row) => <EtapaBadge etapa={row.etapa} />,
  },
  {
    key: "fechaRegistro",
    label: "FECHA DE REGISTRO",
    sortable: true,
  },
  {
    key: "estado",
    label: "ESTADO",
    sortable: false,
    render: (row) => <EstadoBadge estado={row.estado} />,
  },
];