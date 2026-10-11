import { useState } from "react";
import { DropdownMenu } from "radix-ui";
import { Bell, LogOut } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useAccessControl } from "@/features/access-control/hooks/useAccessControl";

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

export function Topbar() {
  const { user, logout } = useAuth();
  const { roles } = useAccessControl();
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

  const breadcrumb = breadcrumbMap[location.pathname] ?? "";

  const initials =
    user?.email?.slice(0, 2).toUpperCase() ?? "??";

  const roleLabel = roles
    .map(
      (role) =>
        role.charAt(0).toUpperCase() + role.slice(1)
    )
    .join(", ");

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-slate-200/70 bg-white pl-16 pr-4 sm:pr-6 lg:px-8 transition-all">
      <div className="flex min-w-0 items-center text-sm font-semibold text-slate-800">
        <span>SIGRE</span>
        <span className="mx-2 text-slate-300 font-normal">
          /
        </span>
        <span className="truncate text-slate-500 font-normal">
          {breadcrumb}
        </span>
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
          {roleLabel || "Sin rol asignado"}
        </span>

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              aria-label="Menú de usuario"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#032b43] text-xs font-bold text-white shadow-xs transition-shadow hover:ring-2 hover:ring-[#78c800]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#78c800] data-[state=open]:ring-2 data-[state=open]:ring-[#78c800]"
            >
              {initials}
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 w-60 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
            >
              <div className="px-3 py-2">
                <p className="truncate text-sm font-medium text-slate-800">
                  {user?.email}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {roleLabel || "Sin rol asignado"}
                </p>
              </div>

              <DropdownMenu.Separator className="my-1 h-px bg-slate-100" />

              <DropdownMenu.Item
                disabled={isLoggingOut}
                onSelect={(event) => {
                  event.preventDefault();
                  void handleLogout();
                }}
                className="flex cursor-pointer select-none items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 outline-none transition-colors data-[highlighted]:bg-rose-50 data-[highlighted]:text-rose-600 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60"
              >
                <LogOut className="h-4 w-4 stroke-[1.8]" />
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