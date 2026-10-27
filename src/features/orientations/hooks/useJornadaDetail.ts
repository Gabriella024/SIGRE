import { useEffect, useState } from "react";

import { getOrientationById } from "../services/orientationsService";

import type { OrientacionDetalle } from "../types/orientations";

type DetailState = {
  id: string | null;
  data: OrientacionDetalle | null;
  error: string | null;
};

export function useJornadaDetail(id: string | null, version = 0) {
  const [state, setState] = useState<DetailState>({ id: null, data: null, error: null });

  useEffect(() => {
    if (!id) return;
    let active = true;

    getOrientationById(id)
      .then((data) => {
        if (active) setState({ id, data, error: null });
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            id,
            data: null,
            error: error instanceof Error ? error.message : "Ocurrió un error inesperado.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [id, version]);

  const isCurrent = id !== null && state.id === id;

  return {
    data: isCurrent ? state.data : null,
    error: isCurrent ? state.error : null,
    isLoading: id !== null && !isCurrent,
  };
}
