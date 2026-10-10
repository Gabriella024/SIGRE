import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useAccessControl } from "@/features/access-control/hooks/useAccessControl";

import type { ReactNode } from "react";

type ProtectedRouteProps = {
  children: ReactNode;
  moduleCode?: string;
};

export function ProtectedRoute({
  children,
  moduleCode,
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
    return <div>Error al verificar permisos: {error}</div>;
  }

  if (moduleCode && !can(moduleCode, "ver")) {
    return <div>No tienes permisos para acceder a este módulo.</div>;
  }

  return <>{children}</>;
}