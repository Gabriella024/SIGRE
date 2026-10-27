import { useCallback, useRef, useState } from "react";

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

export function useJornadaMutation<TArgs extends unknown[]>(
  operation: (...args: TArgs) => Promise<void>,
  onDone: () => void
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const run = useCallback(
    async (...args: TArgs): Promise<boolean> => {
      if (submittingRef.current) return false;

      submittingRef.current = true;
      setIsSubmitting(true);
      setError(null);

      try {
        await operation(...args);
        onDone();
        return true;
      } catch (err) {
        setError(toMessage(err));
        return false;
      } finally {
        submittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [operation, onDone]
  );

  const reset = useCallback(() => setError(null), []);

  return { isSubmitting, error, run, reset };
}
