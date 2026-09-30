import type { RolUsuario } from '@/features/users/types/users'

const roleStyles: Record<RolUsuario, string> = {
  Administrador: 'bg-blue-100 text-blue-700',
  Coordinador: 'bg-purple-100 text-purple-700',
  Evaluador: 'bg-amber-100 text-amber-700',
  Emprendedor: 'bg-teal-100 text-teal-700',
  Orientador: 'bg-rose-100 text-rose-700',
}

export function RoleBadge({ rol }: { rol: RolUsuario }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleStyles[rol]}`}>
      {rol}
    </span>
  )
}