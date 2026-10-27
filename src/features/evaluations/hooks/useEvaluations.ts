import { useCallback, useMemo } from "react";

import { useAuth } from "@/features/auth/context/AuthContext";
import { useAccessControl } from "@/features/access-control/hooks/useAccessControl";
import { SCREEN_CODES } from "@/features/access-control/constants/screens";
import { isEvaluatorScoped } from "@/features/evaluators/utils/evaluatorUtils";
import { useAdminMutation } from "@/hooks/useAdminMutation";
import { useUserScopedQuery } from "@/hooks/useUserScopedQuery";

import { getConsolidatedResults, getMyEvaluations, registrarCalificacion } from "../service/evaluationsService";

import type { Evaluacion, EvaluationCapabilities } from "../types/evaluacion";
import type { EvaluationResults } from "../types/resultado";

export function useEvaluationAccess(): EvaluationCapabilities {
  const { roles, can } = useAccessControl();
  return useMemo(() => {
    const evaluatorScoped = isEvaluatorScoped(roles);
    return {
      evaluatorScoped,
      canGrade: evaluatorScoped && (can("evaluaciones", "crear", SCREEN_CODES.evaluaciones) || can("evaluaciones", "editar", SCREEN_CODES.evaluaciones)),
      canViewResults: !evaluatorScoped && can("evaluaciones", "ver", SCREEN_CODES.evaluaciones),
      canManageAssignments: !evaluatorScoped && can("pitch", "editar", SCREEN_CODES.pitch),
    };
  }, [roles, can]);
}

export function useMyEvaluations(enabled: boolean) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const fetcher = useCallback(
    (): Promise<Evaluacion[]> => (enabled && userId ? getMyEvaluations(userId) : Promise.resolve([])),
    [enabled, userId]
  );
  return useUserScopedQuery(fetcher);
}

export function useConsolidatedResults(enabled: boolean) {
  const fetcher = useCallback(
    (): Promise<EvaluationResults[]> => (enabled ? getConsolidatedResults() : Promise.resolve([])),
    [enabled]
  );
  return useUserScopedQuery(fetcher);
}

export function useGradeMutation(canGrade: boolean) {
  return useAdminMutation(registrarCalificacion, {
    allowed: canGrade,
    deniedMessage: "No tienes autorización para calificar pitch.",
    fallbackMessage: "No fue posible registrar la calificación.",
    backend: { name: "sigre_evaluador_registrar_calificacion", operation: "Registrar calificación" },
  });
}
