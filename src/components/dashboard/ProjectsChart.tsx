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
    <div className="rounded-lg border bg-white p-5 shadow-sm">
      <h3 className="font-semibold text-slate-900">Proyectos Registrados por Mes</h3>
      <p className="text-xs text-slate-400">Año 2026 · Regional Atlántico</p>

      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={proyectosPorMes}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="mes" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} fontSize={12} />
            <Bar dataKey="total" fill="#84cc16" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}