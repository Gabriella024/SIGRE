import { matchesOption, matchesSearch, normalizeText } from "@/lib/format";

import { entrepreneurIdSchema } from "../schemas/entrepreneursSchema";

import type {
  CentroSenaRow,
  EmprendedorDetailRow,
  EmprendedorRow,
  EntrepreneurEditFormValues,
  EntrepreneurFormValues,
  OrientadorElegibleRow,
  OrientadorEntrepreneurEditFormValues,
  OwnEntrepreneurEditFormValues,
  UsuarioContactoRow,
  UsuarioElegibleRow,
  UsuarioResumenRow,
} from "../schemas/entrepreneursSchema";
import type {
  AsignarOrientadorAdminInput,
  CambiarEstadoEmprendedorAdminInput,
  CentroSena,
  CrearEmprendedorAdminInput,
  EditarEmprendedorAdminInput,
  EntrepreneurAssignmentTarget,
  EntrepreneurEditTarget,
  EligibleEntrepreneurUser,
  Entrepreneur,
  EntrepreneurDetail,
  EntrepreneurFilters,
  EntrepreneurMetrics,
  EntrepreneurSort,
  EntrepreneurScope,
  EntrepreneurSortKey,
  EntrepreneurStatusTarget,
  OrientadorElegible,
  OrientadorEntrepreneurEditInput,
  OwnEntrepreneurEditInput,
  UsuarioContacto,
  UsuarioResumen,
} from "../types/entrepreneur";

export const INITIAL_ENTREPRENEUR_FILTERS: EntrepreneurFilters = {
  search: "",
  estado: "",
  centro: "",
  nivelFormacion: "",
  tipo: "",
  orientador: "",
};

export const PROFILE_TEXT_FIELDS = {
  programa_formacion: { label: "Programa de formación", placeholder: "Programa cursado" },
  nivel_formacion: { label: "Nivel de formación", placeholder: "Nivel" },
  tipo_emprendedor: { label: "Tipo de emprendedor", placeholder: "Tipo" },
  segmentacion: { label: "Segmentación", placeholder: "Segmento" },
} as const;

export const ORIENTADOR_FILTER_OPTIONS = [
  { value: "con", label: "Con orientador" },
  { value: "sin", label: "Sin orientador" },
];

export const ALL_ENTREPRENEURS_SCOPE: EntrepreneurScope = { kind: "all" };

export function isInEntrepreneurScope(
  scope: EntrepreneurScope,
  row: Pick<EntrepreneurDetail, "orientadorId" | "usuarioId">
): boolean {
  switch (scope.kind) {
    case "all":
      return true;
    case "assigned":
      return row.orientadorId === scope.orientadorId;
    case "own":
      return row.usuarioId === scope.usuarioId;
  }
}

export const ENTREPRENEUR_UNAVAILABLE_MESSAGE =
  "El emprendedor no existe, fue eliminado o no tienes permisos para verlo.";

export function isValidEntrepreneurId(value: string): boolean {
  return entrepreneurIdSchema.safeParse(value).success;
}

export const ENTREPRENEUR_TIME_ZONE = "America/Bogota";

const entrepreneurDateFormat = new Intl.DateTimeFormat("es-CO", {
  timeZone: ENTREPRENEUR_TIME_ZONE,
  dateStyle: "long",
  timeStyle: "short",
});

export function formatEntrepreneurDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : entrepreneurDateFormat.format(date);
}

export const DEFAULT_ENTREPRENEUR_SORT: EntrepreneurSort = { key: "nombre", dir: "asc" };

export const ENTREPRENEUR_PAGE_SIZE = 12;

export const ENTREPRENEUR_SORT_KEYS = [
  "nombre",
  "centro",
  "programa",
  "nivelFormacion",
  "tipo",
  "estado",
  "orientador",
  "createdAt",
] as const satisfies readonly EntrepreneurSortKey[];

export function isEntrepreneurSortKey(value: string): value is EntrepreneurSortKey {
  return (ENTREPRENEUR_SORT_KEYS as readonly string[]).includes(value);
}

export function toUsuarioResumen(row: UsuarioResumenRow): UsuarioResumen {
  const nombre = [row.primer_nombre, row.segundo_nombre, row.primer_apellido, row.segundo_apellido]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");

  return {
    id: row.id,
    nombre: nombre || null,
    correo: row.correo_electronico?.trim() || null,
    estado: row.estado,
    eliminado: row.deleted_at !== null,
  };
}

export function toUsuarioContacto(row: UsuarioContactoRow): UsuarioContacto {
  return {
    ...toUsuarioResumen(row),
    telefono: row.numero_telefono?.trim() || null,
    tipoDocumento: row.tipo_documento?.trim() || null,
    numeroDocumento: row.numero_documento?.trim() || null,
  };
}

export function isUsuarioVigente(usuario: UsuarioResumen): boolean {
  return !usuario.eliminado && normalizeText(usuario.estado) === "activo";
}

export function orientadorNombre(row: Pick<Entrepreneur, "orientador">): string | null {
  return row.orientador?.nombre ?? null;
}

export function toEntrepreneur(row: EmprendedorRow): Entrepreneur {
  return {
    id: row.id,
    nombre: row.nombre_completo,
    centro: row.centro_sena,
    programa: row.programa_formacion,
    nivelFormacion: row.nivel_formacion,
    tipo: row.tipo_emprendedor,
    segmentacion: row.segmentacion,
    estado: row.estado,
    createdAt: row.created_at,
    orientadorId: row.id_orientador_fk,
    orientador: row.orientador ? toUsuarioResumen(row.orientador) : null,
  };
}

export function toEntrepreneurDetail(row: EmprendedorDetailRow): EntrepreneurDetail {
  return {
    ...toEntrepreneur(row),
    updatedAt: row.updated_at,
    usuarioId: row.usuario_id,
    usuario: row.usuario ? toUsuarioContacto(row.usuario) : null,
    centroSenaId: row.id_centro_sena_fk,
  };
}

export function filterEntrepreneurs(
  rows: readonly Entrepreneur[],
  filters: EntrepreneurFilters
): Entrepreneur[] {
  return rows.filter(
    (row) =>
      matchesSearch(
        filters.search,
        row.nombre,
        row.centro,
        row.programa,
        row.nivelFormacion,
        row.tipo,
        orientadorNombre(row)
      ) &&
      matchesOrientadorFilter(filters.orientador, row) &&
      matchesOption(filters.estado, row.estado) &&
      matchesOption(filters.centro, row.centro) &&
      matchesOption(filters.nivelFormacion, row.nivelFormacion) &&
      matchesOption(filters.tipo, row.tipo)
  );
}

function matchesOrientadorFilter(filter: string, row: Pick<Entrepreneur, "orientadorId">): boolean {
  if (filter === "con") return row.orientadorId !== null;
  if (filter === "sin") return row.orientadorId === null;
  return true;
}

export function stepPage(current: number, delta: number, totalPages: number): number {
  const last = Math.max(1, totalPages);
  const base = Math.min(Math.max(1, current), last);
  return Math.min(Math.max(1, base + delta), last);
}

export function hasActiveEntrepreneurFilters(filters: EntrepreneurFilters): boolean {
  return Object.values(filters).some((value) => value.trim() !== "");
}

const collator = new Intl.Collator("es", { sensitivity: "base", numeric: true });

function sortValue(row: Entrepreneur, key: EntrepreneurSortKey): string | number | null {
  if (key === "createdAt") {
    const time = Date.parse(row.createdAt);
    return Number.isNaN(time) ? null : time;
  }
  const value = (key === "orientador" ? orientadorNombre(row) : row[key])?.trim();
  return value ? value : null;
}

function compareIds(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function sortEntrepreneurs(rows: readonly Entrepreneur[], sort: EntrepreneurSort): Entrepreneur[] {
  const factor = sort.dir === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    const left = sortValue(a, sort.key);
    const right = sortValue(b, sort.key);

    if (left === null || right === null) {
      if (left !== right) return left === null ? 1 : -1;
      return compareIds(a.id, b.id);
    }

    const result =
      typeof left === "number" && typeof right === "number"
        ? left - right
        : collator.compare(String(left), String(right));

    return result !== 0 ? factor * result : compareIds(a.id, b.id);
  });
}

export function normalizeSpaces(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

function toNullableText(value: string): string | null {
  const normalized = normalizeSpaces(value);
  return normalized === "" ? null : normalized;
}

export function toCrearEmprendedorAdminInput(values: EntrepreneurFormValues): CrearEmprendedorAdminInput {
  return {
    usuarioId: values.usuario_id.trim(),
    nombreCompleto: normalizeSpaces(values.nombre_completo),
    idCentroSena: values.id_centro_sena_fk.trim(),
    programaFormacion: toNullableText(values.programa_formacion),
    nivelFormacion: toNullableText(values.nivel_formacion),
    tipoEmprendedor: toNullableText(values.tipo_emprendedor),
    segmentacion: toNullableText(values.segmentacion),
  };
}

export function toEntrepreneurEditValues(detail: EntrepreneurDetail): EntrepreneurEditFormValues {
  return {
    nombre_completo: detail.nombre,
    id_centro_sena_fk: detail.centroSenaId ?? "",
    programa_formacion: detail.programa ?? "",
    nivel_formacion: detail.nivelFormacion ?? "",
    tipo_emprendedor: detail.tipo ?? "",
    segmentacion: detail.segmentacion ?? "",
  };
}

export function toEntrepreneurEditTarget(detail: EntrepreneurDetail): EntrepreneurEditTarget {
  return {
    id: detail.id,
    updatedAt: detail.updatedAt,
    original: {
      nombreCompleto: detail.nombre,
      programaFormacion: detail.programa,
      nivelFormacion: detail.nivelFormacion,
      tipoEmprendedor: detail.tipo,
      segmentacion: detail.segmentacion,
    },
  };
}

function keepOrNormalize(original: string | null, value: string): string | null {
  return value === (original ?? "") ? original : toNullableText(value);
}

export function toEditarEmprendedorAdminInput(
  target: EntrepreneurEditTarget,
  values: EntrepreneurEditFormValues
): EditarEmprendedorAdminInput {
  const { original } = target;

  return {
    idEmprendedor: target.id,
    updatedAtEsperado: target.updatedAt ?? "",
    nombreCompleto:
      values.nombre_completo === original.nombreCompleto
        ? original.nombreCompleto
        : normalizeSpaces(values.nombre_completo),
    idCentroSena: values.id_centro_sena_fk.trim(),
    programaFormacion: keepOrNormalize(original.programaFormacion, values.programa_formacion),
    nivelFormacion: keepOrNormalize(original.nivelFormacion, values.nivel_formacion),
    tipoEmprendedor: keepOrNormalize(original.tipoEmprendedor, values.tipo_emprendedor),
    segmentacion: keepOrNormalize(original.segmentacion, values.segmentacion),
  };
}

export function toOrientadorEntrepreneurEditValues(detail: EntrepreneurDetail): OrientadorEntrepreneurEditFormValues {
  return {
    numero_telefono: detail.usuario?.telefono ?? "",
    programa_formacion: detail.programa ?? "",
    nivel_formacion: detail.nivelFormacion ?? "",
    tipo_emprendedor: detail.tipo ?? "",
    segmentacion: detail.segmentacion ?? "",
  };
}

export function toOwnEntrepreneurEditValues(detail: EntrepreneurDetail): OwnEntrepreneurEditFormValues {
  return {
    nombre_completo: detail.nombre,
    numero_telefono: detail.usuario?.telefono ?? "",
    programa_formacion: detail.programa ?? "",
    nivel_formacion: detail.nivelFormacion ?? "",
  };
}

export function toOrientadorEntrepreneurEditInput(
  detail: EntrepreneurDetail,
  values: OrientadorEntrepreneurEditFormValues
): OrientadorEntrepreneurEditInput {
  return {
    idEmprendedor: detail.id,
    updatedAtEsperado: detail.updatedAt ?? "",
    numeroTelefono: keepOrNormalize(detail.usuario?.telefono ?? null, values.numero_telefono),
    programaFormacion: keepOrNormalize(detail.programa, values.programa_formacion),
    nivelFormacion: keepOrNormalize(detail.nivelFormacion, values.nivel_formacion),
    tipoEmprendedor: keepOrNormalize(detail.tipo, values.tipo_emprendedor),
    segmentacion: keepOrNormalize(detail.segmentacion, values.segmentacion),
  };
}

export function toOwnEntrepreneurEditInput(
  detail: EntrepreneurDetail,
  values: OwnEntrepreneurEditFormValues
): OwnEntrepreneurEditInput {
  return {
    idEmprendedor: detail.id,
    updatedAtEsperado: detail.updatedAt ?? "",
    nombreCompleto: values.nombre_completo === detail.nombre ? detail.nombre : normalizeSpaces(values.nombre_completo),
    numeroTelefono: keepOrNormalize(detail.usuario?.telefono ?? null, values.numero_telefono),
    programaFormacion: keepOrNormalize(detail.programa, values.programa_formacion),
    nivelFormacion: keepOrNormalize(detail.nivelFormacion, values.nivel_formacion),
  };
}

export function hasValidVersion(updatedAt: string | null): updatedAt is string {
  return updatedAt !== null && !Number.isNaN(Date.parse(updatedAt));
}

export function toCentroSena(row: CentroSenaRow): CentroSena {
  return { id: row.id, codigo: row.codigo, nombre: row.nombre };
}

export function centroSenaLabel(centro: CentroSena): string {
  const codigo = centro.codigo?.trim();
  return codigo ? `${centro.nombre} (${codigo})` : centro.nombre;
}

export function toEligibleEntrepreneurUser(row: UsuarioElegibleRow): EligibleEntrepreneurUser {
  return {
    id: row.usuario_id,
    nombre: row.nombre_completo,
    correo: row.correo_electronico,
  };
}

export function isActiveEntrepreneur(row: Pick<Entrepreneur, "estado">): boolean {
  return normalizeText(row.estado) === "activo";
}

export function toAvatarName(nombre: string): string {
  return nombre.trim().replace(/\s+/g, " ");
}

export function isInactiveEntrepreneur(row: Pick<Entrepreneur, "estado">): boolean {
  return normalizeText(row.estado) === "inactivo";
}

export function computeEntrepreneurMetrics(rows: readonly Pick<Entrepreneur, "estado">[]): EntrepreneurMetrics {
  let activos = 0;
  let inactivos = 0;

  for (const row of rows) {
    if (isActiveEntrepreneur(row)) activos += 1;
    else if (isInactiveEntrepreneur(row)) inactivos += 1;
  }

  return { total: rows.length, activos, inactivos, otros: rows.length - activos - inactivos };
}

export function toOrientadorElegible(row: OrientadorElegibleRow): OrientadorElegible {
  return { id: row.id, nombre: row.nombre, correo: row.correo };
}

export function orientadorLabel(orientador: OrientadorElegible): string {
  return `${orientador.nombre} — ${orientador.correo}`;
}

export function shortReference(id: string): string {
  return id.slice(0, 8);
}

export function toEntrepreneurAssignmentTarget(detail: EntrepreneurDetail): EntrepreneurAssignmentTarget {
  return { id: detail.id, updatedAt: detail.updatedAt, orientadorId: detail.orientadorId };
}

export function toEntrepreneurStatusTarget(detail: EntrepreneurDetail): EntrepreneurStatusTarget | null {
  if (isActiveEntrepreneur(detail)) {
    return { id: detail.id, updatedAt: detail.updatedAt, estadoActual: "activo", estadoNuevo: "inactivo" };
  }
  if (isInactiveEntrepreneur(detail)) {
    return { id: detail.id, updatedAt: detail.updatedAt, estadoActual: "inactivo", estadoNuevo: "activo" };
  }
  return null;
}

export function toCambiarEstadoEmprendedorAdminInput(
  target: EntrepreneurStatusTarget,
  justificacion: string
): CambiarEstadoEmprendedorAdminInput {
  return {
    idEmprendedor: target.id,
    updatedAtEsperado: target.updatedAt ?? "",
    estadoNuevo: target.estadoNuevo,
    justificacion: justificacion.trim(),
  };
}

export function toAsignarOrientadorAdminInput(
  target: EntrepreneurAssignmentTarget,
  idOrientador: string | null
): AsignarOrientadorAdminInput {
  return { idEmprendedor: target.id, updatedAtEsperado: target.updatedAt ?? "", idOrientador };
}
