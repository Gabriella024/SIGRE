import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'

export function DashboardLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-surface-muted text-slate-900">
      <Sidebar />

      <div className="flex flex-1 flex-col h-full min-w-0 overflow-hidden">
        <Topbar />

        <main className="flex-1 overflow-y-auto px-4 pt-8 pb-10 sm:px-6 lg:px-8 lg:pt-10">
          <div className="w-full max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}