import { proyectosAtencion } from '@/features/dashboard/mocks/dashboardMocks'

export function AttentionTable() {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
      <h3 className="font-semibold text-slate-900 text-base">Proyectos que requieren atención</h3>
      <p className="text-xs text-slate-400 mt-0.5">Proyectos sin avance o en re-ajuste · Regional Atlántico</p>

      <div className="mt-5 overflow-x-auto rounded-xl border border-slate-100">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="px-4 py-3">Proyecto</th>
              <th className="px-4 py-3">Etapa</th>
              <th className="px-4 py-3">Motivo</th>
              <th className="px-4 py-3">Días sin actividad</th>
              <th className="px-4 py-3">Orientador</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {proyectosAtencion.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3.5">
                  <p className="font-semibold text-slate-800 text-sm">{p.proyecto}</p>
                  <p className="text-xs text-slate-400">{p.responsable}</p>
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
                <td className="px-4 py-3.5 whitespace-nowrap font-bold text-rose-500">
                  {p.diasSinActividad} días
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-white shadow-sm">
                      {p.orientador.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <span className="font-medium text-slate-700">{p.orientador}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}