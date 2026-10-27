import { useCallback, useMemo } from "react";

import { useAuth } from "@/features/auth/context/AuthContext";
import { useAccessControl } from "@/features/access-control/hooks/useAccessControl";
import { SCREEN_CODES } from "@/features/access-control/constants/screens";
import { useAdminMutation } from "@/hooks/useAdminMutation";
import { useUserScopedQuery } from "@/hooks/useUserScopedQuery";

import {
  cambiarEstadoEvaluadorAdmin,
  getEvaluators,
  getEvaluatorsByUser,
  guardarEvaluadorAdmin,
} from "../service/evaluatorsService";
import { isEvaluatorScoped } from "../utils/evaluatorUtils";

import type { Evaluator, EvaluatorCapabilities } from "../types/evaluators";

export function useEvaluatorAccess(): EvaluatorCapabilities {
  const { roles, can } = useAccessControl();
  return useMemo(() => {
    const ownOnly = isEvaluatorScoped(roles);
    return {
      ownOnly,
      canCreate: !ownOnly && can("evaluadores", "crear", SCREEN_CODES.evaluadores),
      canEdit: !ownOnly && can("evaluadores", "editar", SCREEN_CODES.evaluadores),
    };
  }, [roles, can]);
}

export function useEvaluators(ownOnly: boolean) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const fetcher = useCallback((): Promise<Evaluator[]> => {
    if (!ownOnly) return getEvaluators();
    return userId ? getEvaluatorsByUser(userId) : Promise.resolve([]);
  }, [ownOnly, userId]);
  return useUserScopedQuery(fetcher);
}

export function useEvaluatorMutations(access: EvaluatorCapabilities) {
  const guardar = useAdminMutation(guardarEvaluadorAdmin, {
    allowed: access.canCreate || access.canEdit,
    deniedMessage: "No tienes autorización para gestionar evaluadores.",
    fallbackMessage: "No fue posible guardar el evaluador.",
    backend: { name: "sigre_admin_guardar_evaluador", operation: "Guardar evaluador" },
  });

  const cambiarEstado = useAdminMutation(cambiarEstadoEvaluadorAdmin, {
    allowed: access.canEdit,
    deniedMessage: "No tienes autorización para cambiar el estado de evaluadores.",
    fallbackMessage: "No fue posible cambiar el estado del evaluador.",
    backend: { name: "sigre_admin_cambiar_estado_evaluador", operation: "Cambiar estado del evaluador" },
  });

  return { guardar, cambiarEstado };
}
