import { useCallback, useRef, useState } from "react";

import { useAuth } from "@/features/auth/context/AuthContext";

import { projectFormSchema, type ProjectFormValues } from "../schemas/proyectSchema";
import { crearProyectoAdmin } from "../services/proyectsService";
import {
  mutationFailure,
  mutationSuccess,
  toErrorMessage,
  type ProjectMutationResult,
} from "../utils/mutationResult";
import { toCrearProyectoAdminInput } from "../utils/proyectUtils";

import type { ProjectCapabilities } from "../types/proyect";

export const PROJECT_CREATE_RPC_ENABLED =
  import.meta.env.DEV && import.meta.env.VITE_ENABLE_PROJECT_CREATE_RPC === "true";

export const PROJECT_CREATE_BLOCKED_MESSAGE =
  "La creación de proyectos está bloqueada temporalmente. No se envió ninguna solicitud.";

export function useProjectCreate(access: Pick<ProjectCapabilities, "view" | "canCreate">) {
  const { session } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const canSubmit = Boolean(session) && access.view === "administrador" && access.canCreate;

  const reject = useCallback((message: string) => {
    setError(message);
    return mutationFailure(message);
  }, []);

  const crear = useCallback(
    async (values: ProjectFormValues): Promise<ProjectMutationResult> => {
      if (submittingRef.current) return mutationFailure("Ya hay una solicitud de creación en curso.");
      if (!session) return reject("Tu sesión no está activa. Inicia sesión nuevamente.");
      if (access.view !== "administrador" || !access.canCreate) {
        return reject("No tienes autorización para crear proyectos.");
      }

      const parsed = projectFormSchema.safeParse(values);
      if (!parsed.success) {
        return reject(parsed.error.issues[0]?.message ?? "Los datos del proyecto no son válidos.");
      }

      if (!PROJECT_CREATE_RPC_ENABLED) return reject(PROJECT_CREATE_BLOCKED_MESSAGE);

      submittingRef.current = true;
      setIsSubmitting(true);
      setError(null);

      try {
        return mutationSuccess(await crearProyectoAdmin(toCrearProyectoAdminInput(parsed.data)));
      } catch (err) {
        return reject(toErrorMessage(err));
      } finally {
        submittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [session, access.view, access.canCreate, reject]
  );

  const reset = useCallback(() => setError(null), []);

  return {
    canSubmit,
    blocked: !PROJECT_CREATE_RPC_ENABLED,
    isSubmitting,
    error,
    crear,
    reset,
  };
}
