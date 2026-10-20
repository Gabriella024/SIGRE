import { useCallback, useEffect, useState } from "react";

import { getProjectById } from "../services/proyectsService";

import type { ProjectDetail } from "../types/proyect";

type DetailState = {
  id: string | null;
  token: number;
  data: ProjectDetail | null;
  error: string | null;
};

const EMPTY_STATE: DetailState = { id: null, token: 0, data: null, error: null };

export function useProjectDetail(id: string | null) {
  const [state, setState] = useState<DetailState>(EMPTY_STATE);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!id) return;
    let active = true;

    getProjectById(id)
      .then((data) => {
        if (active) setState({ id, token: reloadToken, data, error: null });
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            id,
            token: reloadToken,
            data: null,
            error: error instanceof Error ? error.message : "Ocurrió un error inesperado.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [id, reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  const isCurrent = id !== null && state.id === id && state.token === reloadToken;

  return {
    data: isCurrent ? state.data : null,
    error: isCurrent ? state.error : null,
    isLoading: id !== null && !isCurrent,
    isUnavailable: isCurrent && state.error === null && state.data === null,
    reload,
  };
}
