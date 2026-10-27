import { z } from "zod";

export const USUARIO_RESUMEN_COLUMNS =
  "id, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo_electronico, estado, deleted_at";

export const usuarioResumenRowSchema = z.object({
  id: z.string(),
  primer_nombre: z.string().nullable(),
  segundo_nombre: z.string().nullable(),
  primer_apellido: z.string().nullable(),
  segundo_apellido: z.string().nullable(),
  correo_electronico: z.string().nullable(),
  estado: z.string().nullable(),
  deleted_at: z.string().nullable(),
});

export type UsuarioResumenRow = z.infer<typeof usuarioResumenRowSchema>;

export const USUARIO_CONTACTO_COLUMNS = `${USUARIO_RESUMEN_COLUMNS}, numero_telefono, tipo_documento, numero_documento`;

export const usuarioContactoRowSchema = usuarioResumenRowSchema.extend({
  numero_telefono: z.string().nullable(),
  tipo_documento: z.string().nullable(),
  numero_documento: z.string().nullable(),
});

export type UsuarioContactoRow = z.infer<typeof usuarioContactoRowSchema>;

export const EMPRENDEDOR_COLUMNS = `id, nombre_completo, centro_sena, programa_formacion, nivel_formacion, tipo_emprendedor, segmentacion, estado, created_at, id_orientador_fk, orientador:usuarios!id_orientador_fk(${USUARIO_RESUMEN_COLUMNS})`;

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
  id_orientador_fk: z.string().nullable(),
  orientador: usuarioResumenRowSchema.nullable(),
});

export type EmprendedorRow = z.infer<typeof emprendedorRowSchema>;

export const EMPRENDEDOR_DETAIL_COLUMNS = `${EMPRENDEDOR_COLUMNS}, updated_at, usuario_id, id_centro_sena_fk, usuario:usuarios!usuario_id(${USUARIO_CONTACTO_COLUMNS})`;

export const emprendedorDetailRowSchema = emprendedorRowSchema.extend({
  updated_at: z.string().nullable(),
  usuario_id: z.string().nullable(),
  id_centro_sena_fk: z.string().nullable(),
  usuario: usuarioContactoRowSchema.nullable(),
});

export type EmprendedorDetailRow = z.infer<typeof emprendedorDetailRowSchema>;

export const entrepreneurIdSchema = z.guid();

export const DEFAULT_EMPRENDEDOR_ESTADO = "activo";

const optionalText = z.string().trim();

const requiredUuid = (required: string, invalid: string) =>
  z.string().trim().min(1, { message: required, abort: true }).pipe(z.uuid(invalid));

export const entrepreneurFormSchema = z.object({
  usuario_id: requiredUuid("Debes seleccionar el usuario del emprendedor.", "El usuario seleccionado no es válido."),
  nombre_completo: z
    .string()
    .trim()
    .min(1, "El nombre completo es obligatorio."),
  id_centro_sena_fk: requiredUuid("Debes seleccionar el centro SENA.", "El centro SENA seleccionado no es válido."),
  programa_formacion: optionalText,
  nivel_formacion: optionalText,
  tipo_emprendedor: optionalText,
  segmentacion: optionalText,
});

export type EntrepreneurFormValues = z.infer<typeof entrepreneurFormSchema>;

export const EMPTY_ENTREPRENEUR_FORM: EntrepreneurFormValues = {
  usuario_id: "",
  nombre_completo: "",
  id_centro_sena_fk: "",
  programa_formacion: "",
  nivel_formacion: "",
  tipo_emprendedor: "",
  segmentacion: "",
};

export const crearEmprendedorResultSchema = z.uuid();

export const entrepreneurEditFormSchema = entrepreneurFormSchema.omit({ usuario_id: true });

export type EntrepreneurEditFormValues = z.infer<typeof entrepreneurEditFormSchema>;

const nullableText = z.string().nullable();

const idEmprendedorSchema = z.guid("El identificador del emprendedor no es válido.");

const updatedAtEsperadoSchema = z
  .string()
  .min(1, "El emprendedor no tiene una versión registrada y no puede editarse.")
  .refine((value) => !Number.isNaN(Date.parse(value)), "La versión del emprendedor no es válida.");

export const editarEmprendedorInputSchema = z.object({
  idEmprendedor: idEmprendedorSchema,
  updatedAtEsperado: updatedAtEsperadoSchema,
  nombreCompleto: z.string().refine((value) => value.trim() !== "", "El nombre completo es obligatorio."),
  idCentroSena: z.uuid("El centro SENA seleccionado no es válido."),
  programaFormacion: nullableText,
  nivelFormacion: nullableText,
  tipoEmprendedor: nullableText,
  segmentacion: nullableText,
});

export const editarEmprendedorResultSchema = z.uuid();

export const centroSenaRowSchema = z.object({
  id: z.uuid(),
  codigo: z.string().nullable(),
  nombre: z.string(),
});

export type CentroSenaRow = z.infer<typeof centroSenaRowSchema>;

export const usuarioElegibleRowSchema = z.object({
  usuario_id: z.uuid(),
  nombre_completo: z.string(),
  correo_electronico: z.string(),
});

export type UsuarioElegibleRow = z.infer<typeof usuarioElegibleRowSchema>;

export const orientadorElegibleRowSchema = z.object({
  id: z.guid(),
  nombre: z.string(),
  correo: z.string(),
});

export type OrientadorElegibleRow = z.infer<typeof orientadorElegibleRowSchema>;

export const orientadorAssignmentFormSchema = z.object({
  id_orientador: z
    .string()
    .trim()
    .min(1, { message: "Debes seleccionar un orientador.", abort: true })
    .pipe(z.guid("El orientador seleccionado no es válido.")),
});

export type OrientadorAssignmentFormValues = z.infer<typeof orientadorAssignmentFormSchema>;

export const asignarOrientadorInputSchema = z.object({
  idEmprendedor: idEmprendedorSchema,
  updatedAtEsperado: updatedAtEsperadoSchema,
  idOrientador: z.guid("El orientador seleccionado no es válido.").nullable(),
});

export const asignarOrientadorResultSchema = z.guid();

export const entrepreneurStatusSchema = z.enum(["activo", "inactivo"], "El estado solicitado no es válido.");

const justificacionSchema = z.string().trim().min(1, "La justificación es obligatoria.");

export const entrepreneurStatusFormSchema = z.object({
  justificacion: justificacionSchema,
});

export type EntrepreneurStatusFormValues = z.infer<typeof entrepreneurStatusFormSchema>;

export const cambiarEstadoInputSchema = z.object({
  idEmprendedor: idEmprendedorSchema,
  updatedAtEsperado: updatedAtEsperadoSchema,
  estadoNuevo: entrepreneurStatusSchema,
  justificacion: justificacionSchema,
});

export const cambiarEstadoResultSchema = z.guid();

const telefonoSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || /^[0-9+()\s-]{7,20}$/.test(value), {
    message: "El teléfono debe tener entre 7 y 20 caracteres: dígitos, espacios, +, -, ( o ).",
  });

const nombreCompletoSchema = z.string().trim().min(1, "El nombre completo es obligatorio.");

export const orientadorEntrepreneurEditFormSchema = z.object({
  numero_telefono: telefonoSchema,
  programa_formacion: optionalText,
  nivel_formacion: optionalText,
  tipo_emprendedor: optionalText,
  segmentacion: optionalText,
});

export type OrientadorEntrepreneurEditFormValues = z.infer<typeof orientadorEntrepreneurEditFormSchema>;

export const ownEntrepreneurEditFormSchema = z.object({
  nombre_completo: nombreCompletoSchema,
  numero_telefono: telefonoSchema,
  programa_formacion: optionalText,
  nivel_formacion: optionalText,
});

export type OwnEntrepreneurEditFormValues = z.infer<typeof ownEntrepreneurEditFormSchema>;

export const orientadorEntrepreneurEditInputSchema = z.object({
  idEmprendedor: idEmprendedorSchema,
  updatedAtEsperado: updatedAtEsperadoSchema,
  numeroTelefono: nullableText,
  programaFormacion: nullableText,
  nivelFormacion: nullableText,
  tipoEmprendedor: nullableText,
  segmentacion: nullableText,
});

export const roleEditResultSchema = z.guid();

export const ownEntrepreneurEditInputSchema = z.object({
  idEmprendedor: idEmprendedorSchema,
  updatedAtEsperado: updatedAtEsperadoSchema,
  nombreCompleto: nombreCompletoSchema,
  numeroTelefono: nullableText,
  programaFormacion: nullableText,
  nivelFormacion: nullableText,
});
