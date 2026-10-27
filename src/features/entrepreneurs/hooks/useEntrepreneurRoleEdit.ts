import { useCallback, useRef, useState } from "react";

import { useAuth } from "@/features/auth/context/AuthContext";
import { SCREEN_CODES } from "@/features/access-control/constants/screens";
import { useAccessControl } from "@/features/access-control/hooks/useAccessControl";

import { useEntrepreneurAccess } from "./useEntrepreneurAccess";
import {
  orientadorEntrepreneurEditFormSchema,
  ownEntrepreneurEditFormSchema,
  type OrientadorEntrepreneurEditFormValues,
  type OwnEntrepreneurEditFormValues,
} from "../schemas/entrepreneursSchema";
import {
  editarEmprendedorComoOrientador,
  editarMiFichaEmprendedor,
  ROLE_EDIT_RPC_AVAILABLE,
} from "../services/entrepreneurRoleEditService";
import { EntrepreneurMutationError } from "../services/entrepreneursService";
import {
  hasValidVersion,
  isInEntrepreneurScope,
  toOrientadorEntrepreneurEditInput,
  toOwnEntrepreneurEditInput,
} from "../utils/entrepreneurUtils";

import type {
  EntrepreneurDetail,
  EntrepreneurEditorRole,
  EntrepreneurErrorReason,
  EntrepreneurScope,
  EntrepreneurUpdateResult,
} from "../types/entrepreneur";

export type RoleEditSubmission =
  | { role: "orientador"; values: OrientadorEntrepreneurEditFormValues }
  | { role: "emprendedor"; values: OwnEntrepreneurEditFormValues };

type RoleEditFailure = { error: string; reason: EntrepreneurErrorReason; conflict: boolean };

function failure(error: string, reason: EntrepreneurErrorReason = null, conflict = false): EntrepreneurUpdateResult {
  return { success: false, id: null, error, reason, conflict };
}

function resolveEditorRole(
  view: string | null,
  scope: EntrepreneurScope | null,
  entrepreneur: EntrepreneurDetail | null
): EntrepreneurEditorRole | null {
  if (!entrepreneur || !scope || !isInEntrepreneurScope(scope, entrepreneur)) return null;
  if (view === "orientador" && scope.kind === "assigned") return "orientador";
  if (view === "emprendedor" && scope.kind === "own") return "emprendedor";
  return null;
}

function invalid(issues: { message: string }[]): never {
  throw new EntrepreneurMutationError(issues[0]?.message ?? "Los datos del emprendedor no son válidos.");
}

function send(entrepreneur: EntrepreneurDetail, submission: RoleEditSubmission): Promise<string> {
  if (submission.role === "orientador") {
    const parsed = orientadorEntrepreneurEditFormSchema.safeParse(submission.values);
    if (!parsed.success) invalid(parsed.error.issues);
    return editarEmprendedorComoOrientador(toOrientadorEntrepreneurEditInput(entrepreneur, parsed.data));
  }
  const parsed = ownEntrepreneurEditFormSchema.safeParse(submission.values);
  if (!parsed.success) invalid(parsed.error.issues);
  return editarMiFichaEmprendedor(toOwnEntrepreneurEditInput(entrepreneur, parsed.data));
}

export function useEntrepreneurRoleEdit(entrepreneur: EntrepreneurDetail | null) {
  const { session } = useAuth();
  const { can } = useAccessControl();
  const { view, scope } = useEntrepreneurAccess();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastFailure, setLastFailure] = useState<RoleEditFailure | null>(null);
  const submittingRef = useRef(false);

  const role = resolveEditorRole(view, scope, entrepreneur);
  const canOpen =
    Boolean(session) &&
    role !== null &&
    can("emprendedores", "editar", SCREEN_CODES.emprendedores) &&
    hasValidVersion(entrepreneur?.updatedAt ?? null);
  const saveAvailable = role !== null && ROLE_EDIT_RPC_AVAILABLE[role];

  const reject = useCallback((message: string, reason: EntrepreneurErrorReason = null, conflict = false) => {
    setLastFailure({ error: message, reason, conflict });
    return failure(message, reason, conflict);
  }, []);

  const guardar = useCallback(
    async (submission: RoleEditSubmission): Promise<EntrepreneurUpdateResult> => {
      if (submittingRef.current) return failure("Ya hay una edición en curso.");
      if (!entrepreneur || !canOpen || submission.role !== role) {
        return reject("No tienes autorización para editar esta ficha.");
      }

      submittingRef.current = true;
      setIsSubmitting(true);
      setLastFailure(null);

      try {
        const id = await send(entrepreneur, submission);
        return { success: true, id, error: null, reason: null, conflict: false };
      } catch (err) {
        if (err instanceof EntrepreneurMutationError) return reject(err.message, err.reason, err.conflict);
        return reject("No fue posible guardar los cambios. Inténtalo nuevamente más tarde.");
      } finally {
        submittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [entrepreneur, canOpen, role, reject]
  );

  const reset = useCallback(() => {
    if (!submittingRef.current) setLastFailure(null);
  }, []);

  return {
    role,
    canOpen,
    saveAvailable,
    isSubmitting,
    error: lastFailure?.error ?? null,
    conflict: lastFailure !== null && (lastFailure.conflict || lastFailure.reason === "registro"),
    guardar,
    reset,
  };
}
