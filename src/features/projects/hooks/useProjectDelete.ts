import { useCallback, useRef, useState } from "react";

import { useAuth } from "@/features/auth/context/AuthContext";

import { ProjectConflictError, eliminarProyectoAdmin } from "../services/proyectsService";
import {
  mutationFailure,
  mutationSuccess,
  toErrorMessage,
  type ProjectMutationResult,
} from "../utils/mutationResult";

import type { ProjectCapabilities, ProjectDeleteTarget } from "../types/proyect";

export const PROJECT_DELETE_RPC_ENABLED =
  import.meta.env.DEV && import.meta.env.VITE_ENABLE_PROJECT_DELETE_RPC === "true";

export const PROJECT_DELETE_BLOCKED_MESSAGE =
  "La eliminación de proyectos está bloqueada temporalmente. No se envió ninguna solicitud.";

export function useProjectDelete(access: Pick<ProjectCapabilities, "view" | "canDelete">) {
  const { session } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const submittingRef = useRef(false);

  const canSubmit = Boolean(session) && access.view === "administrador" && access.canDelete;

  const reject = useCallback((message: string, isConflict = false) => {
    setConflict(isConflict);
    setError(message);
    return mutationFailure(message, isConflict);
  }, []);

  const eliminar = useCallback(
    async (target: ProjectDeleteTarget): Promise<ProjectMutationResult> => {
      if (submittingRef.current) return mutationFailure("Ya hay una solicitud de eliminación en curso.");
      if (!session) return reject("Tu sesión no está activa. Inicia sesión nuevamente.");
      if (access.view !== "administrador" || !access.canDelete) {
        return reject("No tienes autorización para eliminar proyectos.");
      }
      if (!target.id) return reject("El identificador del proyecto no es válido.");
      if (!target.updatedAt) {
        return reject("El proyecto no tiene una versión registrada y no puede eliminarse.");
      }

      if (!PROJECT_DELETE_RPC_ENABLED) return reject(PROJECT_DELETE_BLOCKED_MESSAGE);

      submittingRef.current = true;
      setIsSubmitting(true);
      setError(null);
      setConflict(false);

      try {
        return mutationSuccess(
          await eliminarProyectoAdmin({ idProyecto: target.id, updatedAtEsperado: target.updatedAt })
        );
      } catch (err) {
        return reject(toErrorMessage(err), err instanceof ProjectConflictError);
      } finally {
        submittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [session, access.view, access.canDelete, reject]
  );

  const reset = useCallback(() => {
    setError(null);
    setConflict(false);
  }, []);

  return {
    canSubmit,
    blocked: !PROJECT_DELETE_RPC_ENABLED,
    isSubmitting,
    error,
    conflict,
    eliminar,
    reset,
  };
}
