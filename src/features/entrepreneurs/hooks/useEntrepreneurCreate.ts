import { useCallback, useRef, useState } from "react";

import { useAuth } from "@/features/auth/context/AuthContext";
import { SCREEN_CODES } from "@/features/access-control/constants/screens";
import { useAccessControl } from "@/features/access-control/hooks/useAccessControl";

import { entrepreneurFormSchema, type EntrepreneurFormValues } from "../schemas/entrepreneursSchema";
import { crearEmprendedorAdmin, EntrepreneurMutationError } from "../services/entrepreneursService";
import { toCrearEmprendedorAdminInput } from "../utils/entrepreneurUtils";

import type { EntrepreneurErrorReason, EntrepreneurCreateResult } from "../types/entrepreneur";

export type EntrepreneurCreateStatus = "idle" | "submitting" | "success" | "error";

function failure(error: string, reason: EntrepreneurErrorReason = null): EntrepreneurCreateResult {
  return { success: false, id: null, error, reason };
}

export function useEntrepreneurCreate() {
  const { session } = useAuth();
  const { can, hasRole } = useAccessControl();
  const [status, setStatus] = useState<EntrepreneurCreateStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const canCreate =
    Boolean(session) &&
    hasRole("administrador") &&
    can("emprendedores", "crear", SCREEN_CODES.emprendedores);

  const reject = useCallback((message: string, reason: EntrepreneurErrorReason = null) => {
    setStatus("error");
    setError(message);
    return failure(message, reason);
  }, []);

  const crear = useCallback(
    async (values: EntrepreneurFormValues): Promise<EntrepreneurCreateResult> => {
      if (submittingRef.current) return failure("Ya hay un registro en curso.");
      if (!session) return reject("Tu sesión no está activa. Inicia sesión nuevamente.");
      if (!canCreate) return reject("No tienes autorización para registrar emprendedores.");

      const parsed = entrepreneurFormSchema.safeParse(values);
      if (!parsed.success) {
        return reject(parsed.error.issues[0]?.message ?? "Los datos del emprendedor no son válidos.");
      }

      submittingRef.current = true;
      setStatus("submitting");
      setError(null);

      try {
        const id = await crearEmprendedorAdmin(toCrearEmprendedorAdminInput(parsed.data));
        setStatus("success");
        return { success: true, id, error: null, reason: null };
      } catch (err) {
        if (err instanceof EntrepreneurMutationError) return reject(err.message, err.reason);
        return reject("No fue posible registrar el emprendedor. Inténtalo nuevamente más tarde.");
      } finally {
        submittingRef.current = false;
      }
    },
    [session, canCreate, reject]
  );

  const reset = useCallback(() => {
    if (submittingRef.current) return;
    setStatus("idle");
    setError(null);
  }, []);

  return {
    canCreate,
    status,
    isSubmitting: status === "submitting",
    error,
    crear,
    reset,
  };
}
