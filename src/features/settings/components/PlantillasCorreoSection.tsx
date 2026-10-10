import { useMemo, useState } from "react";

import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Power,
  Search,
} from "lucide-react";

import ConfigSection from "./ConfigSection";
import { MOCK_MUNICIPALITIES } from "../mocks/SettingsMocks";

import type {
  Municipality,
  MunicipalityStatusFilter,
} from "../types/types";

interface MunicipiosSectionProps {
  initialData?: Municipality[];
  pageSize?: number;
  onCreate?: () => void;
  onEdit?: (municipality: Municipality) => void;
  onToggleActive?: (municipality: Municipality) => void;
}

const normalize = (value: string): string =>
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

export default function PlantillasCorreoSection({
  initialData = MOCK_MUNICIPALITIES,
  pageSize = 5,
  onCreate,
  onEdit,
  onToggleActive,
}: MunicipiosSectionProps) {
  const [items, setItems] = useState<Municipality[]>(initialData);
  const [query, setQuery] = useState("");
  const [status, setStatus] =
    useState<MunicipalityStatusFilter>("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const needle = normalize(query.trim());

    return items.filter((item) => {
      const matchesText =
        needle === "" ||
        normalize(item.name).includes(needle) ||
        normalize(item.department).includes(needle);

      const matchesStatus =
        status === "all" ||
        (status === "active" && item.active) ||
        (status === "inactive" && !item.active);

      return matchesText && matchesStatus;
    });
  }, [items, query, status]);

  const pageCount = Math.max(
    1,
    Math.ceil(filtered.length / pageSize)
  );

  const currentPage = Math.min(page, pageCount);

  const rows = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const toggleActive = (municipality: Municipality) => {
    setItems((current) =>
      current.map((item) =>
        item.id === municipality.id
          ? {
            ...item,
            active: !item.active,
          }
          : item
      )
    );

    onToggleActive?.(municipality);
  };

  return (
    <ConfigSection
      id="municipios"
      title="Municipios"
      description="Administra los municipios disponibles para el registro de usuarios."
      action={
        <button
          type="button"
          onClick={() => onCreate?.()}
          className="inline-flex items-center gap-2 rounded-lg bg-[#39a900] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2f8f00] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#39a900] focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          Nuevo municipio
        </button>
      }
    >
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Filtros */}
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
              placeholder="Buscar municipio o departamento"
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 pl-9 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#39a900] focus:ring-2 focus:ring-[#39a900]/20"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            Estado

            <select
              value={status}
              onChange={(event) => {
                setStatus(
                  event.target.value as MunicipalityStatusFilter
                );
                setPage(1);
              }}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal text-slate-700 outline-none focus:border-[#39a900] focus:ring-2 focus:ring-[#39a900]/20"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Municipio
                </th>

                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Departamento
                </th>

                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Estado
                </th>

                <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-sm text-slate-400"
                  >
                    No se encontraron municipios.
                  </td>
                </tr>
              ) : (
                rows.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 last:border-b-0"
                  >
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      {item.name}
                    </td>

                    <td className="px-4 py-4 text-slate-600">
                      {item.department}
                    </td>

                    <td className="px-4 py-4">
                      <StatusPill active={item.active} />
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit?.(item)}
                          aria-label={`Editar ${item.name}`}
                          className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleActive(item)}
                          aria-label={`${item.active ? "Desactivar" : "Activar"
                            } ${item.name}`}
                          title={
                            item.active
                              ? "Desactivar"
                              : "Activar"
                          }
                          className={`rounded-md p-2 ${item.active
                              ? "text-red-500 hover:bg-red-50"
                              : "text-green-600 hover:bg-green-50"
                            }`}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
          <span>
            Mostrando {rows.length} de {filtered.length} municipios
          </span>

          <div className="flex items-center gap-2">
            <span>
              Página {currentPage} de {pageCount}
            </span>

            {pageCount > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setPage(Math.max(1, currentPage - 1))
                  }
                  disabled={currentPage === 1}
                  className="rounded-md border border-slate-200 p-1 disabled:opacity-40"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setPage(
                      Math.min(pageCount, currentPage + 1)
                    )
                  }
                  disabled={currentPage === pageCount}
                  className="rounded-md border border-slate-200 p-1 disabled:opacity-40"
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </ConfigSection>
  );
}