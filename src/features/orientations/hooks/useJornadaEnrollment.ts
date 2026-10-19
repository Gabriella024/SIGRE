import { useCallback, useRef, useState } from "react";

import { inscribirEmprendedor } from "../services/enrollmentService";

import type { InscribirEmprendedorInput } from "../types/orientations";

export type EnrollmentFeedback = {
  type: "success" | "error";
  message: string;
};

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

export function useJornadaEnrollment(onEnrolled: (orientacionId: string) => void) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<EnrollmentFeedback | null>(null);
  const submittingRef = useRef(false);

  const inscribir = useCallback(
    async (input: InscribirEmprendedorInput, nombreEmprendedor: string): Promise<boolean> => {
      if (submittingRef.current) return false;

      submittingRef.current = true;
      setIsSubmitting(true);
      setFeedback(null);

      try {
        await inscribirEmprendedor(input);
        setFeedback({ type: "success", message: `${nombreEmprendedor} quedó inscrito en la jornada.` });
        onEnrolled(input.orientacionId);
        return true;
      } catch (error) {
        setFeedback({ type: "error", message: toMessage(error) });
        return false;
      } finally {
        submittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [onEnrolled]
  );

  const clearFeedback = useCallback(() => setFeedback(null), []);

  return { isSubmitting, feedback, inscribir, clearFeedback };
}
