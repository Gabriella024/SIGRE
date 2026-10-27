import { useCallback, useRef, useState } from "react";

import { useAuth } from "@/features/auth/context/AuthContext";
import { SCREEN_CODES } from "@/features/access-control/constants/screens";
import { useAccessControl } from "@/features/access-control/hooks/useAccessControl";

import { asignarOrientadorAdmin, EntrepreneurMutationError } from "../services/entrepreneursService";
import { hasValidVersion, toAsignarOrientadorAdminInput } from "../utils/entrepreneurUtils";

import type {
  EntrepreneurAssignmentTarget,
  EntrepreneurErrorReason,
  EntrepreneurUpdateResult,
} from "../types/entrepreneur";

export type EntrepreneurAssignmentStatus = "idle" | "submitting" | "success" | "error";

type AssignmentFailure = { error: string; reason: EntrepreneurErrorReason; conflict: boolean };

const NO_FAILURE: AssignmentFailure = { error: "", reason: null, conflict: false };

function failure(error: string, reason: EntrepreneurErrorReason = null, conflict = false): EntrepreneurUpdateResult {
  return { success: false, id: null, error, reason, conflict };
}

export function useEntrepreneurAssignment() {
  const { session } = useAuth();
  const { can, hasRole } = useAccessControl();
  const [status, setStatus] = useState<EntrepreneurAssignmentStatus>("idle");
  const [lastFailure, setLastFailure] = useState<AssignmentFailure>(NO_FAILURE);
  const submittingRef = useRef(false);

  const canAssign =
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

  const asignar = useCallback(
    async (target: EntrepreneurAssignmentTarget, idOrientador: string | null): Promise<EntrepreneurUpdateResult> => {
      if (submittingRef.current) return failure("Ya hay una asignación en curso.");
      if (!session) return reject("Tu sesión no está activa. Inicia sesión nuevamente.");
      if (!canAssign) return reject("No tienes autorización para asignar orientadores.");
      if (!hasValidVersion(target.updatedAt)) {
        return reject("El emprendedor no tiene una versión registrada y no puede modificarse.", "registro");
      }
      if (idOrientador === target.orientadorId) {
        return reject("La selección es igual a la asignación actual.", "orientador");
      }

      submittingRef.current = true;
      setStatus("submitting");
      setLastFailure(NO_FAILURE);

      try {
        const id = await asignarOrientadorAdmin(toAsignarOrientadorAdminInput(target, idOrientador));
        setStatus("success");
        return { success: true, id, error: null, reason: null, conflict: false };
      } catch (err) {
        if (err instanceof EntrepreneurMutationError) return reject(err.message, err.reason, err.conflict);
        return reject("No fue posible guardar la asignación del orientador. Inténtalo nuevamente más tarde.");
      } finally {
        submittingRef.current = false;
      }
    },
    [session, canAssign, reject]
  );

  const reset = useCallback(() => {
    if (submittingRef.current) return;
    setStatus("idle");
    setLastFailure(NO_FAILURE);
  }, []);

  return {
    canAssign,
    status,
    isSubmitting: status === "submitting",
    error: status === "error" ? lastFailure.error : null,
    reason: status === "error" ? lastFailure.reason : null,
    conflict: status === "error" && lastFailure.conflict,
    asignar,
    reset,
  };
}
