import { useState } from "react";
import {
  Pencil,
  Plus,
  Users,
} from "lucide-react";

import ToggleSwitch from "./ToggleSwitch";
import { MOCK_ROLES } from "../../features/accessControl/mocks/accessControlMocks";
import type { AccessRole } from "../../features/accessControl/types/types";

interface RolesSectionProps {
  initialData?: AccessRole[];
  onCreate?: () => void;
  onEdit?: (role: AccessRole) => void;
  onSave?: (roles: AccessRole[]) => void;
}

export default function RolesSection({
  initialData = MOCK_ROLES,
  onCreate,
  onEdit,
  onSave,
}: RolesSectionProps) {
  const [roles, setRoles] =
    useState<AccessRole[]>(initialData);

  const updateRole = (
    id: string,
    changes: Partial<AccessRole>,
  ) => {
    setRoles((current) =>
      current.map((role) =>
        role.id === id
          ? { ...role, ...changes }
          : role,
      ),
    );
  };

  const handleSave = () => {
    onSave?.(roles);
  };

  return (
    <section
      id="roles"
      className="scroll-mt-6"
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#0f2f4a]">
            Roles
          </h2>

          <p className="mt-0.5 text-sm text-slate-500">
            Define los perfiles que determinan el nivel de acceso de cada usuario.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-md bg-[#39a900] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2f8f00]"
          >
            <Plus className="h-4 w-4" />
            Nuevo rol
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Rol
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Descripción
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Usuarios
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
              {roles.map((role) => (
                <tr
                  key={role.id}
                  className="border-b border-slate-100 last:border-b-0"
                >
                  <td className="px-4 py-4 font-semibold text-slate-900">
                    {role.name}
                  </td>

                  <td className="max-w-md px-4 py-4 text-slate-600">
                    {role.description}
                  </td>

                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                      <Users className="h-4 w-4" />
                      {role.usersCount}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <ToggleSwitch
                      checked={role.active}
                      onChange={(next) =>
                        updateRole(role.id, {
                          active: next,
                        })
                      }
                      label={`${role.active
                          ? "Desactivar"
                          : "Activar"
                        } rol ${role.name}`}
                    />
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => onEdit?.(role)}
                        aria-label={`Editar ${role.name}`}
                        className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-[#39a900] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2f8f00]"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </section>
  );
}