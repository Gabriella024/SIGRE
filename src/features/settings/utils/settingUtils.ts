import { normalizeText } from "@/lib/format";

import type { CentroSenaAdminRow, MunicipioRow, PantallaRow } from "../schemas/settingsSchema";
import type { CatalogStatus, Municipality, SenaCenter, SystemScreen } from "../types/types";

export function toMunicipality(row: MunicipioRow): Municipality {
  return { id: row.id, name: row.nombre_municipio, department: row.departamento ?? "", active: row.esta_activo };
}

export function toSenaCenter(row: CentroSenaAdminRow): SenaCenter {
  return {
    id: row.id,
    regionalId: row.id_regional_fk,
    code: row.codigo,
    name: row.nombre,
    status: row.estado,
    updatedAt: row.updated_at,
  };
}

export function toSystemScreen(row: PantallaRow): SystemScreen {
  return {
    id: row.id,
    moduleCode: row.modulo?.codigo ?? "",
    moduleName: row.modulo?.nombre ?? "Sin módulo",
    code: row.codigo,
    name: row.nombre,
    description: row.descripcion,
    route: row.ruta,
    order: row.orden,
    status: row.estado,
    updatedAt: row.updated_at,
  };
}

export function isActiveStatus(status: string | null): boolean {
  return normalizeText(status) === "activo";
}

export function toggledStatus(status: string | null): CatalogStatus {
  return isActiveStatus(status) ? "inactivo" : "activo";
}

export function municipalityOptions(municipios: readonly Municipality[], currentId: number | null): Municipality[] {
  return municipios.filter((municipio) => municipio.active || municipio.id === currentId);
}

export function municipalityLabel(municipality: Municipality): string {
  const label = municipality.department ? `${municipality.name} (${municipality.department})` : municipality.name;
  return municipality.active ? label : `${label} · inactivo`;
}
