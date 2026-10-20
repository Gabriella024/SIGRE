import { useCallback } from "react";

import { useAuth } from "@/features/auth/context/AuthContext";
import { getAllEntrepreneurs } from "@/features/entrepreneurs/services/entrepreneursService";
import type { EntrepreneurScope } from "@/features/entrepreneurs/types/entrepreneur";
import { useUserScopedQuery } from "@/hooks/useUserScopedQuery";

import type { ProjectEntrepreneurScope } from "../types/proyect";

function toEntrepreneurScope(scope: ProjectEntrepreneurScope, userId: string): EntrepreneurScope {
  switch (scope) {
    case "all":
      return { kind: "all" };
    case "assigned":
      return { kind: "assigned", orientadorId: userId };
    case "own":
      return { kind: "own", usuarioId: userId };
  }
}

export function useProjectEntrepreneurOptions(scope: ProjectEntrepreneurScope) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const fetcher = useCallback(() => {
    if (!userId) return Promise.reject(new Error("No hay una sesión activa."));
    return getAllEntrepreneurs(toEntrepreneurScope(scope, userId));
  }, [scope, userId]);

  return useUserScopedQuery(fetcher);
}
