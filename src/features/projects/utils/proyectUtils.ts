import { localDateKey, matchesOption, matchesSearch } from "@/lib/format";

import { DEFAULT_PROYECTO_ESTADO } from "../schemas/proyectSchema";

import type {
  ProjectFormValues,
  ProyectoDetailRow,
  ProyectoExportRow,
  ProyectoRow,
} from "../schemas/proyectSchema";
import type {
  CrearProyectoAdminInput,
  EditarProyectoAdminInput,
  Project,
  ProjectDetail,
  ProjectEditTarget,
  ProjectEditableFields,
  ProjectExportRow,
  ProjectFilters,
  ProjectFormContext,
} from "../types/proyect";

export const INITIAL_PROJECT_FILTERS: ProjectFilters = {
  search: "",
  estado: "",
  sector: "",
  etapa: "",
  fechaRegistro: "",
};

export const EMPTY_PROJECT_FORM: ProjectFormValues = {
  id_emprendedor_fk: "",
  titulo: "",
  descripcion: "",
  sector_economico: "",
  problema_oportunidad: "",
  propuesta_valor: "",
  observaciones: "",
};

export const NEW_PROJECT_CONTEXT: ProjectFormContext = {
  emprendedor: null,
  estado: DEFAULT_PROYECTO_ESTADO,
  etapa: null,
  updatedAt: null,
};

export function toProjectFormValues(detail: ProjectDetail): ProjectFormValues {
  return {
    id_emprendedor_fk: detail.emprendedorId ?? "",
    titulo: detail.titulo,
    descripcion: detail.descripcion ?? "",
    sector_economico: detail.sector ?? "",
    problema_oportunidad: detail.problemaOportunidad ?? "",
    propuesta_valor: detail.propuestaValor ?? "",
    observaciones: detail.observaciones ?? "",
  };
}

function toNullableText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function toCrearProyectoAdminInput(values: ProjectFormValues): CrearProyectoAdminInput {
  return {
    idEmprendedor: values.id_emprendedor_fk.trim(),
    titulo: values.titulo.trim(),
    descripcion: toNullableText(values.descripcion),
    sectorEconomico: toNullableText(values.sector_economico),
    problemaOportunidad: toNullableText(values.problema_oportunidad),
    propuestaValor: toNullableText(values.propuesta_valor),
    observaciones: toNullableText(values.observaciones),
  };
}

export function toProjectFormContext(detail: ProjectDetail): ProjectFormContext {
  return {
    emprendedor: detail.emprendedor,
    estado: detail.estado,
    etapa: detail.etapa,
    updatedAt: detail.updatedAt,
  };
}

export function toProjectEditableFields(detail: ProjectDetail): ProjectEditableFields {
  return {
    titulo: detail.titulo,
    descripcion: detail.descripcion,
    sectorEconomico: detail.sector,
    problemaOportunidad: detail.problemaOportunidad,
    propuestaValor: detail.propuestaValor,
    observaciones: detail.observaciones,
  };
}

function keepOrNormalize(original: string | null, value: string): string | null {
  return value === (original ?? "") ? original : toNullableText(value);
}

export function toEditarProyectoAdminInput(
  target: ProjectEditTarget,
  values: ProjectFormValues
): EditarProyectoAdminInput {
  const { original } = target;

  return {
    idProyecto: target.id,
    updatedAtEsperado: target.updatedAt ?? "",
    titulo: values.titulo === original.titulo ? original.titulo : values.titulo.trim(),
    descripcion: keepOrNormalize(original.descripcion, values.descripcion),
    sectorEconomico: keepOrNormalize(original.sectorEconomico, values.sector_economico),
    problemaOportunidad: keepOrNormalize(original.problemaOportunidad, values.problema_oportunidad),
    propuestaValor: keepOrNormalize(original.propuestaValor, values.propuesta_valor),
    observaciones: keepOrNormalize(original.observaciones, values.observaciones),
  };
}

export function toProject(row: ProyectoRow): Project {
  return {
    id: row.id,
    titulo: row.titulo,
    emprendedorId: row.id_emprendedor_fk,
    emprendedor: row.emprendedor?.nombre_completo ?? null,
    sector: row.sector_economico,
    etapa: row.etapa_actual,
    estado: row.estado_proyecto,
    createdAt: row.created_at,
  };
}

export function toProjectExportRow(row: ProyectoExportRow): ProjectExportRow {
  return { ...toProject(row), updatedAt: row.updated_at };
}

export function toProjectDetail(row: ProyectoDetailRow): ProjectDetail {
  return {
    ...toProject(row),
    descripcion: row.descripcion,
    problemaOportunidad: row.problema_oportunidad,
    propuestaValor: row.propuesta_valor,
    observaciones: row.observaciones,
    updatedAt: row.updated_at,
  };
}

export function filterProjects<T extends Project>(rows: T[], filters: ProjectFilters): T[] {
  return rows.filter(
    (row) =>
      matchesSearch(filters.search, row.titulo, row.emprendedor, row.sector) &&
      matchesOption(filters.estado, row.estado) &&
      matchesOption(filters.sector, row.sector) &&
      matchesOption(filters.etapa, row.etapa) &&
      (filters.fechaRegistro === "" || localDateKey(row.createdAt) === filters.fechaRegistro)
  );
}
