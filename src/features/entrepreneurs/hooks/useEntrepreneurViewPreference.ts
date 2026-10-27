import { useCallback, useState } from "react";

import { useAuth } from "@/features/auth/context/AuthContext";

import type { EntrepreneurView } from "../types/entrepreneur";

const STORAGE_PREFIX = "sigre:emprendedores:vista:";
const DEFAULT_VIEW: EntrepreneurView = "cards";

function isEntrepreneurView(value: unknown): value is EntrepreneurView {
  return value === "cards" || value === "tabla";
}

function readView(userId: string | null): EntrepreneurView {
  if (!userId) return DEFAULT_VIEW;
  try {
    const stored = window.localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    return isEntrepreneurView(stored) ? stored : DEFAULT_VIEW;
  } catch {
    return DEFAULT_VIEW;
  }
}

function writeView(userId: string, view: EntrepreneurView): boolean {
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${userId}`, view);
    return true;
  } catch {
    return false;
  }
}

export function useEntrepreneurViewPreference(): [EntrepreneurView, (view: EntrepreneurView) => void] {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [state, setState] = useState(() => ({ userId, view: readView(userId) }));

  const view = state.userId === userId ? state.view : readView(userId);

  const setView = useCallback(
    (next: EntrepreneurView) => {
      setState({ userId, view: next });
      if (userId) writeView(userId, next);
    },
    [userId]
  );

  return [view, setView];
}
