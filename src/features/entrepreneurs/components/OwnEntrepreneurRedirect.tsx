import { Navigate } from "react-router-dom";

import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-state";

import { useEntrepreneurs } from "../hooks/useEntrepreneurs";

import type { EntrepreneurScope } from "../types/entrepreneur";

export function OwnEntrepreneurRedirect({ scope }: { scope: Extract<EntrepreneurScope, { kind: "own" }> }) {
  const { data, error, isLoading, reload } = useEntrepreneurs(scope);

  if (isLoading) return <LoadingState message="Buscando tu ficha de emprendedor..." />;
  if (error) return <ErrorState message="No fue posible cargar tu ficha de emprendedor." detail={error} onRetry={reload} />;
  if (!data || data.length === 0) {
    return (
      <EmptyState message="Tu cuenta no tiene un registro de emprendedor visible. Si crees que es un error, contacta al administrador." />
    );
  }
  if (data.length > 1) {
    return <EmptyState message="Tu cuenta tiene más de un registro de emprendedor asociado. Contacta al administrador." />;
  }

  return <Navigate to={`/emprendedores/${encodeURIComponent(data[0].id)}`} replace />;
}
