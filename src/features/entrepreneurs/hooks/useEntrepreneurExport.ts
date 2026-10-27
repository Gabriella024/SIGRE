import { useCallback, useMemo, useRef, useState } from "react";

import { useAuth } from "@/features/auth/context/AuthContext";
import { SCREEN_CODES } from "@/features/access-control/constants/screens";
import { useAccessControl } from "@/features/access-control/hooks/useAccessControl";
import { checkPermission } from "@/features/access-control/services/accessControlService";

import { getEntrepreneursForExport } from "../services/entrepreneursService";
import {
  downloadEntrepreneursExcel,
  runEntrepreneurExport,
  type EntrepreneurExportDeps,
  type EntrepreneurExportOutcome,
} from "../utils/entrepreneurExport";

import { ALL_ENTREPRENEURS_SCOPE } from "../utils/entrepreneurUtils";

import type { EntrepreneurFilters, EntrepreneurScope, EntrepreneurSort } from "../types/entrepreneur";

export function useEntrepreneurExport(scope: EntrepreneurScope = ALL_ENTREPRENEURS_SCOPE) {
  const deps = useMemo<EntrepreneurExportDeps>(
    () => ({
      checkPermission: () => checkPermission("emprendedores", "exportar"),
      fetchAll: () => getEntrepreneursForExport(scope),
      download: downloadEntrepreneursExcel,
    }),
    [scope]
  );
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { can } = useAccessControl();
  const [deniedFor, setDeniedFor] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [outcome, setOutcome] = useState<EntrepreneurExportOutcome | null>(null);
  const exportingRef = useRef(false);

  const canExport =
    userId !== null &&
    deniedFor !== userId &&
    can("emprendedores", "exportar", SCREEN_CODES.emprendedores);

  const exportar = useCallback(
    async (
      filters: EntrepreneurFilters,
      sort: EntrepreneurSort
    ): Promise<EntrepreneurExportOutcome | null> => {
      if (exportingRef.current) return null;
      if (!userId) {
        const result: EntrepreneurExportOutcome = { status: "denied" };
        setOutcome(result);
        return result;
      }

      exportingRef.current = true;
      setIsExporting(true);
      setOutcome(null);

      try {
        const result = await runEntrepreneurExport(filters, sort, deps);
        if (result.status === "denied") setDeniedFor(userId);
        setOutcome(result);
        return result;
      } finally {
        exportingRef.current = false;
        setIsExporting(false);
      }
    },
    [userId, deps]
  );

  const reset = useCallback(() => setOutcome(null), []);

  return { canExport, isExporting, outcome, exportar, reset };
}
