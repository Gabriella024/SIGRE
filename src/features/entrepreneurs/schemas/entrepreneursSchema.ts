import { z } from "zod";

export const EMPRENDEDOR_COLUMNS =
  "id, nombre_completo, centro_sena, programa_formacion, nivel_formacion, tipo_emprendedor, segmentacion, estado, created_at";

export const emprendedorRowSchema = z.object({
  id: z.string(),
  nombre_completo: z.string(),
  centro_sena: z.string().nullable(),
  programa_formacion: z.string().nullable(),
  nivel_formacion: z.string().nullable(),
  tipo_emprendedor: z.string().nullable(),
  segmentacion: z.string().nullable(),
  estado: z.string().nullable(),
  created_at: z.string(),
});

export type EmprendedorRow = z.infer<typeof emprendedorRowSchema>;

export const DEFAULT_EMPRENDEDOR_ESTADO = "activo";

const optionalText = z.string().trim();

const optionalUuid = (label: string) =>
  z
    .string()
    .trim()
    .refine((value) => value === "" || z.uuid().safeParse(value).success, `${label} no es un identificador válido.`);

export const entrepreneurFormSchema = z.object({
  usuario_id: z
    .string()
    .trim()
    .min(1, { message: "Debes seleccionar el usuario del emprendedor.", abort: true })
    .pipe(z.uuid("El usuario seleccionado no es válido.")),
  nombre_completo: z
    .string()
    .trim()
    .min(1, "El nombre completo es obligatorio."),
  centro_sena: optionalText,
  programa_formacion: optionalText,
  nivel_formacion: optionalText,
  tipo_emprendedor: optionalText,
  segmentacion: optionalText,
  id_orientador_fk: optionalUuid("El orientador"),
  id_centro_sena_fk: optionalUuid("El centro SENA"),
});

export type EntrepreneurFormValues = z.infer<typeof entrepreneurFormSchema>;

export const EMPTY_ENTREPRENEUR_FORM: EntrepreneurFormValues = {
  usuario_id: "",
  nombre_completo: "",
  centro_sena: "",
  programa_formacion: "",
  nivel_formacion: "",
  tipo_emprendedor: "",
  segmentacion: "",
  id_orientador_fk: "",
  id_centro_sena_fk: "",
};

export type EmprendedorInsert = {
  [K in keyof EntrepreneurFormValues]: K extends "usuario_id" | "nombre_completo" ? string : string | null;
};

export const usuarioElegibleRowSchema = z.object({
  usuario_id: z.uuid(),
  nombre_completo: z.string(),
  correo_electronico: z.string(),
});

export type UsuarioElegibleRow = z.infer<typeof usuarioElegibleRowSchema>;
