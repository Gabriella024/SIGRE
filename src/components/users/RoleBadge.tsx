import type { RolUsuario } from '@/features/users/types/users'

const roleStyles: Record<RolUsuario, string> = {
  Administrador: "bg-lime-100 text-lime-700",
  Coordinador: "bg-cyan-100 text-cyan-800",
  Evaluador: "bg-indigo-100 text-indigo-800",
  Emprendedor: "bg-taupe-100 text-taupe-800",
  Orientador: "bg-mauve-100 text-mauve-800",
}

export function RoleBadge({ rol }: { rol: RolUsuario }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleStyles[rol]}`}>
      {rol}
    </span>
  )
}