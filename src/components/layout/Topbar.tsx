import { Bell } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useLocation } from "react-router-dom";

const breadcrumbMap: Record<string, string> = {
  '/dashboard': 'Inicio',
  '/proyectos': 'Proyectos',
  '/emprendedores': 'Emprendedores',
  '/orientaciones': 'Orientaciones',
  '/orientacion-masiva': 'Orientación masiva',
  '/retos': 'Retos',
  '/pitch': 'Pitch',
  '/evaluaciones': 'Evaluación',
  '/evaluadores': 'Evaluadores',
  '/informes': 'Informes',
  '/usuarios': 'Usuarios',
  '/control-accesos': 'Control de accesos',
  '/configuracion': 'Configuración',
}

export function Topbar() {
  const { user } = useAuth()
  const location = useLocation()
  const breadcrumb = breadcrumbMap[location.pathname] ?? ''
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '??'

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-200/70 bg-white pl-16 pr-4 sm:pr-6 lg:px-8 transition-all">
      <div className="flex min-w-0 items-center text-sm font-semibold text-slate-800">
        <span>SIGRE</span>
        <span className="mx-2 text-slate-300 font-normal">/</span>
        <span className="truncate text-slate-500 font-normal">{breadcrumb}</span>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        <button 
          type="button" 
          className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <Bell className="h-5 w-5 stroke-[1.8]" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        <span className="hidden sm:inline-block rounded-full bg-[#dcfce7] px-3.5 py-1 text-xs font-semibold text-[#15803d]">
          Administrador
        </span>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#032b43] text-xs font-bold text-white shadow-xs">
          {initials}
        </div>
      </div>
    </header>
  )
}