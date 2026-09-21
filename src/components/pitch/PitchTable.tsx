import { MoreVertical } from "lucide-react";
import { cn } from '@/lib/utils'
import type { Pitch } from "@/features/pitch/types/pitch";

const estadoStyles: Record<Pitch['estado'], string> = {
  Programado: 'bg-green-100 text-green-700',
  Cerrado: 'bg-slate-100 text-slate-500',
  "En evaluación": 'bg-blue-100 text-blue-700',
}

export function EntrepreneursTable({ emprendedor }: { emprendedor: Pitch[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase text-slate-400">
            <th className="px-4 py-3 font-medium">Etapa</th>
            <th className="px-4 py-3 font-medium">Sesión</th>
            <th className="px-4 py-3 font-medium">Fecha y hora</th>
            <th className="px-4 py-3 font-medium">Modalidad</th>
            <th className="px-4 py-3 font-medium">Lugar/Link</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {emprendedor.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                No hay Pitch registrados.
              </td>
            </tr>
          ) : (
            emprendedor.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{p.etapa}</td>
                <td className="px-4 py-3 text-slate-600">{p.nombre}</td>
                <td className="px-4 py-3 text-slate-600">
                  {new Date(p.fechayhora).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-slate-600">{p.modalidad}</td>
                <td className="px-4 py-3 text-slate-600">{p.lugarylink}</td>
                <td className="px-4 py-3">
                  <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', estadoStyles[p.estado])}>
                    {p.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="rounded p-1 hover:bg-slate-100">
                    <MoreVertical className="h-4 w-4 text-slate-400"/>
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