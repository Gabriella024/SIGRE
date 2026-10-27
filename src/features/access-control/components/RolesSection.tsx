import { useMemo } from "react";
import { Users } from "lucide-react";

import { ReadOnlyBadge } from "@/components/ui/pending-integration";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleBadge } from "@/features/users/components/RoleBadge";

import { isSigreRole } from "../utils/accessControlUtils";

import type { User } from "@/features/users/types/users";
import type { AccessRole } from "../types/types";

interface RolesSectionProps {
  roles: AccessRole[] | null;
  users: User[] | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

export default function RolesSection({ roles, users, isLoading, error, onRetry }: RolesSectionProps) {
  const counts = useMemo(() => {
    const result = new Map<number, number>();
    for (const user of users ?? []) {
      for (const role of user.roles) result.set(role.rolId, (result.get(role.rolId) ?? 0) + 1);
    }
    return result;
  }, [users]);

  return (
    <section id="roles" className="scroll-mt-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-[#0f2f4a]">
          Roles
          <ReadOnlyBadge />
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">
          SIGRE opera con cinco roles fijos que determinan el nivel de acceso de cada usuario.
        </p>
      </div>

      {isLoading ? (
        <LoadingState message="Cargando roles..." />
      ) : error ? (
        <ErrorState message="No fue posible cargar los roles." detail={error} onRetry={onRetry} />
      ) : !roles || roles.length === 0 ? (
        <EmptyState message="No hay roles registrados o visibles para tu usuario." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  {["Rol", "Usuarios con el rol", "Estado"].map((label) => (
                    <th
                      key={label}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-4 py-4">
                      <RoleBadge rol={role.name} />
                      {!isSigreRole(role.name) && (
                        <span className="ml-2 text-xs text-amber-700">No reconocido por los permisos de SIGRE</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 text-slate-600">
                        <Users className="h-4 w-4" />
                        {users ? (counts.get(role.id) ?? 0) : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge value={role.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
