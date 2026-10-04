import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import { proyectosPorMes } from '@/features/dashboard/mocks/dashboardMocks'

export function ProjectsChart() {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 h-full flex flex-col justify-between">
      <div>
        <h3 className="font-semibold text-slate-900 text-base">Proyectos Registrados por Mes</h3>
        <p className="text-xs text-slate-400 mt-0.5">Año 2026 · Regional Atlántico</p>
      </div>

      <div className="mt-6 h-72 w-full flex-1 min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={proyectosPorMes}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" />
            <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" />
            <Bar dataKey="total" fill="#84cc16" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}