import type { Column } from "@/components/ui/table/types";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { NullableText } from "@/components/ui/nullable-text";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatTimestamp } from "@/lib/format";

import { EntrepreneurDetailLink } from "./components/EntrepreneurDetailLink";
import { LinkedUserSummary } from "./components/LinkedUserSummary";
import { toAvatarName } from "./utils/entrepreneurUtils";

import type { Entrepreneur, EntrepreneurSortKey } from "./types/entrepreneur";

type EntrepreneurColumn = Column<Entrepreneur> & { key: EntrepreneurSortKey | "acciones" };

export const ENTREPRENEUR_COLUMNS: EntrepreneurColumn[] = [
  {
    key: "nombre",
    label: "EMPRENDEDOR",
    sortable: true,
    render: (row) => (
      <div className="flex min-w-48 items-center gap-3">
        <AvatarInitials nombre={toAvatarName(row.nombre)} />
        <span className="font-semibold text-slate-900">{row.nombre}</span>
      </div>
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
  {
    key: "orientador",
    label: "ORIENTADOR",
    sortable: true,
    render: (row) => (
      <div className="min-w-40">
        <LinkedUserSummary
          linkedId={row.orientadorId}
          usuario={row.orientador}
          emptyLabel="Sin orientador"
          showEmail={false}
        />
      </div>
    ),
  },
  {
    key: "createdAt",
    label: "REGISTRO",
    sortable: true,
    render: (row) => <span className="whitespace-nowrap">{formatTimestamp(row.createdAt)}</span>,
  },
  {
    key: "acciones",
    label: "ACCIONES",
    align: "right",
    className: "sticky right-0 bg-inherit shadow-[-8px_0_8px_-8px_rgba(15,23,42,0.18)]",
    render: (row) => <EntrepreneurDetailLink entrepreneur={row} />,
  },
];
