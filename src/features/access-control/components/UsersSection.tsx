import { useMemo, useState } from "react";
import { Search, ShieldCheck } from "lucide-react";

import { ReadOnlyBadge } from "@/components/ui/pending-integration";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/query-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { RoleBadge } from "@/features/users/components/RoleBadge";
import { normalizeText, matchesSearch } from "@/lib/format";
import { slicePage } from "@/lib/pagination";

import type { User } from "@/features/users/types/users";

interface UsuariosSectionProps {
  users: User[] | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onEditRoles?: (user: User) => void;
}

const PAGE_SIZE = 10;

export default function UsuariosSection({ users, isLoading, error, onRetry, onEditRoles }: UsuariosSectionProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "activo" | "inactivo">("all");
  const [page, setPage] = useState(1);

  const filteredUsers = useMemo(
    () =>
      (users ?? []).filter(
        (user) =>
          matchesSearch(query, user.nombre, user.correo, ...user.roles.map((role) => role.rol)) &&
          (status === "all" || normalizeText(user.estado) === status)
      ),
    [users, query, status]
  );
  const slice = slicePage(filteredUsers, page, PAGE_SIZE);

  return (
    <section id="usuarios" className="scroll-mt-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-[#0f2f4a]">
          Usuarios y roles
          {!onEditRoles && <ReadOnlyBadge />}
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">Consulta los roles asignados a cada usuario del sistema.</p>
      </div>

      {isLoading ? (
        <LoadingState message="Cargando usuarios..." />
      ) : error ? (
        <ErrorState message="No fue posible cargar los usuarios." detail={error} onRetry={onRetry} />
      ) : !users || users.length === 0 ? (
        <EmptyState message="No hay usuarios registrados o visibles para tu usuario." />
      ) : (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center">
              <div className="relative w-full sm:max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Buscar usuario, correo o rol"
                  className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#39a900] focus:ring-2 focus:ring-green-100"
                />
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                Estado
                <select
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value as typeof status);
                    setPage(1);
                  }}
                  className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal text-slate-700 outline-none focus:border-[#39a900]"
                >
                  <option value="all">Todos</option>
                  <option value="activo">Activos</option>
                  <option value="inactivo">Inactivos</option>
                </select>
              </label>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    {["Usuario", "Correo", "Roles", "Estado"].map((label) => (
                      <th
                        key={label}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                      >
                        {label}
                      </th>
                    ))}
                    {onEditRoles && (
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {slice.rows.map((user) => (
                    <tr key={user.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-4 py-4 font-semibold text-slate-900">{user.nombre}</td>
                      <td className="px-4 py-4 text-slate-600">{user.correo ?? "—"}</td>
                      <td className="px-4 py-4">
                        {user.roles.length === 0 ? (
                          <span className="text-xs text-slate-400">Sin roles</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {user.roles.map((role) => (
                              <RoleBadge key={role.id} rol={role.rol} />
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge value={user.estado} />
                      </td>
                      {onEditRoles && (
                        <td className="px-4 py-4">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => onEditRoles(user)}
                              aria-label={`Editar roles de ${user.nombre}`}
                              title="Editar roles"
                              className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
                            >
                              <ShieldCheck className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}

                  {slice.rows.length === 0 && (
                    <tr>
                      <td colSpan={onEditRoles ? 5 : 4} className="px-4 py-10 text-center text-sm text-slate-400">
                        No se encontraron usuarios.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <PaginationBar {...slice} onPageChange={setPage} />
        </div>
      )}
    </section>
  );
}
