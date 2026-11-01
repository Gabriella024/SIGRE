import { formatStatusLabel, normalizeText } from "@/lib/format";

const roleStyles: Record<string, string> = {
  administrador: "bg-brand-50 text-brand-800 ring-brand-100",
  coordinador: "bg-sky-50 text-sky-800 ring-sky-100",
  evaluador: "bg-amber-50 text-amber-800 ring-amber-100",
  emprendedor: "bg-slate-100 text-slate-700 ring-slate-200",
  orientador: "bg-teal-50 text-teal-800 ring-teal-100",
}

export function RoleBadge({ rol }: { rol: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${roleStyles[normalizeText(rol)] ?? "bg-slate-100 text-slate-700 ring-slate-200"}`}>
      {formatStatusLabel(rol)}
    </span>
  )
}
