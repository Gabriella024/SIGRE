import { useState } from "react";

import { useAccessControl } from "@/features/access-control/hooks/useAccessControl";

export function PermissionsErrorNotice() {
  const { error, refreshPermissions } = useAccessControl();
  const [retrying, setRetrying] = useState(false);

  async function handleRetry() {
    setRetrying(true);
    await refreshPermissions();
    setRetrying(false);
  }

  return (
    <div role="alert" className="space-y-3 p-6 text-red-700">
      <p>No fue posible verificar los permisos.</p>
      {error && <p className="text-sm text-red-600/80">{error}</p>}
      <button
        type="button"
        onClick={() => void handleRetry()}
        disabled={retrying}
        className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
      >
        {retrying ? "Reintentando..." : "Reintentar"}
      </button>
    </div>
  );
}
