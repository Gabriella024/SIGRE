import { Eye, Pencil, Trash2 } from "lucide-react";

import type { Column } from "@/components/ui/table/types";
import { NullableText } from "@/components/ui/nullable-text";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatTimestamp } from "@/lib/format";

import { EtapaBadge } from "./components/ProjectEtapaBadge";

import type { Project } from "./types/proyect";

const iconButton =
  "rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

export const PROJECT_COLUMNS: Column<Project>[] = [
  {
    key: "titulo",
    label: "PROYECTO",
    sortable: true,
    render: (row) => (
      <span className="font-semibold text-slate-900">{row.titulo}</span>
    ),
  },
  {
    key: "emprendedor",
    label: "EMPRENDEDOR",
    sortable: true,
    render: (row) => <NullableText value={row.emprendedor} />,
  },
  {
    key: "sector",
    label: "SECTOR",
    sortable: true,
    render: (row) => <NullableText value={row.sector} />,
  },
  {
    key: "etapa",
    label: "ETAPA",
    sortable: true,
    render: (row) => <EtapaBadge etapa={row.etapa} />,
  },
  {
    key: "createdAt",
    label: "FECHA DE REGISTRO",
    sortable: true,
    render: (row) => formatTimestamp(row.createdAt),
  },
  {
    key: "estado",
    label: "ESTADO",
    sortable: true,
    render: (row) => <StatusBadge value={row.estado} />,
  },
];

interface ProjectColumnOptions {
  onDetail: (project: Project) => void;
  onEdit?: (project: Project) => void;
  onDelete?: (project: Project) => void;
}

export function buildProjectColumns({ onDetail, onEdit, onDelete }: ProjectColumnOptions): Column<Project>[] {
  return [
    ...PROJECT_COLUMNS,
    {
      key: "acciones",
      label: "ACCIONES",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            className={iconButton}
            onClick={() => onDetail(row)}
            aria-label={`Ver detalle de ${row.titulo}`}
            title="Ver detalle"
          >
            <Eye className="h-4 w-4" />
          </button>
          {onEdit && (
            <button
              type="button"
              className={iconButton}
              onClick={() => onEdit(row)}
              aria-label={`Editar ${row.titulo}`}
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              className={iconButton}
              onClick={() => onDelete(row)}
              aria-label={`Eliminar ${row.titulo}`}
              title="Eliminar proyecto"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];
}
