import { z } from "zod";

export const MUNICIPIO_COLUMNS = "id, nombre_municipio, departamento, esta_activo";

export const municipioRowSchema = z.object({
  id: z.number().int(),
  nombre_municipio: z.string(),
  departamento: z.string().nullable(),
  esta_activo: z.boolean(),
});

export type MunicipioRow = z.infer<typeof municipioRowSchema>;

export const CENTRO_SENA_COLUMNS = "id, id_regional_fk, codigo, nombre, estado, updated_at";

export const centroSenaAdminRowSchema = z.object({
  id: z.guid(),
  id_regional_fk: z.guid(),
  codigo: z.string().nullable(),
  nombre: z.string(),
  estado: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export type CentroSenaAdminRow = z.infer<typeof centroSenaAdminRowSchema>;

export const PANTALLA_COLUMNS =
  "id, codigo, nombre, descripcion, ruta, orden, estado, updated_at, modulo:app_modulos(codigo, nombre)";

export const pantallaRowSchema = z.object({
  id: z.string(),
  codigo: z.string(),
  nombre: z.string(),
  descripcion: z.string().nullable(),
  ruta: z.string().nullable(),
  orden: z.number().nullable(),
  estado: z.string().nullable(),
  updated_at: z.string().nullable(),
  modulo: z.object({ codigo: z.string(), nombre: z.string() }).nullable(),
});

export type PantallaRow = z.infer<typeof pantallaRowSchema>;

const requiredText = (label: string, max: number) =>
  z.string().trim().min(1, `${label} es obligatorio.`).max(max, `${label} admite máximo ${max} caracteres.`);

export const municipioFormSchema = z.object({
  nombre: requiredText("El nombre del municipio", 120),
  departamento: requiredText("El departamento", 120),
});

export type MunicipioFormValues = z.infer<typeof municipioFormSchema>;

export const centroSenaFormSchema = z.object({
  codigo: requiredText("El código", 30),
  nombre: requiredText("El nombre del centro", 200),
});

export type CentroSenaFormValues = z.infer<typeof centroSenaFormSchema>;

export const screenOrderSchema = z.number().int("El orden debe ser un número entero.").min(1, "El orden mínimo es 1.");
