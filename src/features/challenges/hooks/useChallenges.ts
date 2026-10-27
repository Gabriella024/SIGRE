import { useCallback, useMemo } from "react";

import { useAccessControl } from "@/features/access-control/hooks/useAccessControl";
import { SCREEN_CODES } from "@/features/access-control/constants/screens";
import { useAdminMutation } from "@/hooks/useAdminMutation";
import { useUserScopedQuery } from "@/hooks/useUserScopedQuery";

import {
  asignarRetoProyectoAdmin,
  cambiarEstadoRetoAdmin,
  getChallengeCompliance,
  getChallenges,
  guardarRetoAdmin,
} from "../services/challengesService";

import type { ChallengeCapabilities, ChallengeCompliance } from "../types/Challenge";

export function useChallenges() {
  return useUserScopedQuery(getChallenges);
}

export function useChallengeCompliance(idReto: string | null) {
  const fetcher = useCallback(
    (): Promise<ChallengeCompliance[]> => (idReto ? getChallengeCompliance(idReto) : Promise.resolve([])),
    [idReto]
  );
  return useUserScopedQuery(fetcher);
}

export function useChallengeAccess(): ChallengeCapabilities {
  const { can } = useAccessControl();
  return useMemo(
    () => ({
      canCreate: can("retos", "crear", SCREEN_CODES.retos),
      canEdit: can("retos", "editar", SCREEN_CODES.retos),
    }),
    [can]
  );
}

export function useChallengeMutations(access: ChallengeCapabilities) {
  const guardar = useAdminMutation(guardarRetoAdmin, {
    allowed: access.canCreate || access.canEdit,
    deniedMessage: "No tienes autorización para guardar retos.",
    fallbackMessage: "No fue posible guardar el reto.",
    backend: { name: "sigre_admin_guardar_reto", operation: "Guardar reto" },
  });

  const cambiarEstado = useAdminMutation(cambiarEstadoRetoAdmin, {
    allowed: access.canEdit,
    deniedMessage: "No tienes autorización para cambiar el estado de los retos.",
    fallbackMessage: "No fue posible cambiar el estado del reto.",
    backend: { name: "sigre_admin_cambiar_estado_reto", operation: "Cambiar estado del reto" },
  });

  const asignarProyecto = useAdminMutation(asignarRetoProyectoAdmin, {
    allowed: access.canEdit,
    deniedMessage: "No tienes autorización para asignar retos a proyectos.",
    fallbackMessage: "No fue posible asignar el reto al proyecto.",
    backend: { name: "sigre_admin_asignar_reto_proyecto", operation: "Asignar reto a proyecto" },
  });

  return { guardar, cambiarEstado, asignarProyecto };
}
