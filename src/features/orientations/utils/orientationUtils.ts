import { formatTime, matchesOption, matchesSearch, normalizeText } from "@/lib/format";

import { DEFAULT_JORNADA_ESTADO, MODALIDAD_OPTIONS } from "../constants/jornada";
import {
  JORNADA_WRITABLE_FIELDS,
  type JornadaFormValues,
  type OrientacionDetailRow,
  type OrientacionRow,
} from "../schemas/orientationSchema";
import type {
  JornadaChanges,
  JornadaInsert,
  JornadaWritableField,
  Orientacion,
  OrientacionDetalle,
  OrientationFilters,
} from "../types/orientations";

export const INITIAL_ORIENTATION_FILTERS: OrientationFilters = {
  search: "",
  estado: "",
  modalidad: "",
  fecha: "",
};

export const EMPTY_JORNADA_FORM: JornadaFormValues = {
  tema: "",
  fecha: "",
  modalidad: "",
  hora_inicio: "",
  hora_fin: "",
  lugar_link: "",
  cupo: "",
  centro: "",
  observaciones: "",
};

const NON_CLEARABLE_FIELDS: ReadonlySet<JornadaWritableField> = new Set([
  "tema",
  "fecha",
  "hora_inicio",
  "hora_fin",
]);

export function toOrientacion(row: OrientacionRow): Orientacion {
  return {
    id: row.id,
    tema: row.tema,
    fecha: row.fecha,
    horaInicio: row.hora_inicio,
    horaFin: row.hora_fin,
    fechaHora: `${row.fecha} ${row.hora_inicio}`,
    modalidad: row.modalidad,
    lugarLink: row.lugar_link,
    audiencia: row.audiencia_esperada,
    estado: row.estado,
    idOrientador: row.id_orientador_fk,
  };
}

export function toOrientacionDetalle(row: OrientacionDetailRow): OrientacionDetalle {
  return {
    ...toOrientacion(row),
    descripcion: row.descripcion,
    fuente: row.fuente,
  };
}

export function isUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

export function normalizeModalidad(value: string | null): string {
  if (!value?.trim()) return "";
  const match = MODALIDAD_OPTIONS.find(
    (option) => normalizeText(option.value) === normalizeText(value)
  );
  return match?.value ?? value.trim();
}

export function modalidadLabel(value: string | null): string | null {
  if (!value?.trim()) return null;
  const match = MODALIDAD_OPTIONS.find(
    (option) => normalizeText(option.value) === normalizeText(value)
  );
  return match?.label ?? value;
}

export function todayKey(): string {
  return new Date().toLocaleDateString("en-CA");
}

export function filterOrientations(
  rows: Orientacion[],
  filters: OrientationFilters
): Orientacion[] {
  return rows.filter(
    (row) =>
      matchesSearch(filters.search, row.tema, row.lugarLink) &&
      matchesOption(filters.estado, row.estado) &&
      matchesOption(filters.modalidad, row.modalidad) &&
      (filters.fecha === "" || row.fecha === filters.fecha)
  );
}

export function filterAvailableJornadas(rows: Orientacion[], today: string): Orientacion[] {
  return rows.filter(
    (row) =>
      normalizeText(row.estado) === DEFAULT_JORNADA_ESTADO && row.fecha >= today
  );
}

export function countByEstado(rows: Orientacion[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = normalizeText(row.estado);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export function toJornadaFormValues(row: OrientacionDetalle): JornadaFormValues {
  return {
    ...EMPTY_JORNADA_FORM,
    tema: row.tema,
    fecha: row.fecha,
    modalidad: normalizeModalidad(row.modalidad),
    hora_inicio: formatTime(row.horaInicio),
    hora_fin: formatTime(row.horaFin),
    lugar_link: row.lugarLink ?? "",
  };
}

export function buildJornadaInsert(values: JornadaFormValues): JornadaInsert {
  const payload: JornadaInsert = {
    tema: values.tema,
    fecha: values.fecha,
    hora_inicio: values.hora_inicio,
    hora_fin: values.hora_fin,
    estado: DEFAULT_JORNADA_ESTADO,
  };

  if (values.modalidad) payload.modalidad = values.modalidad;
  if (values.lugar_link) payload.lugar_link = values.lugar_link;

  return payload;
}

export function buildJornadaChanges(
  initial: JornadaFormValues,
  values: JornadaFormValues
): JornadaChanges {
  const changes: JornadaChanges = {};

  for (const field of JORNADA_WRITABLE_FIELDS) {
    const value = values[field].trim();
    if (value === initial[field].trim()) continue;

    if (value) changes[field] = value;
    else if (!NON_CLEARABLE_FIELDS.has(field)) changes[field] = null;
  }

  return changes;
}
