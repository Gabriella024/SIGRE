import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useAccessControl } from "@/features/access-control/hooks/useAccessControl";
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
import { SCREEN_CODES } from '@/features/access-control/constants/screens';
import { entrepreneurSectionLabel, resolveEntrepreneurView } from '@/features/entrepreneurs/hooks/useEntrepreneurAccess';

const mainNav = [
  { to: '/dashboard', moduleCode: 'panel', screenCode: SCREEN_CODES.panel, label: 'Inicio', icon: LayoutGrid },
  { to: '/proyectos', moduleCode: 'proyectos', screenCode: SCREEN_CODES.proyectos, label: 'Proyectos', icon: FolderKanban },
  { to: '/emprendedores', moduleCode: 'emprendedores', screenCode: SCREEN_CODES.emprendedores, label: 'Emprendedores', icon: Users },
  { to: '/orientaciones', moduleCode: 'orientaciones', screenCode: SCREEN_CODES.orientaciones, label: 'Orientaciones', icon: Calendar },
  { to: '/orientacion-masiva', moduleCode: 'orientacion_masiva', screenCode: SCREEN_CODES.orientacion_masiva, label: 'Orientación masiva', icon: Send },
  { to: '/retos', moduleCode: 'retos', screenCode: SCREEN_CODES.retos, label: 'Retos', icon: Target },
  { to: '/pitch', moduleCode: 'pitch', screenCode: SCREEN_CODES.pitch, label: 'Pitch', icon: Presentation },
  { to: '/evaluaciones', moduleCode: 'evaluaciones', screenCode: SCREEN_CODES.evaluaciones, label: 'Evaluación', icon: ClipboardCheck },
  { to: '/evaluadores', moduleCode: 'evaluadores', screenCode: SCREEN_CODES.evaluadores, label: 'Evaluadores', icon: UserCheck },
  { to: '/informes', moduleCode: 'informes', screenCode: SCREEN_CODES.informes, label: 'Informes', icon: FileText },
];

const adminNav = [
  { to: '/usuarios', moduleCode: 'usuarios', screenCode: SCREEN_CODES.usuarios, label: 'Usuarios', icon: Users2 },
  { to: '/control-accesos', moduleCode: 'control_accesos', screenCode: SCREEN_CODES.control_accesos, label: 'Control de accesos', icon: ShieldCheck },
  { to: '/configuracion', moduleCode: 'configuracion', screenCode: SCREEN_CODES.configuracion, label: 'Configuración', icon: Settings },
];

type NavItemProps = Omit<(typeof mainNav)[number], 'moduleCode' | 'screenCode'>;

function NavItem({ to, label, icon: Icon }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[0.8125rem] font-medium transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
          isActive
            ? 'bg-brand-50 text-brand-800 before:absolute before:inset-y-2 before:-left-3 before:w-[3px] before:rounded-r-full before:bg-brand-500'
            : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn(
              'h-[18px] w-[18px] shrink-0 stroke-[1.75] transition-colors',
              isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'
            )}
            aria-hidden="true"
          />
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}

function NavSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="px-3 pb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-slate-500">{title}</p>
      {children}
    </div>
  );
}

export function Sidebar() {
  const { pathname } = useLocation();
  const [openedAt, setOpenedAt] = useState<string | null>(null);
  const open = openedAt === pathname;
  const setOpen = useCallback((next: boolean) => setOpenedAt(next ? pathname : null), [pathname]);
  const { can, roles } = useAccessControl();
  const entrepreneursLabel = entrepreneurSectionLabel(resolveEntrepreneurView(roles));

  const visibleMainNav = mainNav
    .filter((item) => can(item.moduleCode, 'ver', item.screenCode))
    .map((item) => (item.to === '/emprendedores' ? { ...item, label: entrepreneursLabel } : item));
  const visibleAdminNav = adminNav.filter((item) => can(item.moduleCode, 'ver', item.screenCode));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        aria-expanded={open}
        className={cn(
          'fixed top-3 left-3 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50 lg:hidden',
          open && 'hidden'
        )}
      >
        <Menu className="h-5 w-5 stroke-[1.75]" />
      </button>

      <div
        onClick={() => setOpen(false)}
        className={cn(
          'fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[2px] transition-opacity duration-200 lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-shrink-0 flex-col border-r border-slate-200/80 bg-surface shadow-xl transition-transform duration-200',
          'lg:static lg:z-auto lg:translate-x-0 lg:shadow-none',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="relative px-5 pt-5 pb-4">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
            className="absolute top-4 right-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          >
            <X className="h-5 w-5 stroke-[1.75]" />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 ring-1 ring-inset ring-brand-100">
              <img
                src="/logoSenaNaranja.png"
                alt="SENA"
                className="h-6 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold tracking-tight text-slate-900">SIGRE</p>
              <p className="truncate text-xs text-slate-600">Ruta emprendedora · SENA</p>
            </div>
          </div>

          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-[0.6875rem] font-semibold text-brand-800 ring-1 ring-inset ring-brand-100">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden="true" />
            Regional Atlántico
          </span>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-2 [scrollbar-color:theme(colors.slate.200)_transparent] [scrollbar-width:thin]">
          <NavSection title="Ruta emprendedora">
            {visibleMainNav.map(({ moduleCode, to, label, icon }) => (
              <NavItem key={moduleCode} to={to} label={label} icon={icon} />
            ))}
          </NavSection>

          {visibleAdminNav.length > 0 && (
            <NavSection title="Administración">
              {visibleAdminNav.map(({ moduleCode, to, label, icon }) => (
                <NavItem key={moduleCode} to={to} label={label} icon={icon} />
              ))}
            </NavSection>
          )}
        </nav>

        <p className="border-t border-slate-100 px-5 py-3 text-[0.6875rem] text-slate-400">SIGRE · MVP</p>
      </aside>
    </>
  );
}
