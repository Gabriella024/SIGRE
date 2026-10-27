import { formatDateOnly, formatTimestamp } from '@/lib/format'
import type { AttentionRow } from '@/features/dashboard/types/dashboard'

interface AttentionTableProps {
  subtitle: string
  rows: AttentionRow[]
}

function formatFecha(value: string | null): string {
  if (!value) return 'Sin fecha'
  return value.length > 10 ? formatTimestamp(value) : formatDateOnly(value)
}

export function AttentionTable({ subtitle, rows }: AttentionTableProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
      <h3 className="font-semibold text-slate-900 text-base">Proyectos que requieren atención</h3>
      <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>

      {rows.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
          No hay entregas de retos vencidas ni pitch sin el mínimo de evaluadores.
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">Proyecto</th>
                <th className="px-4 py-3">Etapa</th>
                <th className="px-4 py-3">Motivo</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Días vencido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-slate-800 text-sm">{p.proyecto ?? 'Proyecto no disponible'}</p>
                    <p className="text-xs text-slate-400">{p.emprendedor ?? 'Emprendedor no disponible'}</p>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200/60">
                      {p.etapa}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 border border-amber-200/60">
                      {p.motivo}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap text-slate-700">{formatFecha(p.fecha)}</td>
                  <td className="px-4 py-3.5 whitespace-nowrap font-bold text-rose-500">
                    {p.dias === null ? <span className="font-normal text-slate-300">—</span> : `${p.dias} días`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
