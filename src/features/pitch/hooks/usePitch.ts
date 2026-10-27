import { useCallback, useMemo } from "react";

import { useAuth } from "@/features/auth/context/AuthContext";
import { useAccessControl } from "@/features/access-control/hooks/useAccessControl";
import { SCREEN_CODES } from "@/features/access-control/constants/screens";
import { isEvaluatorScoped } from "@/features/evaluators/utils/evaluatorUtils";
import { useAdminMutation } from "@/hooks/useAdminMutation";
import { useUserScopedQuery } from "@/hooks/useUserScopedQuery";

import {
  asignarEvaluadorPitchAdmin,
  cambiarEstadoPitchAdmin,
  getAssignedPitches,
  getPitchPreparations,
  getPitches,
  guardarPitchAdmin,
  retirarEvaluadorPitchAdmin,
} from "../services/pitchService";

import type { Pitch, PitchCapabilities, PitchPreparation } from "../types/pitch";

export function usePitchAccess(): PitchCapabilities {
  const { roles, can } = useAccessControl();
  return useMemo(() => {
    const evaluatorScoped = isEvaluatorScoped(roles);
    return {
      evaluatorScoped,
      canCreate: !evaluatorScoped && can("pitch", "crear", SCREEN_CODES.pitch),
      canEdit: !evaluatorScoped && can("pitch", "editar", SCREEN_CODES.pitch),
    };
  }, [roles, can]);
}

export function usePitches(evaluatorScoped: boolean) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const fetcher = useCallback((): Promise<Pitch[]> => {
    if (!evaluatorScoped) return getPitches();
    return userId ? getAssignedPitches(userId) : Promise.resolve([]);
  }, [evaluatorScoped, userId]);
  return useUserScopedQuery(fetcher);
}

export function usePitchPreparations(enabled: boolean) {
  const fetcher = useCallback(
    (): Promise<PitchPreparation[]> => (enabled ? getPitchPreparations() : Promise.resolve([])),
    [enabled]
  );
  return useUserScopedQuery(fetcher);
}

export function usePitchMutations(access: PitchCapabilities) {
  const guardar = useAdminMutation(guardarPitchAdmin, {
    allowed: access.canCreate || access.canEdit,
    deniedMessage: "No tienes autorización para programar o editar pitch.",
    fallbackMessage: "No fue posible guardar el pitch.",
    backend: { name: "sigre_admin_guardar_pitch", operation: "Guardar pitch" },
  });

  const cambiarEstado = useAdminMutation(cambiarEstadoPitchAdmin, {
    allowed: access.canEdit,
    deniedMessage: "No tienes autorización para cambiar el estado del pitch.",
    fallbackMessage: "No fue posible cambiar el estado del pitch.",
    backend: { name: "sigre_admin_cambiar_estado_pitch", operation: "Cambiar estado del pitch" },
  });

  const asignar = useAdminMutation(asignarEvaluadorPitchAdmin, {
    allowed: access.canEdit,
    deniedMessage: "No tienes autorización para asignar evaluadores.",
    fallbackMessage: "No fue posible asignar el evaluador.",
    backend: { name: "sigre_admin_asignar_evaluador_pitch", operation: "Asignar evaluador" },
  });

  const retirar = useAdminMutation(retirarEvaluadorPitchAdmin, {
    allowed: access.canEdit,
    deniedMessage: "No tienes autorización para retirar evaluadores.",
    fallbackMessage: "No fue posible retirar el evaluador.",
    backend: { name: "sigre_admin_retirar_evaluador_pitch", operation: "Retirar evaluador" },
  });

  return { guardar, cambiarEstado, asignar, retirar };
}
