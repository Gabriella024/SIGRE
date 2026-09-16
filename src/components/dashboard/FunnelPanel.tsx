import { embudoEtapas } from '@/features/dashboard/mocks/dashboardMocks'

export function FunnelPanel() {
  const total = embudoEtapas.reduce((sum, e) => sum + e.valor, 0)
  const max = Math.max(...embudoEtapas.map((e) => e.valor))

  return (
    <div className="rounded-lg border bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-slate-900">Embudo por Etapa</h3>
      <p className="text-xs text-slate-400">Año 2026 · Regional Atlántico</p>

      <div className="mt-4 space-y-4">
        {embudoEtapas.map((etapa) => (
          <div key={etapa.etapa}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{etapa.etapa}</span>
              <span className="font-medium text-slate-900">{etapa.valor}</span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
              <div
                className={`h-1.5 rounded-full ${etapa.color}`}
                style={{ width: `${(etapa.valor / max) * 100}%` }}
              />
            </div>
          </div>
        ))}

        <div className="flex items-center justify-between border-t pt-3 text-sm font-semibold text-slate-900">
          <span>Total</span>
          <span>{total}</span>
        </div>
      </div>
    </div>
  )
}