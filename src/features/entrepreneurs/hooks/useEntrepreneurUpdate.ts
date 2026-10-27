import { useCallback, useRef, useState } from "react";

import { useAuth } from "@/features/auth/context/AuthContext";
import { SCREEN_CODES } from "@/features/access-control/constants/screens";
import { useAccessControl } from "@/features/access-control/hooks/useAccessControl";

import { entrepreneurEditFormSchema, type EntrepreneurEditFormValues } from "../schemas/entrepreneursSchema";
import { editarEmprendedorAdmin, EntrepreneurMutationError } from "../services/entrepreneursService";
import { hasValidVersion, toEditarEmprendedorAdminInput } from "../utils/entrepreneurUtils";

import type {
  EntrepreneurEditTarget,
  EntrepreneurErrorReason,
  EntrepreneurUpdateResult,
} from "../types/entrepreneur";

export type EntrepreneurUpdateStatus = "idle" | "submitting" | "success" | "error";

type UpdateFailure = { error: string; reason: EntrepreneurErrorReason; conflict: boolean };

const NO_FAILURE: UpdateFailure = { error: "", reason: null, conflict: false };

function failure(error: string, reason: EntrepreneurErrorReason = null, conflict = false): EntrepreneurUpdateResult {
  return { success: false, id: null, error, reason, conflict };
}

export function useEntrepreneurUpdate() {
  const { session } = useAuth();
  const { can, hasRole } = useAccessControl();
  const [status, setStatus] = useState<EntrepreneurUpdateStatus>("idle");
  const [lastFailure, setLastFailure] = useState<UpdateFailure>(NO_FAILURE);
  const submittingRef = useRef(false);

  const canEdit =
    Boolean(session) &&
    hasRole("administrador") &&
    can("emprendedores", "editar", SCREEN_CODES.emprendedores);

  const reject = useCallback(
    (message: string, reason: EntrepreneurErrorReason = null, conflict = false) => {
      setStatus("error");
      setLastFailure({ error: message, reason, conflict });
      return failure(message, reason, conflict);
    },
    []
  );

  const guardar = useCallback(
    async (target: EntrepreneurEditTarget, values: EntrepreneurEditFormValues): Promise<EntrepreneurUpdateResult> => {
      if (submittingRef.current) return failure("Ya hay una edición en curso.");
      if (!session) return reject("Tu sesión no está activa. Inicia sesión nuevamente.");
      if (!canEdit) return reject("No tienes autorización para editar emprendedores.");
      if (!hasValidVersion(target.updatedAt)) {
        return reject("El emprendedor no tiene una versión registrada y no puede editarse.", "registro");
      }

      const parsed = entrepreneurEditFormSchema.safeParse(values);
      if (!parsed.success) {
        return reject(parsed.error.issues[0]?.message ?? "Los datos del emprendedor no son válidos.");
      }

      submittingRef.current = true;
      setStatus("submitting");
      setLastFailure(NO_FAILURE);

      try {
        const id = await editarEmprendedorAdmin(toEditarEmprendedorAdminInput(target, values));
        setStatus("success");
        return { success: true, id, error: null, reason: null, conflict: false };
      } catch (err) {
        if (err instanceof EntrepreneurMutationError) return reject(err.message, err.reason, err.conflict);
        return reject("No fue posible guardar los cambios del emprendedor. Inténtalo nuevamente más tarde.");
      } finally {
        submittingRef.current = false;
      }
    },
    [session, canEdit, reject]
  );

  const reset = useCallback(() => {
    if (submittingRef.current) return;
    setStatus("idle");
    setLastFailure(NO_FAILURE);
  }, []);

  return {
    canEdit,
    status,
    isSubmitting: status === "submitting",
    error: status === "error" ? lastFailure.error : null,
    reason: status === "error" ? lastFailure.reason : null,
    conflict: status === "error" && lastFailure.conflict,
    guardar,
    reset,
  };
}
