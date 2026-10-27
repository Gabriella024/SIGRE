import { AvatarInitials } from "@/components/ui/avatar-initials";
import { NullableText } from "@/components/ui/nullable-text";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatTimestamp } from "@/lib/format";

import { EntrepreneurDetailLink } from "./EntrepreneurDetailLink";
import { LinkedUserSummary } from "./LinkedUserSummary";
import { toAvatarName } from "../utils/entrepreneurUtils";

import type { Entrepreneur } from "../types/entrepreneur";

const FIELDS: { label: string; value: (row: Entrepreneur) => string | null }[] = [
  { label: "Centro SENA", value: (row) => row.centro },
  { label: "Programa de formación", value: (row) => row.programa },
  { label: "Nivel de formación", value: (row) => row.nivelFormacion },
  { label: "Tipo de emprendedor", value: (row) => row.tipo },
];

export function EntrepreneurCard({ entrepreneur }: { entrepreneur: Entrepreneur }) {
  return (
    <article className="flex w-full min-w-0 flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="flex min-w-0 items-start gap-3">
        <AvatarInitials nombre={toAvatarName(entrepreneur.nombre)} />
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="break-words text-sm font-semibold text-slate-900">{entrepreneur.nombre}</h3>
          <StatusBadge value={entrepreneur.estado} />
        </div>
      </header>

      <dl className="grid min-w-0 gap-2 text-sm">
        {FIELDS.map(({ label, value }) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs font-medium text-slate-500">{label}</dt>
            <dd className="break-words text-slate-700">
              <NullableText value={value(entrepreneur)} />
            </dd>
          </div>
        ))}
        <div className="min-w-0">
          <dt className="text-xs font-medium text-slate-500">Orientador</dt>
          <dd className="break-words text-slate-700">
            <LinkedUserSummary
              linkedId={entrepreneur.orientadorId}
              usuario={entrepreneur.orientador}
              emptyLabel="Sin orientador asignado"
              showEmail={false}
            />
          </dd>
        </div>
      </dl>

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <span>Registrado el {formatTimestamp(entrepreneur.createdAt)}</span>
        <EntrepreneurDetailLink entrepreneur={entrepreneur} />
      </footer>
    </article>
  );
}
