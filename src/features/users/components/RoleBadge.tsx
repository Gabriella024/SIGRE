import type { RolUsuario } from '@/features/users/types/users'

const roleStyles: Record<RolUsuario, string> = {
  Administrador: "bg-emerald-100 text-emerald-700",
  Coordinador: "bg-cyan-100 text-cyan-800",
  Evaluador: "bg-indigo-100 text-indigo-800",
  Emprendedor: "bg-violet-100 text-violet-800",
  Orientador: "bg-pink-100 text-pink-800",
}

export function RoleBadge({ rol }: { rol: RolUsuario }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleStyles[rol]}`}>
      {rol}
    </span>
  )
}