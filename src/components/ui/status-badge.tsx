import { formatStatusLabel } from "@/lib/format";

const POSITIVO = "bg-brand-50 text-brand-800 ring-brand-100";
const EN_CURSO = "bg-sky-50 text-sky-800 ring-sky-100";
const ATENCION = "bg-amber-50 text-amber-800 ring-amber-100";
const NEGATIVO = "bg-rose-50 text-rose-700 ring-rose-100";
const NEUTRO = "bg-slate-100 text-slate-700 ring-slate-200";

const TONES: Record<string, string> = {
  activo: POSITIVO,
  programada: POSITIVO,
  programado: POSITIVO,
  aprobado: POSITIVO,
  inscrito: POSITIVO,
  completada: POSITIVO,
  confirmado: EN_CURSO,
  en_evaluacion: EN_CURSO,
  asignado: EN_CURSO,
  entregado: EN_CURSO,
  finalizado: NEUTRO,
  finalizada: NEUTRO,
  cerrado: NEUTRO,
  cerrada: NEUTRO,
  borrador: NEUTRO,
  pendiente: ATENCION,
  requiere_ajustes: ATENCION,
  suspendido: ATENCION,
  inactivo: NEGATIVO,
  cancelada: NEGATIVO,
  cancelado: NEGATIVO,
  no_aprobado: NEGATIVO,
};

const FALLBACK_TONE = NEUTRO;

export function StatusBadge({
  value,
  label,
  emptyLabel = "Sin estado",
}: {
  value: string | null;
  label?: string | null;
  emptyLabel?: string;
}) {
  if (!value?.trim()) {
    return <span className="text-xs text-slate-500">{emptyLabel}</span>;
  }

  const tone = TONES[value.trim().toLowerCase()] ?? FALLBACK_TONE;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tone}`}
    >
      {label ?? formatStatusLabel(value)}
    </span>
  );
}
