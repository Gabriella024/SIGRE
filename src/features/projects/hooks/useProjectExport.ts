import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/features/auth/context/AuthContext";
import { checkPermission } from "@/features/access-control/services/accessControlService";

import { getProjectsForExport } from "../services/proyectsService";
import {
  downloadProjectsExcel,
  runProjectExport,
  type ProjectExportDeps,
  type ProjectExportOutcome,
} from "../utils/projectExport";

import type { ProjectFilters } from "../types/proyect";

type PermissionState = { userId: string; allowed: boolean };

const checkExportPermission = () => checkPermission("proyectos", "exportar");

const EXPORT_DEPS: ProjectExportDeps = {
  checkPermission: checkExportPermission,
  fetchAll: getProjectsForExport,
  download: downloadProjectsExcel,
};

export function useProjectExport() {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [permission, setPermission] = useState<PermissionState | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [outcome, setOutcome] = useState<ProjectExportOutcome | null>(null);
  const exportingRef = useRef(false);

  useEffect(() => {
    if (!userId) return;
    let active = true;

    checkExportPermission()
      .then((allowed) => {
        if (active) setPermission({ userId, allowed });
      })
      .catch(() => {
        if (active) setPermission({ userId, allowed: false });
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const canExport = userId !== null && permission?.userId === userId && permission.allowed;

  const exportar = useCallback(
    async (filters: ProjectFilters): Promise<ProjectExportOutcome | null> => {
      if (exportingRef.current) return null;
      if (!userId) {
        const result: ProjectExportOutcome = { status: "denied" };
        setOutcome(result);
        return result;
      }

      exportingRef.current = true;
      setIsExporting(true);
      setOutcome(null);

      try {
        const result = await runProjectExport(filters, EXPORT_DEPS);
        if (result.status === "denied") setPermission({ userId, allowed: false });
        setOutcome(result);
        return result;
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
