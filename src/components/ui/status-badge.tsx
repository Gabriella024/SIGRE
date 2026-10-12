import { formatStatusLabel } from "@/lib/format";

const TONES: Record<string, string> = {
  activo: "bg-emerald-100 text-emerald-700",
  programada: "bg-emerald-100 text-emerald-700",
  finalizado: "bg-indigo-100 text-indigo-700",
  finalizada: "bg-indigo-100 text-indigo-700",
  borrador: "bg-slate-100 text-slate-700",
  inactivo: "bg-rose-100 text-rose-800",
  cancelada: "bg-rose-100 text-rose-800",
  cancelado: "bg-rose-100 text-rose-800",
  suspendido: "bg-amber-100 text-amber-800",
};

const FALLBACK_TONE = "bg-slate-100 text-slate-700";

export function StatusBadge({
  value,
  emptyLabel = "Sin estado",
}: {
  value: string | null;
  emptyLabel?: string;
}) {
  if (!value?.trim()) {
    return <span className="text-xs text-slate-400">{emptyLabel}</span>;
  }

  const tone = TONES[value.trim().toLowerCase()] ?? FALLBACK_TONE;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}
    >
      {formatStatusLabel(value)}
    </span>
  );
}
