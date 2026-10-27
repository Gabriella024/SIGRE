import { useCallback, useMemo, useRef, useState } from "react";

import { useAuth } from "@/features/auth/context/AuthContext";
import { useAccessControl } from "@/features/access-control/hooks/useAccessControl";
import { SCREEN_CODES } from "@/features/access-control/constants/screens";
import { checkPermission } from "@/features/access-control/services/accessControlService";
import { useUserScopedQuery } from "@/hooks/useUserScopedQuery";
import { downloadExcel } from "@/lib/excel";
import { localDateKey } from "@/lib/format";

import { REPORT_CONFIGS, REPORT_IDS } from "../utils/reportCatalog";
import { resolveDataScope } from "../utils/informesUtils";

import type { DataScope, ReportConfig, ReportId, ReportRowMap } from "../types/types";

export type ReportExportOutcome =
  | { status: "success"; count: number }
  | { status: "empty" }
  | { status: "denied" }
  | { status: "error"; message: string };

export function useDataScope(): DataScope | null {
  const { user } = useAuth();
  const { roles } = useAccessControl();
  const userId = user?.id ?? null;
  return useMemo(() => resolveDataScope(roles, userId), [roles, userId]);
}

export function useAvailableReports(scope: DataScope | null): ReportId[] {
  const { can } = useAccessControl();
  return useMemo(
    () =>
      scope
        ? REPORT_IDS.filter((id) => {
            const config = REPORT_CONFIGS[id];
            return config.scopes.includes(scope.kind) && can(config.moduleCode, "ver", SCREEN_CODES[config.moduleCode]);
          })
        : [],
    [scope, can]
  );
}

export function useReportData<K extends ReportId>(id: K, scope: DataScope | null, enabled: boolean) {
  const fetcher = useCallback((): Promise<ReportRowMap[K][]> => {
    if (!enabled || !scope) return Promise.resolve([]);
    const config: ReportConfig<ReportRowMap[K]> = REPORT_CONFIGS[id];
    return config.fetch(scope);
  }, [id, scope, enabled]);
  return useUserScopedQuery(fetcher);
}

export function useReportExport() {
  const { user } = useAuth();
  const { can } = useAccessControl();
  const userId = user?.id ?? null;
  const [deniedFor, setDeniedFor] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [outcome, setOutcome] = useState<ReportExportOutcome | null>(null);
  const exportingRef = useRef(false);

  const canExport = userId !== null && deniedFor !== userId && can("informes", "exportar", SCREEN_CODES.informes);

  const exportar = useCallback(
    async <T extends { id: string }>(config: ReportConfig<T>, scope: DataScope, rows: readonly T[]) => {
      if (exportingRef.current || !userId) return;
      exportingRef.current = true;
      setIsExporting(true);
      setOutcome(null);

      try {
        let allowed: boolean;
        try {
          allowed = await checkPermission("informes", "exportar");
        } catch {
          setOutcome({ status: "error", message: "No fue posible verificar tu autorización para exportar." });
          return;
        }
        if (!allowed) {
          setDeniedFor(userId);
          setOutcome({ status: "denied" });
          return;
        }
        if (rows.length === 0) {
          setOutcome({ status: "empty" });
          return;
        }
        try {
          await downloadExcel({
            fileName: `${config.fileName}_${localDateKey(new Date().toISOString())}.xlsx`,
            sheetName: config.sheetName,
            columns: config.columns(scope),
            rows,
          });
          setOutcome({ status: "success", count: rows.length });
        } catch {
          setOutcome({ status: "error", message: "No fue posible generar el archivo Excel." });
        }
      } finally {
        exportingRef.current = false;
        setIsExporting(false);
      }
    },
    [userId]
  );

  const reset = useCallback(() => setOutcome(null), []);

  return { canExport, isExporting, outcome, exportar, reset };
}
