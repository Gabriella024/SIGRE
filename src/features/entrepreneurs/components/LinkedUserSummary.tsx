import { formatStatusLabel } from "@/lib/format";

import { isUsuarioVigente } from "../utils/entrepreneurUtils";

import type { UsuarioResumen } from "../types/entrepreneur";

interface LinkedUserSummaryProps {
  linkedId: string | null;
  usuario: UsuarioResumen | null;
  emptyLabel: string;
  showEmail?: boolean;
}

function vigenciaLabel(usuario: UsuarioResumen): string | null {
  if (usuario.eliminado) return "Usuario eliminado";
  if (isUsuarioVigente(usuario)) return null;
  return usuario.estado?.trim() ? `Usuario ${formatStatusLabel(usuario.estado).toLowerCase()}` : "Usuario sin estado";
}

export function LinkedUserSummary({ linkedId, usuario, emptyLabel, showEmail = true }: LinkedUserSummaryProps) {
  if (!linkedId) return <span className="text-sm text-slate-500">{emptyLabel}</span>;

  if (!usuario) {
    return <span className="text-sm text-slate-500">Asignado · datos no disponibles para tu usuario</span>;
  }

  const vigencia = vigenciaLabel(usuario);

  return (
    <span className="block min-w-0">
      <span className="block break-words font-medium text-slate-800">{usuario.nombre ?? "Sin nombre registrado"}</span>
      {showEmail && usuario.correo && <span className="block break-all text-xs text-slate-500">{usuario.correo}</span>}
      {vigencia && (
        <span className="mt-1 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
          {vigencia}
        </span>
      )}
    </span>
  );
}
