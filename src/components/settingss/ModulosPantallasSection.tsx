import { useState } from "react";

import {
  Calendar,
  ChartColumn,
  Folder,
  Mic,
  Save,
  Target,
  TriangleAlert,
  Users,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

import ConfigSection from "./ConfigSection";
import ToggleSwitch from "./ToggleSwitch";

import { MOCK_MODULES } from "../../features/settingss/mocks/SettingsMocks";

import type {
  ModuleIconKey,
  SystemModule,
} from "../../features/settingss/types/types";

interface ModulosPantallasSectionProps {
  initialData?: SystemModule[];
  onSave?: (modules: SystemModule[]) => void;
}

const ICONS: Record<
  ModuleIconKey,
  {
    label: string;
    Icon: LucideIcon;
  }
> = {
  users: {
    label: "Usuarios",
    Icon: Users,
  },

  folder: {
    label: "Carpeta",
    Icon: Folder,
  },

  calendar: {
    label: "Calendario",
    Icon: Calendar,
  },

  target: {
    label: "Objetivo",
    Icon: Target,
  },

  mic: {
    label: "Micrófono",
    Icon: Mic,
  },

  chart: {
    label: "Gráfica",
    Icon: ChartColumn,
  },
};

function formatSavedAt(date: Date): string {
  const time = new Intl.DateTimeFormat(
    "es-CO",
    {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }
  ).format(date);

  return `hoy, ${time}`;
}

export default function ModulosPantallasSection({
  initialData = MOCK_MODULES,
  onSave,
}: ModulosPantallasSectionProps) {
  const [modules, setModules] =
    useState<SystemModule[]>(initialData);

  const [updatedAt, setUpdatedAt] =
    useState("hoy, 9:42 a. m.");

  const updateModule = (
    id: string,
    changes: Partial<SystemModule>
  ) => {
    setModules((current) =>
      current.map((item) =>
        item.id === id
          ? {
            ...item,
            ...changes,
          }
          : item
      )
    );
  };

  const handleSave = () => {
    onSave?.(modules);
    setUpdatedAt(
      formatSavedAt(new Date())
    );
  };

  return (
    <ConfigSection
      id="modulos-pantallas"
      title="Módulos y pantallas"
      description="Configura la navegación y disponibilidad de las pantallas del sistema."
      action={
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-lg bg-[#39a900] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2f8f00]"
        >
          <Save className="h-4 w-4" />
          Guardar cambios
        </button>
      }
    >
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {/* ALERTA */}
        <div className="m-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <TriangleAlert className="h-4 w-4 shrink-0" />

          <p>
            <strong className="font-semibold">
              Ten en cuenta:
            </strong>{" "}
            Desactivar una pantalla la oculta para todos los roles.
          </p>
        </div>

        {/* TABLA */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Módulo
                </th>

                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Código
                </th>

                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Nombre
                </th>

                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Ruta
                </th>

                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Orden en el menú
                </th>

                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Ícono
                </th>

                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Activa
                </th>
              </tr>
            </thead>

            <tbody>
              {modules.map((item) => {
                const {
                  label,
                  Icon,
                } = ICONS[item.icon];

                return (
                  <tr
                    key={item.id}
                    className="border-t border-slate-100"
                  >
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      {item.module}
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-600">
                        {item.code}
                      </span>
                    </td>

                    <td className="px-4 py-4 font-semibold text-slate-800">
                      {item.screenName}
                    </td>

                    <td className="px-4 py-4">
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
                        {item.route}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <input
                        type="number"
                        min={1}
                        value={item.order}
                        aria-label={`Orden de ${item.module} en el menú`}
                        onChange={(event) =>
                          updateModule(
                            item.id,
                            {
                              order: Number(
                                event.target.value
                              ),
                            }
                          )
                        }
                        className="h-10 w-16 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[#39a900] focus:ring-2 focus:ring-[#39a900]/20"
                      />
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-2 text-slate-600">
                        <Icon className="h-4 w-4" />
                        {label}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <ToggleSwitch
                        checked={item.active}
                        onChange={(next) =>
                          updateModule(
                            item.id,
                            {
                              active: next,
                            }
                          )
                        }
                        label={`${item.active
                            ? "Desactivar"
                            : "Activar"
                          } pantalla ${item.screenName}`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* PIE */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
          <span>
            {modules.length} módulos ·{" "}
            {modules.length} pantallas configuradas
          </span>

          <span>
            Última actualización: {updatedAt}
          </span>
        </div>
      </div>
    </ConfigSection>
  );
}