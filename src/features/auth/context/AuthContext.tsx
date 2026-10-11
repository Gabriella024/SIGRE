
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import { getUserAccess } from "@/features/access-control/services/accessControlService";

import type {
  SigrePermission,
  SigreRole,
} from "@/features/access-control/types/types";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  roles: SigreRole[];
  permissions: SigrePermission[];
  permissionsLoading: boolean;
  permissionsError: string | null;
  logout: () => Promise<void>;
};

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

  const [accessState, setAccessState] = useState<{
    userId: string | null;
    roles: SigreRole[];
    permissions: SigrePermission[];
    loading: boolean;
    error: string | null;
  }>({
    userId: null,
    roles: [],
    permissions: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;

    supabase.auth.getSession()
      .then(({ data, error }) => {
        if (!active) return;

        if (error) {
          console.error("Error de sesión:", error.message);
        }

        setSession(data.session);
        setIsLoading(false);
      })
      .catch((error) => {
        if (!active) return;
        console.error("Error de autenticación:", error);
        setIsLoading(false);
      });

    const { data: listener } =
      supabase.auth.onAuthStateChange(
        (_event, nextSession) => {
          if (!active) return;

          setSession(nextSession);
          setIsLoading(false);
        }
      );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user.id ?? null;

  useEffect(() => {
    let cancelled = false;

    if (!userId) {
      return () => {
        cancelled = true;
      };
    }

    getUserAccess(userId)
      .then((access) => {
        if (cancelled) return;

        setAccessState({
          userId,
          roles: access.roles,
          permissions: access.permissions,
          loading: false,
          error: null,
        });
      })
      .catch((error) => {
        if (cancelled) return;

        setAccessState({
          userId,
          roles: [],
          permissions: [],
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Error al cargar permisos",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const accessReady =
    !isLoading &&
    accessState.userId === userId &&
    !accessState.loading;

  const roles = accessReady ? accessState.roles : [];
  const permissions = accessReady
    ? accessState.permissions
    : [];

  const permissionsLoading =
    isLoading || (userId !== null && !accessReady);

  const permissionsError = accessReady
    ? accessState.error
    : null;

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        isLoading,
        roles,
        permissions,
        permissionsLoading,
        permissionsError,
        logout,
      }}
    >
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
