import type { ReactNode } from "react";

import { AvatarInitials } from "@/components/ui/avatar-initials";
import { StatusBadge } from "@/components/ui/status-badge";

import { formatEntrepreneurDate, toAvatarName } from "../../utils/entrepreneurUtils";

import type { EntrepreneurDetail } from "../../types/entrepreneur";

export function EntrepreneurDetailHeader({
  entrepreneur,
  actions,
}: {
  entrepreneur: EntrepreneurDetail;
  actions?: ReactNode;
}) {
  const registeredAt = formatEntrepreneurDate(entrepreneur.createdAt);

  return (
    <header className="flex min-w-0 flex-col gap-4 rounded-2xl border border-slate-200 border-l-[5px] border-l-[#084166] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
      <div className="self-start sm:self-center">
        <AvatarInitials nombre={toAvatarName(entrepreneur.nombre)} />
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Ficha del emprendedor</p>
        <h1 className="break-words text-2xl font-bold text-slate-800">{entrepreneur.nombre}</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
          <StatusBadge value={entrepreneur.estado} />
          {registeredAt && <span>Registrado el {registeredAt}</span>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2 sm:self-center">{actions}</div>}
    </header>
  );
}
