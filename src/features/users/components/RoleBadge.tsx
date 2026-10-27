import { formatStatusLabel, normalizeText } from "@/lib/format";

const roleStyles: Record<string, string> = {
  administrador: "bg-emerald-100 text-emerald-700",
  coordinador: "bg-cyan-100 text-cyan-800",
  evaluador: "bg-indigo-100 text-indigo-800",
  emprendedor: "bg-violet-100 text-violet-800",
  orientador: "bg-pink-100 text-pink-800",
}

export function RoleBadge({ rol }: { rol: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleStyles[normalizeText(rol)] ?? "bg-slate-100 text-slate-700"}`}>
      {formatStatusLabel(rol)}
    </span>
  )
}
