import type { ReactNode } from "react";

import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-state";

export interface OrientationsQuery<T> {
  data: T[];
  error: string | null;
  isLoading: boolean;
  reload: () => void;
}

export function QueryContent<T>({
  query,
  emptyMessage,
  children,
}: {
  query: OrientationsQuery<T>;
  emptyMessage: string;
  children: ReactNode;
}) {
  if (query.isLoading) return <LoadingState message="Cargando jornadas..." />;
  if (query.error) {
    return (
      <ErrorState message="No fue posible cargar las jornadas." detail={query.error} onRetry={query.reload} />
    );
  }
  if (query.data.length === 0) return <EmptyState message={emptyMessage} />;
  return <>{children}</>;
}
