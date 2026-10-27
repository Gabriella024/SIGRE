import { useCallback, useRef, useState } from "react";

import { useAuth } from "@/features/auth/context/AuthContext";
import { SCREEN_CODES } from "@/features/access-control/constants/screens";
import { useAccessControl } from "@/features/access-control/hooks/useAccessControl";

import { entrepreneurStatusFormSchema } from "../schemas/entrepreneursSchema";
import { cambiarEstadoEmprendedorAdmin, EntrepreneurMutationError } from "../services/entrepreneursService";
import { hasValidVersion, toCambiarEstadoEmprendedorAdminInput } from "../utils/entrepreneurUtils";

import type {
  EntrepreneurErrorReason,
  EntrepreneurStatusTarget,
  EntrepreneurUpdateResult,
} from "../types/entrepreneur";

export type EntrepreneurStatusChangeStatus = "idle" | "submitting" | "success" | "error";

type StatusChangeFailure = { error: string; reason: EntrepreneurErrorReason; conflict: boolean };

const NO_FAILURE: StatusChangeFailure = { error: "", reason: null, conflict: false };

function failure(error: string, reason: EntrepreneurErrorReason = null, conflict = false): EntrepreneurUpdateResult {
  return { success: false, id: null, error, reason, conflict };
}

export function useEntrepreneurStatusChange() {
  const { session } = useAuth();
  const { can, hasRole } = useAccessControl();
  const [status, setStatus] = useState<EntrepreneurStatusChangeStatus>("idle");
  const [lastFailure, setLastFailure] = useState<StatusChangeFailure>(NO_FAILURE);
  const submittingRef = useRef(false);

  const canChangeStatus =
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

  const cambiarEstado = useCallback(
    async (target: EntrepreneurStatusTarget, justificacion: string): Promise<EntrepreneurUpdateResult> => {
      if (submittingRef.current) return failure("Ya hay un cambio de estado en curso.");
      if (!session) return reject("Tu sesión no está activa. Inicia sesión nuevamente.");
      if (!canChangeStatus) return reject("No tienes autorización para cambiar el estado de emprendedores.");
      if (!hasValidVersion(target.updatedAt)) {
        return reject("El emprendedor no tiene una versión registrada y no puede modificarse.", "registro");
      }
      if (target.estadoActual === target.estadoNuevo) {
        return reject("El emprendedor ya tiene el estado solicitado.", "estado");
      }

      const parsed = entrepreneurStatusFormSchema.safeParse({ justificacion });
      if (!parsed.success) {
        return reject(parsed.error.issues[0]?.message ?? "La justificación no es válida.");
      }

      submittingRef.current = true;
      setStatus("submitting");
      setLastFailure(NO_FAILURE);

      try {
        const id = await cambiarEstadoEmprendedorAdmin(
          toCambiarEstadoEmprendedorAdminInput(target, parsed.data.justificacion)
        );
        setStatus("success");
        return { success: true, id, error: null, reason: null, conflict: false };
      } catch (err) {
        if (err instanceof EntrepreneurMutationError) return reject(err.message, err.reason, err.conflict);
        return reject("No fue posible cambiar el estado del emprendedor. Inténtalo nuevamente más tarde.");
      } finally {
        submittingRef.current = false;
      }
    },
    [session, canChangeStatus, reject]
  );

  const reset = useCallback(() => {
    if (submittingRef.current) return;
    setStatus("idle");
    setLastFailure(NO_FAILURE);
  }, []);

  return {
    canChangeStatus,
    status,
    isSubmitting: status === "submitting",
    error: status === "error" ? lastFailure.error : null,
    reason: status === "error" ? lastFailure.reason : null,
    conflict: status === "error" && lastFailure.conflict,
    cambiarEstado,
    reset,
  };
}
