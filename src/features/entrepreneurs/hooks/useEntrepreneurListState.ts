import { useEffect, useState } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { z } from "zod";

import { useAuth } from "@/features/auth/context/AuthContext";

import {
  DEFAULT_ENTREPRENEUR_SORT,
  ENTREPRENEUR_SORT_KEYS,
  INITIAL_ENTREPRENEUR_FILTERS,
} from "../utils/entrepreneurUtils";

import type { EntrepreneurFilters, EntrepreneurSort } from "../types/entrepreneur";

export interface EntrepreneurListState {
  filters: EntrepreneurFilters;
  sort: EntrepreneurSort;
  page: number;
}

export const RESTORE_ENTREPRENEUR_LIST = { restoreEntrepreneurList: true } as const;

const STORAGE_PREFIX = "sigre:emprendedores:listado:";

const DEFAULT_LIST_STATE: EntrepreneurListState = {
  filters: INITIAL_ENTREPRENEUR_FILTERS,
  sort: DEFAULT_ENTREPRENEUR_SORT,
  page: 1,
};

const listStateSchema = z.object({
  filters: z.object({
    search: z.string(),
    estado: z.string(),
    centro: z.string(),
    nivelFormacion: z.string(),
    tipo: z.string(),
    orientador: z.string().catch(""),
  }),
  sort: z.object({
    key: z.enum(ENTREPRENEUR_SORT_KEYS),
    dir: z.enum(["asc", "desc"]),
  }),
  page: z.number().int().min(1),
});

function shouldRestore(state: unknown): boolean {
  return typeof state === "object" && state !== null && "restoreEntrepreneurList" in state;
}

function readListState(userId: string | null): EntrepreneurListState | null {
  if (!userId) return null;
  try {
    const raw = window.sessionStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (!raw) return null;
    const parsed = listStateSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function writeListState(userId: string, state: EntrepreneurListState): boolean {
  try {
    window.sessionStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function useEntrepreneurListState() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const location = useLocation();
  const navigationType = useNavigationType();
  const restore = navigationType === "POP" || shouldRestore(location.state);

  const [state, setState] = useState<EntrepreneurListState>(
    () => (restore ? readListState(userId) : null) ?? DEFAULT_LIST_STATE
  );

  useEffect(() => {
    if (userId) writeListState(userId, state);
  }, [userId, state]);

  return [state, setState] as const;
}
