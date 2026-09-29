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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const mainNav = [
  { to: '/dashboard', label: 'Inicio', icon: LayoutGrid },
  { to: '/proyectos', label: 'Proyectos', icon: FolderKanban },
  { to: '/emprendedores', label: 'Emprendedores', icon: Users },
  { to: '/orientaciones', label: 'Orientaciones', icon: Calendar },
  { to: '/orientacion-masiva', label: 'Orientación masiva', icon: Send },
  { to: '/retos', label: 'Retos', icon: Target },
  { to: '/pitch', label: 'Pitch', icon: Presentation },
  { to: '/evaluaciones', label: 'Evaluación', icon: ClipboardCheck },
  { to: '/evaluadores', label: 'Evaluadores', icon: UserCheck },
  { to: '/informes', label: 'Informes', icon: FileText },
];

const adminNav = [
  { to: '/usuarios', label: 'Usuarios', icon: Users2 },
  { to: '/control-accesos', label: 'Control de accesos', icon: ShieldCheck },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
];

function NavItem({ to, label, icon: Icon }: (typeof mainNav)[number]) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3.5 rounded-lg px-3.5 py-2.5 text-sm transition-all duration-150',
          isActive
            ? 'bg-[#084166] text-white font-semibold border-l-4 border-[#78c800] shadow-sm'
            : 'text-slate-300/80 hover:bg-[#073859] hover:text-white'
        )
      }
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

export function Sidebar() {

  return (
    <>
      <div
        className="fixed top-0 left-0 z-40 h-screen w-4 bg-transparent"
      />

      <aside
        className="w-64 flex-shrink-0 h-full bg-[#032b43] text-white flex flex-col border-r border-slate-800"
      >
        <div className="px-5 py-6 border-b border-[#084166]">
          <div className="flex items-center gap-3">
            <img 
              src="../../../public/logoSenaNaranja.png" 
              alt="SENA Logo" 
              className="h-8 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="text-xl font-bold tracking-wide text-white">SIGRE</span>
          </div>

          <p className="mt-1.5 text-xs text-slate-300/80 font-medium">
            Ruta emprendedora · SENA
          </p>

          <span className="mt-3 inline-block rounded-md bg-[#6bb800] px-2.5 py-1 text-[11px] font-bold text-white uppercase tracking-wider">
            REG. ATLÁNTICO
          </span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {mainNav.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        <div className="space-y-1 border-t border-[#084166] px-3 py-4">
          {adminNav.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </div>
      </aside>
    </>
  );
}