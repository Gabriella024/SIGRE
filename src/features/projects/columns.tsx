import type { Column } from "@/components/ui/table/types";
import { NullableText } from "@/components/ui/nullable-text";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatStatusLabel, formatTimestamp, normalizeText } from "@/lib/format";

import type { Project } from "./types/proyect";

const STAGE_STYLES: Record<string, string> = {
  retos: "bg-amber-100 text-amber-900 border-amber-200",
  orientacion: "bg-sky-100 text-sky-900 border-sky-200",
  pitch: "bg-purple-100 text-purple-900 border-purple-200",
  registro: "bg-pink-100 text-pink-800 border-pink-200",
};

const FALLBACK_STAGE = "bg-slate-100 text-slate-700 border-slate-200";

function EtapaBadge({ etapa }: { etapa: string | null }) {
  if (!etapa?.trim()) {
    return <span className="text-xs text-slate-400">Sin etapa</span>;
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STAGE_STYLES[normalizeText(etapa)] ?? FALLBACK_STAGE}`}
    >
      {formatStatusLabel(etapa)}
    </span>
  );
}

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
