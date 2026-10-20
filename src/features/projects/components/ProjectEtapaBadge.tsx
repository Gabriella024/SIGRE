import { formatStatusLabel, normalizeText } from "@/lib/format";

const STAGE_STYLES: Record<string, string> = {
  retos: "bg-amber-100 text-amber-900 border-amber-200",
  orientacion: "bg-sky-100 text-sky-900 border-sky-200",
  pitch: "bg-purple-100 text-purple-900 border-purple-200",
  registro: "bg-pink-100 text-pink-800 border-pink-200",
};

const FALLBACK_STAGE = "bg-slate-100 text-slate-700 border-slate-200";

export function EtapaBadge({ etapa }: { etapa: string | null }) {
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
