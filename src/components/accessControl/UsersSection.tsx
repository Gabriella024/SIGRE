import { useMemo, useState } from "react";
import {
  Pencil,
  Power,
  Search,
  UserPlus,
} from "lucide-react";

import { MOCK_USERS } from "../../features/accessControl/mocks/accessControlMocks";
import type { AccessUser, UserStatus } from "../../features/accessControl/types/types";

interface UsuariosSectionProps {
  initialData?: AccessUser[];
  onCreate?: () => void;
  onEdit?: (user: AccessUser) => void;
  onToggleActive?: (user: AccessUser) => void;
}

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${active
          ? "bg-green-100 text-green-800"
          : "bg-slate-100 text-slate-600"
        }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? "bg-green-600" : "bg-slate-400"
          }`}
      />

      {active ? "Activo" : "Inactivo"}
    </span>
  );
}

export default function UsuariosSection({
  initialData = MOCK_USERS,
  onCreate,
  onEdit,
  onToggleActive,
}: UsuariosSectionProps) {
  const [users, setUsers] = useState<AccessUser[]>(initialData);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | UserStatus>("all");

  const filteredUsers = useMemo(() => {
    const search = normalize(query.trim());

    return users.filter((user) => {
      const matchesSearch =
        search === "" ||
        normalize(user.name).includes(search) ||
        normalize(user.email).includes(search) ||
        normalize(user.role).includes(search);

      const matchesStatus =
        status === "all" || user.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [users, query, status]);

  const toggleUser = (user: AccessUser) => {
    setUsers((current) =>
      current.map((item) =>
        item.id === user.id
          ? {
            ...item,
            status:
              item.status === "active"
                ? "inactive"
                : "active",
          }
          : item,
      ),
    );

    onToggleActive?.(user);
  };

  return (
    <section
      id="usuarios"
      className="scroll-mt-6"
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#0f2f4a]">
            Usuarios
          </h2>

          <p className="mt-0.5 text-sm text-slate-500">
            Administra los usuarios y controla su acceso al sistema.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-md bg-[#39a900] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2f8f00] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#39a900] focus-visible:ring-offset-2"
        >
          <UserPlus className="h-4 w-4" />
          Nuevo usuario
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Filtros */}

        <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Buscar usuario, correo o rol"
              className="h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#39a900] focus:ring-2 focus:ring-green-100"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            Estado

            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value as "all" | UserStatus,
                )
              }
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal text-slate-700 outline-none focus:border-[#39a900]"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Usuario
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Correo
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Rol
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Estado
                </th>

                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-slate-100 last:border-b-0"
                >
                  <td className="px-4 py-4 font-semibold text-slate-900">
                    {user.name}
                  </td>

                  <td className="px-4 py-4 text-slate-600">
                    {user.email}
                  </td>

                  <td className="px-4 py-4">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      {user.role}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <StatusPill active={user.status === "active"} />
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit?.(user)}
                        aria-label={`Editar ${user.name}`}
                        className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleUser(user)}
                        aria-label={`${user.status === "active"
                            ? "Desactivar"
                            : "Activar"
                          } ${user.name}`}
                        className={`rounded-md p-2 ${user.status === "active"
                            ? "text-red-500 hover:bg-red-50"
                            : "text-green-600 hover:bg-green-50"
                          }`}
                      >
                        <Power className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-sm text-slate-400"
                  >
                    No se encontraron usuarios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
          Mostrando {filteredUsers.length} de {users.length} usuarios
        </div>
      </div>
    </section>
  );
}