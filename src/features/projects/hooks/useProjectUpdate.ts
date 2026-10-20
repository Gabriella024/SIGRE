import { useCallback, useRef, useState } from "react";

import { useAuth } from "@/features/auth/context/AuthContext";

import { projectEditFormSchema, type ProjectFormValues } from "../schemas/proyectSchema";
import { ProjectConflictError, editarProyectoAdmin } from "../services/proyectsService";
import {
  mutationFailure,
  mutationSuccess,
  toErrorMessage,
  type ProjectMutationResult,
} from "../utils/mutationResult";
import { toEditarProyectoAdminInput } from "../utils/proyectUtils";

import type { ProjectCapabilities, ProjectEditTarget } from "../types/proyect";

export const PROJECT_EDIT_RPC_ENABLED =
  import.meta.env.DEV && import.meta.env.VITE_ENABLE_PROJECT_EDIT_RPC === "true";

export const PROJECT_EDIT_BLOCKED_MESSAGE =
  "La edición de proyectos está bloqueada temporalmente. No se envió ninguna solicitud.";

export function useProjectUpdate(access: Pick<ProjectCapabilities, "view" | "canEdit">) {
  const { session } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const submittingRef = useRef(false);

  const canSubmit = Boolean(session) && access.view === "administrador" && access.canEdit;

  const reject = useCallback((message: string, isConflict = false) => {
    setConflict(isConflict);
    setError(message);
    return mutationFailure(message, isConflict);
  }, []);

  const guardar = useCallback(
    async (target: ProjectEditTarget, values: ProjectFormValues): Promise<ProjectMutationResult> => {
      if (submittingRef.current) return mutationFailure("Ya hay una solicitud de edición en curso.");
      if (!session) return reject("Tu sesión no está activa. Inicia sesión nuevamente.");
      if (access.view !== "administrador" || !access.canEdit) {
        return reject("No tienes autorización para editar proyectos.");
      }
      if (!target.updatedAt) {
        return reject("El proyecto no tiene una versión registrada y no puede editarse.");
      }

      const parsed = projectEditFormSchema.safeParse(values);
      if (!parsed.success) {
        return reject(parsed.error.issues[0]?.message ?? "Los datos del proyecto no son válidos.");
      }

      if (!PROJECT_EDIT_RPC_ENABLED) return reject(PROJECT_EDIT_BLOCKED_MESSAGE);

      submittingRef.current = true;
      setIsSubmitting(true);
      setError(null);
      setConflict(false);

      try {
        return mutationSuccess(await editarProyectoAdmin(toEditarProyectoAdminInput(target, values)));
      } catch (err) {
        return reject(toErrorMessage(err), err instanceof ProjectConflictError);
      } finally {
        submittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [session, access.view, access.canEdit, reject]
  );

  const reset = useCallback(() => {
    setError(null);
    setConflict(false);
  }, []);

  return {
    canSubmit,
    blocked: !PROJECT_EDIT_RPC_ENABLED,
    isSubmitting,
    error,
    conflict,
    guardar,
    reset,
  };
}
