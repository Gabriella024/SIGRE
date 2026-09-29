import { embudoEtapas } from "@/features/dashboard/mocks/dashboardMocks"

interface FunnelItem {
  etapa: string
  valor: number
  color: string
}

interface FunnelCardProps {
  data?: FunnelItem[]
}

const colorMap: Record<string, string> = {
  Registro: 'bg-emerald-500',
  Orientacion: 'bg-blue-500',
  'Orientación': 'bg-blue-500',
  Retos: 'bg-amber-500',
  'Retos aprobados': 'bg-rose-500',
  'Pitch aprobados': 'bg-pink-500',
  Miniperfiles: 'bg-fuchsia-500',
}

export function FunnelCard({ data = embudoEtapas }: FunnelCardProps) {
  const total = data.reduce((acc, item) => acc + item.valor, 0)
  const maxValor = Math.max(...data.map((d) => d.valor), 1)

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100">
      <div>
        <h3 className="text-base font-bold text-slate-900">Embudo por Etapa</h3>
        <p className="text-xs text-slate-400 mt-0.5">Año 2026 · Regional Atlántico</p>

        <div className="mt-6 space-y-5">
          {data.map((item) => {
            const barColor = colorMap[item.etapa] || item.color || 'bg-slate-400'
            const widthPercentage = Math.max((item.valor / maxValor) * 40, 8)

            return (
              <div key={item.etapa} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>{item.etapa}</span>
                  <span className="font-bold text-slate-900">{item.valor}</span>
                </div>

                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${widthPercentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between font-bold text-slate-900 text-sm">
        <span>Total</span>
        <span>{total}</span>
      </div>
    </div>
  )
}