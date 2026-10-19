import { useCallback, useEffect, useRef, useState } from "react";

import { getInscritosAsistencia, registrarAsistencia } from "../services/attendanceService";

import type { AttendanceFormValues } from "../schemas/attendanceSchema";
import type { InscritoAsistencia } from "../types/orientations";

type ListState = {
  orientacionId: string | null;
  token: number;
  data: InscritoAsistencia[] | null;
  error: string | null;
};

type Feedback = {
  orientacionId: string;
  type: "success" | "error";
  message: string;
};

type AttendanceOptions = {
  orientacionId: string | null;
  canManage: boolean;
  refreshKey?: number;
};

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

export function useJornadaAttendance({ orientacionId, canManage, refreshKey = 0 }: AttendanceOptions) {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] = useState<ListState>({ orientacionId: null, token: 0, data: null, error: null });
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const submittingRef = useRef(false);
  const token = reloadToken + refreshKey;

  useEffect(() => {
    if (!orientacionId || !canManage) return;
    let active = true;

    getInscritosAsistencia(orientacionId)
      .then((data) => {
        if (active) setState({ orientacionId, token, data, error: null });
      })
      .catch((error: unknown) => {
        if (active) setState({ orientacionId, token, data: null, error: toMessage(error) });
      });

    return () => {
      active = false;
    };
  }, [orientacionId, canManage, token]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  const registrar = useCallback(
    async (inscrito: InscritoAsistencia, values: AttendanceFormValues): Promise<boolean> => {
      if (!orientacionId || submittingRef.current) return false;

      if (!canManage) {
        setFeedback({
          orientacionId,
          type: "error",
          message: "No tienes permisos para registrar asistencia en esta jornada.",
        });
        return false;
      }

      submittingRef.current = true;
      setSavingId(inscrito.emprendedorId);
      setFeedback(null);

      try {
        await registrarAsistencia({
          orientacionId,
          emprendedorId: inscrito.emprendedorId,
          estado: values.estado,
          observacion: values.observacion || null,
        });
        setFeedback({
          orientacionId,
          type: "success",
          message: `Asistencia de ${inscrito.nombreCompleto} ${
            inscrito.estadoAsistencia ? "actualizada" : "registrada"
          } correctamente.`,
        });
        setReloadToken((token) => token + 1);
        return true;
      } catch (error) {
        setFeedback({ orientacionId, type: "error", message: toMessage(error) });
        return false;
      } finally {
        submittingRef.current = false;
        setSavingId(null);
      }
    },
    [orientacionId, canManage]
  );

  const isCurrent = orientacionId !== null && state.orientacionId === orientacionId;

  return {
    data: isCurrent ? state.data : null,
    error: isCurrent ? state.error : null,
    isLoading: orientacionId !== null && canManage && !isCurrent,
    isRefreshing: isCurrent && state.token !== token,
    feedback: feedback && feedback.orientacionId === orientacionId ? feedback : null,
    savingId,
    isSaving: savingId !== null,
    reload,
    registrar,
  };
}
