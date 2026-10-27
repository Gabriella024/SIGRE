import { useCallback, useRef, useState } from "react";

import { useAuth } from "@/features/auth/context/AuthContext";
import { AdminOperationError, type MutationResult } from "@/lib/adminOperation";
import { pendingBackendMessage, type BackendRequirement } from "@/lib/backendContract";

type MutationState = {
  status: "idle" | "submitting" | "success" | "error";
  error: string | null;
  conflict: boolean;
  missingBackend: boolean;
};

const IDLE: MutationState = { status: "idle", error: null, conflict: false, missingBackend: false };

function failure<T>(error: string, conflict = false): MutationResult<T> {
  return { success: false, data: null, error, conflict };
}

export function useAdminMutation<TArgs extends unknown[], TResult = string>(
  operation: (...args: TArgs) => Promise<TResult>,
  options: { allowed: boolean; deniedMessage: string; fallbackMessage: string; backend?: BackendRequirement }
) {
  const { session } = useAuth();
  const [state, setState] = useState<MutationState>(IDLE);
  const submittingRef = useRef(false);
  const { allowed, deniedMessage, fallbackMessage, backend } = options;
  const pendingBackend = backend ? pendingBackendMessage(backend) : null;

  const reject = useCallback((message: string, conflict = false, missingBackend = false) => {
    setState({ status: "error", error: message, conflict, missingBackend });
    return failure<TResult>(message, conflict);
  }, []);

  const run = useCallback(
    async (...args: TArgs): Promise<MutationResult<TResult>> => {
      if (submittingRef.current) return failure("Ya hay una solicitud en curso.");
      if (!session) return reject("Tu sesión no está activa. Inicia sesión nuevamente.");
      if (!allowed) return reject(deniedMessage);
      if (pendingBackend) return reject(pendingBackend, false, true);

      submittingRef.current = true;
      setState({ ...IDLE, status: "submitting" });

      try {
        const data = await operation(...args);
        setState({ ...IDLE, status: "success" });
        return { success: true, data, error: null, conflict: false };
      } catch (err) {
        if (err instanceof AdminOperationError) return reject(err.message, err.conflict, err.missingBackend);
        return reject(fallbackMessage);
      } finally {
        submittingRef.current = false;
      }
    },
    [session, allowed, deniedMessage, fallbackMessage, pendingBackend, operation, reject]
  );

  const reset = useCallback(() => {
    if (!submittingRef.current) setState(IDLE);
  }, []);

  return {
    allowed: Boolean(session) && allowed,
    isSubmitting: state.status === "submitting",
    error: state.error,
    conflict: state.conflict,
    missingBackend: state.missingBackend,
    pendingBackend,
    run,
    reset,
  };
}

export interface MutationFeedback {
  isSubmitting: boolean;
  error: string | null;
  conflict: boolean;
  missingBackend: boolean;
  pendingBackend: string | null;
}

export interface MutationHandle<TInput, TResult = string> extends MutationFeedback {
  run: (input: TInput) => Promise<MutationResult<TResult>>;
  reset: () => void;
}
