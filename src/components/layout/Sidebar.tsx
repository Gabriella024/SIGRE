import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  FolderKanban,
  Users,
  Calendar,
  Send,
  Target,
  Presentation,
  ClipboardCheck,
  UserCheck,
  FileText,
  Users2,
  ShieldCheck,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const mainNav = [
  { to: '/dashboard', label: 'Inicio', icon: LayoutGrid },
  { to: '/proyectos', label: 'Proyectos', icon: FolderKanban },
  { to: '/emprendedores', label: 'Emprendedores', icon: Users },
  { to: '/orientaciones', label: 'Orientaciones', icon: Calendar },
  { to: '/orientacion-masiva', label: 'Orientación masiva', icon: Send },
  { to: '/retos', label: 'Retos', icon: Target },
  { to: '/pitch', label: 'Pitch', icon: Presentation },
  { to: '/evaluacion', label: 'Evaluación', icon: ClipboardCheck },
  { to: '/evaluadores', label: 'Evaluadores', icon: UserCheck },
  { to: '/informes', label: 'Informes', icon: FileText },
]

const adminNav = [
  { to: '/usuarios', label: 'Usuarios', icon: Users2 },
  { to: '/control-accesos', label: 'Control de accesos', 'icon': ShieldCheck },
  { to: 'configuracion', label: 'Configuración', icon: Settings },
]

function NavItem({ to, label, icon: Icon }: (typeof mainNav)[number]) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
          isActive
            ? 'bg-lime-500 text-slate-900'
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        )
      }
    >
      <Icon className="h-4 w-4"></Icon>
      {label}
    </NavLink>
  )
}

export function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col bg-slate-900 text-white">
      <div className="px-5 py-6">
        <div className="flex items-center gap-2">
          <span className=" text-lg font-bold text-lime-400">SIGRE</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">Ruta emprendedora · SENA</p>
        <span className="mt-2 inline-block rounded bg-lime-500/20 px-2 py-0.5 text-[10px] font-semibold text-lime-400">
          REG. ATLÁNTICO
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {mainNav.map((item) => (
          <NavItem key={item.to} {...item}/>
        ))}
      </nav>

      <div className="space-y-1 border-t border-slate-800 px-3 py-4">
        {adminNav.map((item) => (
          <NavItem key={item.to} {...item}/>
        ))}
      </div>

    </aside>
  )
}