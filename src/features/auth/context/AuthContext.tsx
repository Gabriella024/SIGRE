import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import { getUserPermissions } from "@/features/access-control/services/accessControlService";

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

  const [roles, setRoles] = useState<SigreRole[]>([]);
  const [permissions, setPermissions] = useState<SigrePermission[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);

  const loadAccess = useCallback(async (userId: string) => {
    setPermissionsLoading(true);
    setPermissionsError(null);

    try {
      const { data, error } = await supabase
        .from("usuario_roles")
        .select("roles:id_rol_fk(nombre_rol)")
        .eq("id_usuario_fk", userId)
        .eq("estado", "activo");

      if (error) throw error;

      const roleNames = (data ?? [])
        .flatMap((item) => {
          const relation = item.roles as unknown as {
            nombre_rol: string;
          } | null;

          return relation ? [relation.nombre_rol as SigreRole] : [];
        });

      const userPermissions = await getUserPermissions(userId);

      setRoles(roleNames);
      setPermissions(userPermissions);
    } catch (error) {
      setRoles([]);
      setPermissions([]);
      setPermissionsError(
        error instanceof Error
          ? error.message
          : "Error al cargar permisos"
      );
    } finally {
      setPermissionsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;

      setSession(data.session);
      setIsLoading(false);
    }).catch(() => {
      if (!active) return;
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
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

  useEffect(() => {
    if (!session?.user.id) {
      setRoles([]);
      setPermissions([]);
      setPermissionsError(null);
      setPermissionsLoading(false);
      return;
    }

    void loadAccess(session.user.id);
  }, [session?.user.id, loadAccess]);

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
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return context;
}