import { proyectosAtencion } from '@/features/dashboard/mocks/dashboardMocks'

export function AttentionTable() {
  return (
    <div className="rounded-lg border bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-slate-900">Proyectos que requieren atención</h3>
      <p className="text-xs text-slate-400">Proyectos sin avance o en re-ajuste · Regional Atlántico</p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-slate-400">
              <th className="pb-2 font-medium">PROYECTO</th>
              <th className="pb-2 font-medium">ETAPA</th>
              <th className="pb-2 font-medium">MOTIVO</th>
              <th className="pb-2 font-medium">DÍAS SIN ACTIVIDAD</th>
              <th className="pb-2 font-medium">ORIENTADOR</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {proyectosAtencion.map((p) => (
              <tr key={p.id}>
                <td className="py-3">
                  <p className="font-medium text-slate-900">{p.proyecto}</p>
                  <p className="text-xs text-slate-400">{p.responsable}</p>
                </td>
                <td className="py-3">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{p.etapa}</span>
                </td>
                <td className="py-3">
                  <span className="rounded bg-orange-100 px-2 py-0.5 text-xs text-orange-600">
                    {p.motivo}
                  </span>
                </td>
                <td className="py-3 text-red-500">{p.diasSinActividad} días</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-[10px] text-white">
                      {p.orientador.split(' ').map((n) => n[0]).join('')}
                    </div>
                    {p.orientador}
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