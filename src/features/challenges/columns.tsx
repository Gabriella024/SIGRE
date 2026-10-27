import { Eye, Pencil } from "lucide-react";

import type { Column } from "@/components/ui/table/types";
import { NullableText } from "@/components/ui/nullable-text";
import { StatusBadge } from "@/components/ui/status-badge";

import type { Challenge } from "./types/Challenge";

const iconButton =
  "rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400";

interface ChallengeColumnOptions {
  onDetail: (challenge: Challenge) => void;
  onEdit?: (challenge: Challenge) => void;
}

export function buildChallengeColumns({ onDetail, onEdit }: ChallengeColumnOptions): Column<Challenge>[] {
  return [
    {
      key: "nivel",
      label: "NIVEL",
      sortable: true,
      render: (row) => <span className="font-semibold text-slate-900">{row.nivel}</span>,
    },
    { key: "titulo", label: "RETO", sortable: true },
    {
      key: "descripcion",
      label: "DESCRIPCIÓN",
      render: (row) => <NullableText value={row.descripcion} className="line-clamp-2" />,
    },
    { key: "proyectos", label: "PROYECTOS", sortable: true, align: "center" },
    {
      key: "estado",
      label: "ESTADO",
      sortable: true,
      render: (row) => <StatusBadge value={row.estado} />,
    },
    {
      key: "acciones",
      label: "ACCIONES",
      align: "right",
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button type="button" className={iconButton} onClick={() => onDetail(row)} title="Ver detalle" aria-label={`Ver detalle de ${row.titulo}`}>
            <Eye className="h-4 w-4" />
          </button>
          {onEdit && (
            <button type="button" className={iconButton} onClick={() => onEdit(row)} title="Editar" aria-label={`Editar ${row.titulo}`}>
              <Pencil className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];
}
