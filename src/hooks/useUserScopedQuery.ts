import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/features/auth/context/AuthContext";

type QueryState<T> = {
  userId: string | null;
  data: T | null;
  error: string | null;
};

const EMPTY_STATE = { userId: null, data: null, error: null };

function toMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Error desconocido";
}

export function useUserScopedQuery<T>(fetcher: () => Promise<T>) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [state, setState] = useState<QueryState<T>>(EMPTY_STATE);
  const [reloadToken, setReloadToken] = useState(0);
  const [reloading, setReloading] = useState(false);
  const requestRef = useRef(0);

  useEffect(() => {
    if (!userId) return;

    const requestId = ++requestRef.current;

    fetcher()
      .then((data) => {
        if (requestId !== requestRef.current) return;
        setState({ userId, data, error: null });
      })
      .catch((error: unknown) => {
        if (requestId !== requestRef.current) return;
        setState({ userId, data: null, error: toMessage(error) });
      })
      .finally(() => {
        if (requestId === requestRef.current) setReloading(false);
      });

    return () => {
      requestRef.current += 1;
    };
  }, [userId, fetcher, reloadToken]);

  const reload = useCallback(() => {
    setReloading(true);
    setReloadToken((token) => token + 1);
  }, []);

  const isCurrent = userId !== null && state.userId === userId;

  return {
    data: isCurrent ? state.data : null,
    error: isCurrent && !reloading ? state.error : null,
    isLoading: !isCurrent || reloading,
    reload,
  };
}
