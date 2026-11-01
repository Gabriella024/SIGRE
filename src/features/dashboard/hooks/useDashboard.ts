import { useCallback, useMemo } from "react";

import { useAccessControl } from "@/features/access-control/hooks/useAccessControl";
import { SCREEN_CODES } from "@/features/access-control/constants/screens";
import { MIN_EVALUADORES_POR_PITCH } from "@/features/evaluators/utils/evaluatorUtils";
import { useAvailableReports, useDataScope, useReportData } from "@/features/informes/hooks/useInformes";
import type { DataScope } from "@/features/informes/types/types";
import { getAllUsers } from "@/features/users/services/usersService";
import { useUserScopedQuery } from "@/hooks/useUserScopedQuery";

import { DASHBOARD_SOURCES_BY_ROLE, buildRoleDashboard } from "../utils/roleDashboard";

import type { DashboardData, DashboardRole, RoleDashboardModel, SourceId } from "../types/dashboard";

export interface SourceStatus {
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

export type SourceStatusMap = Partial<Record<SourceId, SourceStatus>>;

export interface DashboardFailure {
  id: SourceId;
  error: string;
  reload: () => void;
}

export const SOURCE_LABELS: Record<SourceId, string> = {
  emprendedores: "emprendedores",
  proyectos: "proyectos",
  orientaciones: "orientaciones",
  retos: "retos",
  pitch: "pitch",
  evaluaciones: "evaluaciones",
  usuarios: "usuarios",
};

export function dashboardRole(scope: DataScope | null): DashboardRole | null {
  if (!scope) return null;
  return scope.kind === "global" ? scope.role : scope.kind;
}

export function useDashboard() {
  const scope = useDataScope();
  const role = dashboardRole(scope);
  const available = useAvailableReports(scope);
  const { can } = useAccessControl();

  const enabled = useMemo(() => {
    const allowed = new Set<SourceId>(role ? DASHBOARD_SOURCES_BY_ROLE[role] : []);
    const result = new Set<SourceId>();
    for (const id of available) if (allowed.has(id)) result.add(id);
    if (allowed.has("usuarios") && can("usuarios", "ver", SCREEN_CODES.usuarios)) result.add("usuarios");
    return result;
  }, [role, available, can]);

  const emprendedores = useReportData("emprendedores", scope, enabled.has("emprendedores"));
  const proyectos = useReportData("proyectos", scope, enabled.has("proyectos"));
  const orientaciones = useReportData("orientaciones", scope, enabled.has("orientaciones"));
  const retos = useReportData("retos", scope, enabled.has("retos"));
  const pitch = useReportData("pitch", scope, enabled.has("pitch"));
  const evaluaciones = useReportData("evaluaciones", scope, enabled.has("evaluaciones"));

  const usersEnabled = enabled.has("usuarios");
  const fetchUsers = useCallback(() => (usersEnabled ? getAllUsers() : Promise.resolve([])), [usersEnabled]);
  const usuarios = useUserScopedQuery(fetchUsers);

  const queries = { emprendedores, proyectos, orientaciones, retos, pitch, evaluaciones, usuarios };

  const status: SourceStatusMap = {};
  for (const id of enabled) {
    const query = queries[id];
    status[id] = { isLoading: query.isLoading && !query.data, error: query.error, reload: query.reload };
  }

  const model: RoleDashboardModel | null = useMemo(() => {
    if (!role) return null;
    const data: DashboardData = {
      emprendedores: emprendedores.data ?? [],
      proyectos: proyectos.data ?? [],
      orientaciones: orientaciones.data ?? [],
      retos: retos.data ?? [],
      pitch: pitch.data ?? [],
      evaluaciones: evaluaciones.data ?? [],
      usuarios: usuarios.data ?? [],
    };
    return buildRoleDashboard(role, data, enabled, { now: new Date(), minEvaluadores: MIN_EVALUADORES_POR_PITCH });
  }, [role, enabled, emprendedores.data, proyectos.data, orientaciones.data, retos.data, pitch.data, evaluaciones.data, usuarios.data]);

  const failures: DashboardFailure[] = [...enabled].flatMap((id) => {
    const error = status[id]?.error;
    return error ? [{ id, error, reload: queries[id].reload }] : [];
  });

  return { scope, role, model, status, failures };
}
