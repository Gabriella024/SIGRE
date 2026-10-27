import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/features/auth/context/AuthContext";

import { getEntrepreneurById } from "../services/entrepreneursService";
import { isValidEntrepreneurId } from "../utils/entrepreneurUtils";

import type { EntrepreneurDetail } from "../types/entrepreneur";

type DetailState = {
  key: string | null;
  token: number;
  data: EntrepreneurDetail | null;
  error: string | null;
};

const EMPTY_STATE: DetailState = { key: null, token: 0, data: null, error: null };

export function useEntrepreneurDetail(id: string | null | undefined) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [state, setState] = useState<DetailState>(EMPTY_STATE);
  const [reloadToken, setReloadToken] = useState(0);

  const hasId = typeof id === "string";
  const validId = hasId && isValidEntrepreneurId(id) ? id : null;
  const key = validId && userId ? `${userId}:${validId}` : null;

  useEffect(() => {
    if (!key || !validId) return;
    let active = true;

    getEntrepreneurById(validId)
      .then((data) => {
        if (active) setState({ key, token: reloadToken, data, error: null });
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            key,
            token: reloadToken,
            data: null,
            error: error instanceof Error ? error.message : "Ocurrió un error inesperado.",
          });
        }
      });

    return () => {
      active = false;
    };
  }, [key, validId, reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  const isCurrent = key !== null && state.key === key && state.token === reloadToken;

  return {
    entrepreneur: isCurrent ? state.data : null,
    error: isCurrent ? state.error : null,
    isLoading: key !== null && !isCurrent,
    isUnavailable: (hasId && validId === null) || (isCurrent && state.error === null && state.data === null),
    reload,
  };
}
