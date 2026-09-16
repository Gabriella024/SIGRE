import { MoreVertical } from "lucide-react";
import { cn } from '@/lib/utils'
import type { Emprendedor } from "@/features/entrepreneurs/types/entrepreneur";

const estadoStyles: Record<Emprendedor['estado'], string> = {
  Activo: 'bg-green-100 text-green-700',
  Inactivo: 'bg-slate-100 text-slate-500',
  Suspendido: 'bg-blue-100 text-gray-700',
}

export function EntrepreneursTable({ emprendedor }: { emprendedor: Emprendedor[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs uppercase text-slate-400">
            <th className="px-4 py-3 font-medium">Emprendedor</th>
            <th className="px-4 py-3 font-medium">Documento</th>
            <th className="px-4 py-3 font-medium">Correo</th>
            <th className="px-4 py-3 font-medium">Municipio</th>
            <th className="px-4 py-3 font-medium">Centro</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {emprendedor.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                No hay emprendedores registrados.
              </td>
            </tr>
          ) : (
            emprendedor.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{p.nombre}</td>
                <td className="px-4 py-3 text-slate-600">{p.documento}</td>
                <td className="px-4 py-3 text-slate-600">{p.correo}</td>
                <td className="px-4 py-3 text-slate-600">{p.municipio}</td>
                <td className="px-4 py-3 text-slate-600">{p.centro}</td>
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