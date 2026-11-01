import { createContext } from "react";

import type { Session, User } from "@supabase/supabase-js";

import type {
  PermissionDifference,
  SigrePermission,
  SigreRole,
} from "@/features/access-control/types/types";

export type AuthContextType = {
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

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);
