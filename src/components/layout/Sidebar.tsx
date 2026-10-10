import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  Menu,
  X,
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
          'flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-xs transition-all duration-150',
          'lg:[@media(min-height:800px)]:gap-3.5 lg:[@media(min-height:800px)]:px-3.5 lg:[@media(min-height:800px)]:py-2.5 lg:[@media(min-height:800px)]:text-sm',
          isActive
            ? 'bg-[#084166] text-white font-semibold border-l-4 border-[#78c800] shadow-sm'
            : 'text-slate-300/80 hover:bg-[#073859] hover:text-white'
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0 lg:[@media(min-height:800px)]:h-5 lg:[@media(min-height:800px)]:w-5" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        aria-expanded={open}
        className={cn(
          'fixed top-3 left-3 z-40 flex h-10 w-10 items-center justify-center rounded-lg bg-[#032b43] text-white shadow-md lg:hidden',
          open && 'hidden'
        )}
      >
        <Menu className="h-5 w-5" />
      </button>

      <div
        onClick={() => setOpen(false)}
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-shrink-0 flex-col border-r border-slate-800 bg-[#032b43] text-white shadow-xl transition-transform duration-200',
          'lg:static lg:z-auto lg:translate-x-0 lg:shadow-none',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="relative border-b border-[#084166] px-4 py-3 lg:[@media(min-height:800px)]:px-5 lg:[@media(min-height:800px)]:py-6">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
            className="absolute top-3 right-3 rounded-md p-1 text-slate-300 hover:bg-[#073859] hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-3">
            <img
              src="/logoSenaNaranja.png"
              alt="SENA Logo"
              className="h-6 w-auto object-contain lg:[@media(min-height:800px)]:h-8"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span className="text-lg font-bold tracking-wide text-white lg:[@media(min-height:800px)]:text-xl">SIGRE</span>
          </div>

          <p className="mt-1 text-[11px] font-medium text-slate-300/80 lg:[@media(min-height:800px)]:mt-1.5 lg:[@media(min-height:800px)]:text-xs">
            Ruta emprendedora · SENA
          </p>

          <span className="mt-2 inline-block rounded-md bg-[#6bb800] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white lg:[@media(min-height:800px)]:mt-3 lg:[@media(min-height:800px)]:px-2.5 lg:[@media(min-height:800px)]:py-1 lg:[@media(min-height:800px)]:text-[11px]">
            REG. ATLÁNTICO
          </span>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2 lg:[@media(min-height:800px)]:space-y-1 lg:[@media(min-height:800px)]:py-4">
          {mainNav.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        <div className="space-y-0.5 border-t border-[#084166] px-3 py-2 lg:[@media(min-height:800px)]:space-y-1 lg:[@media(min-height:800px)]:py-4">
          {adminNav.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </div>
      </aside>
    </>
  );
}
