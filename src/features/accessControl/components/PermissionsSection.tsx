import { useState } from "react";
import { Save, Check, X } from "lucide-react";

import { MOCK_PERMISSIONS } from "../../features/accessControl/mocks/accessControlMocks";
import type { PermissionModule } from "../../features/accessControl/types/types";

interface PermisosSectionProps {
  initialData?: PermissionModule[];
  onSave?: (permissions: PermissionModule[]) => void;
}

type PermissionKey =
  | "view"
  | "create"
  | "edit"
  | "delete";

const PERMISSIONS: {
  key: PermissionKey;
  label: string;
}[] = [
    {
      key: "view",
      label: "Ver",
    },
    {
      key: "create",
      label: "Crear",
    },
    {
      key: "edit",
      label: "Editar",
    },
    {
      key: "delete",
      label: "Eliminar",
    },
  ];

function PermissionIcon({
  enabled,
}: {
  enabled: boolean;
}) {
  return enabled ? (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-green-700">
      <Check className="h-4 w-4" />
    </span>
  ) : (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-400">
      <X className="h-4 w-4" />
    </span>
  );
}

export default function PermisosSection({
  initialData = MOCK_PERMISSIONS,
  onSave,
}: PermisosSectionProps) {
  const [permissions, setPermissions] =
    useState<PermissionModule[]>(initialData);

  const [selectedRole, setSelectedRole] =
    useState("Administrador");

  const togglePermission = (
    moduleId: string,
    permission: PermissionKey,
  ) => {
    setPermissions((current) =>
      current.map((module) =>
        module.id === moduleId
          ? {
            ...module,
            [permission]: !module[permission],
          }
          : module,
      ),
    );
  };

  return (
    <section
      id="permisos"
      className="scroll-mt-6"
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#0f2f4a]">
            Permisos
          </h2>

          <p className="mt-0.5 text-sm text-slate-500">
            Configura qué acciones puede realizar cada rol dentro de la aplicación.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSave?.(permissions)}
          className="inline-flex items-center gap-2 rounded-md bg-[#39a900] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2f8f00]"
        >
          <Save className="h-4 w-4" />
          Guardar cambios
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Selector de rol */}

        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-slate-50/70 p-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Rol seleccionado
            </p>

            <p className="text-xs text-slate-500">
              Selecciona el rol que deseas configurar.
            </p>
          </div>

          <select
            value={selectedRole}
            onChange={(event) =>
              setSelectedRole(event.target.value)
            }
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-[#39a900] focus:ring-2 focus:ring-green-100"
          >
            <option>Administrador</option>
            <option>Orientador</option>
            <option>Evaluador</option>
            <option>Emprendedor</option>
          </select>
        </div>

        {/* Matriz */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Módulo
                </th>

                {PERMISSIONS.map((permission) => (
                  <th
                    key={permission.key}
                    className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {permission.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {permissions.map((module) => (
                <tr
                  key={module.id}
                  className="border-b border-slate-100 last:border-b-0"
                >
                  <td className="px-4 py-4 font-semibold text-slate-900">
                    {module.name}
                  </td>

                  {PERMISSIONS.map((permission) => (
                    <td
                      key={permission.key}
                      className="px-4 py-4 text-center"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          togglePermission(
                            module.id,
                            permission.key,
                          )
                        }
                        aria-label={`${permission.label} ${module.name}`}
                        className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#39a900] focus-visible:ring-offset-2"
                      >
                        <PermissionIcon
                          enabled={
                            module[permission.key]
                          }
                        />
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 bg-slate-50/50 px-4 py-3 text-xs text-slate-500">
          Configurando permisos para el rol:{" "}
          <span className="font-semibold text-slate-700">
            {selectedRole}
          </span>
        </div>
      </div>
    </section>
  );
}