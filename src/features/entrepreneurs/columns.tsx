import type { Column } from "@/components/ui/table/types";
import { NullableText } from "@/components/ui/nullable-text";
import { StatusBadge } from "@/components/ui/status-badge";

import type { Entrepreneur } from "./types/entrepreneur";

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
    key: "centro",
    label: "CENTRO SENA",
    sortable: true,
    render: (row) => <NullableText value={row.centro} />,
  },
  {
    key: "programa",
    label: "PROGRAMA",
    sortable: true,
    render: (row) => <NullableText value={row.programa} />,
  },
  {
    key: "nivelFormacion",
    label: "NIVEL",
    sortable: true,
    render: (row) => <NullableText value={row.nivelFormacion} />,
  },
  {
    key: "tipo",
    label: "TIPO",
    sortable: true,
    render: (row) => <NullableText value={row.tipo} />,
  },
  {
    key: "estado",
    label: "ESTADO",
    sortable: true,
    render: (row) => <StatusBadge value={row.estado} />,
  },
];
