import { useMemo } from "react";

import { useAuth } from "@/features/auth/context/AuthContext";
import { useAccessControl } from "@/features/access-control/hooks/useAccessControl";
import type { SigreRole } from "@/features/access-control/types/types";

import { ALL_ENTREPRENEURS_SCOPE } from "../utils/entrepreneurUtils";

import type { EntrepreneurScope } from "../types/entrepreneur";

export type EntrepreneurRoleView = SigreRole;

const VIEW_PRECEDENCE: readonly EntrepreneurRoleView[] = [
  "administrador",
  "coordinador",
  "orientador",
  "emprendedor",
  "evaluador",
];

export function resolveEntrepreneurView(roles: readonly SigreRole[]): EntrepreneurRoleView | null {
  return VIEW_PRECEDENCE.find((view) => roles.includes(view)) ?? null;
}

export function entrepreneurSectionLabel(view: EntrepreneurRoleView | null): string {
  if (view === "orientador") return "Mis emprendedores";
  if (view === "emprendedor") return "Mi ficha";
  return "Emprendedores";
}

function resolveScope(view: EntrepreneurRoleView | null, userId: string | null): EntrepreneurScope | null {
  if (view === "orientador") return userId ? { kind: "assigned", orientadorId: userId } : null;
  if (view === "emprendedor") return userId ? { kind: "own", usuarioId: userId } : null;
  return ALL_ENTREPRENEURS_SCOPE;
}

export type EntrepreneurAccess = ReturnType<typeof useEntrepreneurAccess>;

export function useEntrepreneurAccess() {
  const { user } = useAuth();
  const { roles } = useAccessControl();
  const userId = user?.id ?? null;
  const view = resolveEntrepreneurView(roles);

  return useMemo(
    () => ({ view, scope: resolveScope(view, userId), label: entrepreneurSectionLabel(view) }),
    [view, userId]
  );
}
