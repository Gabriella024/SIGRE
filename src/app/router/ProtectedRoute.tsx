
import { Navigate } from "react-router-dom";

import { useAuth } from "@/features/auth/context/AuthContext";
import { useAccessControl } from "@/features/access-control/hooks/useAccessControl";

import type { ReactNode } from "react";
import type { SigreAction } from "@/features/access-control/types/types";

type ProtectedRouteProps = {
  children: ReactNode;
  moduleCode?: string;
  action?: SigreAction;
};

export function ProtectedRoute({
  children,
  moduleCode,
  action = "ver",
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  const {
    can,
    isLoading: permissionsLoading,
    error,
  } = useAccessControl();

  if (isLoading) {
    return <div>Cargando sesión...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (permissionsLoading) {
    return <div>Verificando permisos...</div>;
  }

  if (error) {
    return (
      <div role="alert" className="p-6 text-red-700">
        No fue posible verificar los permisos.
        Intenta iniciar sesión nuevamente.
      </div>
    );
  }

  if (moduleCode && !can(moduleCode, action)) {
    return (
      <div className="p-6">
        <h2 className="text-lg font-semibold">
          Acceso restringido
        </h2>
        <p className="mt-2 text-slate-600">
          No tienes autorización para acceder
          a esta funcionalidad.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
