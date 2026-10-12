import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "@/features/auth/context/AuthContext";
import { useAccessControl } from "@/features/access-control/hooks/useAccessControl";
import { PermissionsErrorNotice } from "./PermissionsErrorNotice";

export function HomeRedirect() {
  const { user, isLoading, logout } = useAuth();
  const { isLoading: permissionsLoading, error, firstAllowedPath } =
    useAccessControl();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  if (isLoading) return <div>Cargando sesión...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (permissionsLoading) return <div>Verificando permisos...</div>;
  if (error) return <PermissionsErrorNotice />;
  if (firstAllowedPath) return <Navigate to={firstAllowedPath} replace />;

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (logoutError) {
      console.error("Error al cerrar sesión:", logoutError);
      setLoggingOut(false);
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold">Sin módulos asignados</h2>
      <p className="mt-2 text-slate-600">
        Tu usuario no tiene acceso a ningún módulo de SIGRE.
        Contacta al administrador.
      </p>
      <button
        type="button"
        onClick={() => void handleLogout()}
        disabled={loggingOut}
        className="mt-4 rounded-md bg-[#032b43] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {loggingOut ? "Saliendo..." : "Cerrar sesión"}
      </button>
    </div>
  );
}
