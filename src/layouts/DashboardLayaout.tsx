import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'

export function DashboardLayout() {
  return (
    <div className="flex h-screen w-full bg-[#f8fafc] text-slate-900 overflow-hidden">
      {/* Sidebar Estático: Asegúrate de que adentro no tenga position: absolute o fixed */}
      <Sidebar />

      {/* Área derecha con flex-1 y min-w-0 para evitar que las tablas/gráficos se salgan */}
      <div className="flex flex-1 flex-col h-full min-w-0 overflow-hidden">
        <Topbar />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}