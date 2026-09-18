import { MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { User } from '@/features/users/types/users'

const estadoStyles: Record<User['estado'], string> = {
  Activo: 'bg-green-100 text-green-700',
  Inactivo: 'bg-slate-100 text-slate-500',
  Suspendido: 'bg-blue-100 text-gray-700',
}

const rolStyles: Record<User['rol'], string> = {
  Administrador: 'bg-lime-100 text-lime-700',
  Coordinador: 'bg-cyan-100 text-cyan-700',
  Orientador: 'bg-slate-200 text-slate-500',
  Evaluador: 'bg-mauve-100 text-mauve-700',
  Emprendedor: 'bg-taupe-200 text-taupe-600'
}

export function ProjectsTable({ usuarios }: { usuarios: User[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase text-slate-400">
            <th className="px-4 py-3 font-medium">Nombre</th>
            <th className="px-4 py-3 font-medium">Correo</th>
            <th className="px-4 py-3 font-medium">Rol/es</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">Último acceso</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {usuarios.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                No hay usuarios registrados registrados.
              </td>
            </tr>
          ) : (
            usuarios.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{p.nombre}</td>
                <td className="px-4 py-3 text-slate-600">{p.correo}</td>
                <td className="px-4 py-3">
                  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', rolStyles[p.rol])}>
                    {p.rol}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(p.ultimoAcceso).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', estadoStyles[p.estado])}>
                    {p.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="rounded p-1 hover:bg-slate-100">
                    <MoreVertical className="h-4 w-4 text-slate-400" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}