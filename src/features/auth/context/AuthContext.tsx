import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import { getMyAccess } from "@/features/access-control/services/accessControlService";

import type {
  PermissionDifference,
  SigrePermission,
  SigreRole,
} from "@/features/access-control/types/types";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  roles: SigreRole[];
  permissions: SigrePermission[];
  permissionDifferences: PermissionDifference[];
  permissionsLoading: boolean;
  permissionsError: string | null;
  refreshPermissions: () => Promise<boolean>;
  logout: () => Promise<void>;
};

type AccessState = {
  userId: string | null;
  roles: SigreRole[];
  permissions: SigrePermission[];
  differences: PermissionDifference[];
  loading: boolean;
  error: string | null;
};

const EMPTY_ACCESS: AccessState = {
  userId: null,
  roles: [],
  permissions: [],
  differences: [],
  loading: false,
  error: null,
};

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 800;

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessState, setAccessState] =
    useState<AccessState>(EMPTY_ACCESS);

  const userIdRef = useRef<string | null>(null);
  const requestRef = useRef(0);

  const applySession = useCallback((nextSession: Session | null) => {
    const nextUserId = nextSession?.user.id ?? null;

    if (userIdRef.current !== nextUserId) {
      userIdRef.current = nextUserId;
      requestRef.current += 1;
      setAccessState(EMPTY_ACCESS);
    }

    setSession(nextSession);
    setIsLoading(false);
  }, []);

  const loadAccess = useCallback(
    async (targetUserId: string, requestId: number) => {
      let lastError: unknown = null;

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          const access = await getMyAccess();
          if (requestId !== requestRef.current) return false;

          if (access.differences.length > 0) {
            console.info(
              "Diferencias de nivel de acceso entre roles:",
              access.differences
            );
          }

          setAccessState({
            userId: targetUserId,
            ...access,
            loading: false,
            error: null,
          });
          return true;
        } catch (error) {
          lastError = error;
          if (requestId !== requestRef.current) return false;
          if (attempt < MAX_ATTEMPTS) await wait(RETRY_DELAY_MS * attempt);
        }
      }

      if (requestId !== requestRef.current) return false;

      setAccessState({
        ...EMPTY_ACCESS,
        userId: targetUserId,
        error:
          lastError instanceof Error
            ? lastError.message
            : "Error al cargar permisos",
      });
      return false;
    },
    []
  );

  useEffect(() => {
    let active = true;

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) console.error("Error de sesión:", error.message);
        applySession(data.session);
      })
      .catch((error) => {
        if (!active) return;
        console.error("Error de autenticación:", error);
        setIsLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (active) applySession(nextSession);
      }
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [applySession]);

  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!userId) return;

    const requestId = ++requestRef.current;
    void loadAccess(userId, requestId);

    return () => {
      if (requestRef.current === requestId) requestRef.current += 1;
    };
  }, [userId, loadAccess]);

  const refreshPermissions = useCallback(async () => {
    const targetUserId = userIdRef.current;
    if (!targetUserId) return false;

    const requestId = ++requestRef.current;

    setAccessState({
      ...EMPTY_ACCESS,
      userId: targetUserId,
      loading: true,
    });

    return loadAccess(targetUserId, requestId);
  }, [loadAccess]);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    applySession(null);
  }, [applySession]);

  const value = useMemo<AuthContextType>(() => {
    const accessReady =
      !isLoading &&
      accessState.userId === userId &&
      !accessState.loading;

    const failed = accessReady && accessState.error !== null;
    const granted = accessReady && !failed;

    return {
      user: session?.user ?? null,
      session,
      isLoading,
      roles: granted ? accessState.roles : [],
      permissions: granted ? accessState.permissions : [],
      permissionDifferences: granted ? accessState.differences : [],
      permissionsLoading:
        isLoading || (userId !== null && !accessReady),
      permissionsError: failed ? accessState.error : null,
      refreshPermissions,
      logout,
    };
  }, [
    session,
    userId,
    isLoading,
    accessState,
    refreshPermissions,
    logout,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth debe usarse dentro de AuthProvider"
    );
  }

  return context;
}
