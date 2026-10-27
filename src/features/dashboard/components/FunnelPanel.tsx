import type { FunnelItem } from "@/features/dashboard/types/dashboard"

interface FunnelCardProps {
  title: string
  subtitle: string
  data: FunnelItem[]
}

const BAR_COLORS = ['bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-indigo-500', 'bg-rose-500', 'bg-purple-500']

export function FunnelCard({ title, subtitle, data }: FunnelCardProps) {
  const total = data.reduce((acc, item) => acc + item.valor, 0)
  const maxValor = Math.max(...data.map((d) => d.valor), 1)

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 h-full flex flex-col justify-between">
      <div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>

        {data.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
            No hay registros para agrupar.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {data.map((item, index) => {
              const widthPercentage = Math.max((item.valor / maxValor) * 100, 6)

              return (
                <div key={item.etapa} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>{item.etapa}</span>
                    <span className="font-bold text-slate-900">{item.valor}</span>
                  </div>

                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${BAR_COLORS[index % BAR_COLORS.length]}`}
                      style={{ width: `${widthPercentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between font-bold text-slate-900 text-sm">
        <span>Total</span>
        <span>{total}</span>
      </div>
    </div>
  )
}
