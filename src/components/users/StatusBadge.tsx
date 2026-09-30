import type { EstadoUsuario } from '@/features/users/types/users'

const statusStyles: Record<EstadoUsuario, string> = {
  Activo: 'bg-green-100 text-green-700',
  Inactivo: 'bg-red-100 text-red-600',
  Suspendido: 'bg-slate-100 text-slate-500',
}

export function StatusBadge({ estado }: { estado: EstadoUsuario }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[estado]}`}>
      {estado}
    </span>
  )
}