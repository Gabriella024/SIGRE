import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { MonthlyCount } from '@/features/dashboard/types/dashboard'

interface ProjectsChartProps {
  title: string
  subtitle: string
  data: MonthlyCount[]
}

export function ProjectsChart({ title, subtitle, data }: ProjectsChartProps) {
  const total = data.reduce((acc, item) => acc + item.total, 0)

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 h-full flex flex-col justify-between">
      <div>
        <h3 className="font-semibold text-slate-900 text-base">{title}</h3>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </div>

      {total === 0 ? (
        <div className="mt-6 flex min-h-[260px] flex-1 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500">
          No hay registros en este periodo.
        </div>
      ) : (
        <div className="mt-6 h-72 w-full flex-1 min-h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" />
              <Tooltip cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="total" name="Registros" fill="#84cc16" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
