import { useState } from "react";
import { DropdownMenu } from "radix-ui";
import { Bell, ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useAccessControl } from "@/features/access-control/hooks/useAccessControl";
import { entrepreneurSectionLabel, resolveEntrepreneurView } from "@/features/entrepreneurs/hooks/useEntrepreneurAccess";

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Inicio",
  "/proyectos": "Proyectos",
  "/emprendedores": "Emprendedores",
  "/orientaciones": "Orientaciones",
  "/orientacion-masiva": "Orientación masiva",
  "/retos": "Retos",
  "/pitch": "Pitch",
  "/evaluaciones": "Evaluación",
  "/evaluadores": "Evaluadores",
  "/informes": "Informes",
  "/usuarios": "Usuarios",
  "/control-accesos": "Control de accesos",
  "/configuracion": "Configuración",
};

const ENTREPRENEUR_DETAIL_PREFIX = "/emprendedores/";

function resolveBreadcrumb(pathname: string, entrepreneursLabel: string): string {
  if (pathname === "/emprendedores") return entrepreneursLabel;
  if (pathname.startsWith(ENTREPRENEUR_DETAIL_PREFIX) && pathname.length > ENTREPRENEUR_DETAIL_PREFIX.length) {
    return entrepreneursLabel === "Mi ficha" ? entrepreneursLabel : `${entrepreneursLabel} / Ficha`;
  }
  return breadcrumbMap[pathname] ?? "";
}

export function Topbar() {
  const { user, logout } = useAuth();
  const { roles, isLoading: permissionsLoading } = useAccessControl();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  async function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      setLogoutError(
        error instanceof Error
          ? error.message
          : "No fue posible cerrar la sesión."
      );
      setIsLoggingOut(false);
    }
  }

  const breadcrumb = resolveBreadcrumb(location.pathname, entrepreneurSectionLabel(resolveEntrepreneurView(roles)));

  const initials =
    user?.email?.slice(0, 2).toUpperCase() ?? "??";

  const rawName = user?.email?.split("@")[0] ?? "";
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  const roleLabel = roles
    .map(
      (role) =>
        role.charAt(0).toUpperCase() + role.slice(1)
    )
    .join(", ");

  const roleText = permissionsLoading
    ? "Cargando rol..."
    : roleLabel || "Sin rol asignado";

  return (
    <header className="flex h-16 w-full shrink-0 items-center justify-between gap-4 border-b border-slate-200/70 bg-white/90 pl-16 pr-4 backdrop-blur supports-[backdrop-filter]:bg-white/75 sm:pr-6 lg:px-8">
      <div className="min-w-0">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-slate-500">SIGRE</p>
        <p className="truncate text-[0.95rem] font-semibold text-slate-900">{breadcrumb}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        <button
          type="button"
          disabled
          aria-label="Notificaciones (disponible próximamente)"
          title="Notificaciones disponibles próximamente"
          className="rounded-xl p-2 text-slate-400 disabled:cursor-not-allowed"
        >
          <Bell className="h-5 w-5 stroke-[1.75]" />
        </button>

        <span className="hidden h-6 w-px bg-slate-200 sm:block" aria-hidden="true" />

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              aria-label="Menú de usuario"
              className="flex items-center gap-3 rounded-xl p-1 pr-1 text-left transition-colors hover:bg-slate-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 data-[state=open]:bg-slate-100/70 sm:pr-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-semibold text-white">
                {initials}
              </span>
              <span className="hidden min-w-0 sm:block">
                <span className="block max-w-[11rem] truncate text-sm font-medium text-slate-900">{displayName}</span>
                <span className="block max-w-[11rem] truncate text-xs text-brand-700">{roleText}</span>
              </span>
              <ChevronDown className="hidden h-4 w-4 stroke-[1.75] text-slate-400 sm:block" aria-hidden="true" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
            >
              <div className="px-3 py-2">
                <p className="truncate text-sm font-medium text-slate-800">
                  {user?.email}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {roleText}
                </p>
              </div>

              <DropdownMenu.Separator className="my-1 h-px bg-slate-100" />

              <DropdownMenu.Item
                disabled={isLoggingOut}
                onSelect={(event) => {
                  event.preventDefault();
                  void handleLogout();
                }}
                className="flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 outline-none transition-colors data-[highlighted]:bg-rose-50 data-[highlighted]:text-rose-600 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60"
              >
                <LogOut className="h-4 w-4 stroke-[1.75]" />
                {isLoggingOut ? "Saliendo..." : "Cerrar sesión"}
              </DropdownMenu.Item>

              {logoutError && (
                <p
                  role="alert"
                  className="mx-1 mb-1 mt-1 rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700"
                >
                  {logoutError}
                </p>
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}