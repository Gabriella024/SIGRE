import { MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Orientacion } from '@/features/orientations/types/orientations'

const estadoStyles: Record<Orientacion['estado'], string> = {
  Programada: 'bg-green-100 text-green-700',
  Finalizada: 'bg-slate-100 text-slate-500',
  "En Proceso": 'bg-blue-100 text-blue-700',
}

export function ProjectsTable({ orientacion }: { orientacion: Orientacion[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase text-slate-400">
            <th className="px-4 py-3 font-medium">Jornada</th>
            <th className="px-4 py-3 font-medium">Fecha/Hora</th>
            <th className="px-4 py-3 font-medium">Modalidad</th>
            <th className="px-4 py-3 font-medium">Lugar/Link</th>
            <th className="px-4 py-3 font-medium">Cupo</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {orientacion.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                No hay orientaciones registradas.
              </td>
            </tr>
          ) : (
            orientacion.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{p.nombre}</td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(p.fechayhora).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-slate-500">{p.modalidad}</td>
                <td className="px-4 py-3 text-slate-500">{p.lugarylink}</td>
                <td className="px-4 py-3 text-slate-500">{p.cupo}</td>
                
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