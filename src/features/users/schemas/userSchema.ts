import { z } from "zod";

export const USUARIO_ADMIN_COLUMNS =
  "id, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, correo_electronico, numero_telefono, tipo_documento, numero_documento, id_municipio_fk, estado, ultimo_acceso, created_at, updated_at, municipio:municipios(nombre_municipio, departamento), usuario_roles(id, estado, deleted_at, rol:roles(id, nombre_rol))";

const usuarioRolRowSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  estado: z.string().nullable(),
  deleted_at: z.string().nullable(),
  rol: z.object({ id: z.number().int(), nombre_rol: z.string() }).nullable(),
});

export const usuarioAdminRowSchema = z.object({
  id: z.string(),
  primer_nombre: z.string().nullable(),
  segundo_nombre: z.string().nullable(),
  primer_apellido: z.string().nullable(),
  segundo_apellido: z.string().nullable(),
  correo_electronico: z.string().nullable(),
  numero_telefono: z.string().nullable(),
  tipo_documento: z.string().nullable(),
  numero_documento: z.string().nullable(),
  id_municipio_fk: z.number().int().nullable(),
  estado: z.string().nullable(),
  ultimo_acceso: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  municipio: z.object({ nombre_municipio: z.string(), departamento: z.string().nullable() }).nullable(),
  usuario_roles: z.array(usuarioRolRowSchema),
});

export type UsuarioAdminRow = z.infer<typeof usuarioAdminRowSchema>;

const optionalText = (max: number) =>
  z.string().trim().max(max, `Máximo ${max} caracteres.`);

const requiredName = (label: string) =>
  z.string().trim().min(1, `${label} es obligatorio.`).max(80, "Máximo 80 caracteres.");

const DOCUMENT_PATTERN = /^[A-Za-z0-9-]{4,20}$/;
const DOCUMENT_MESSAGE = "El documento debe tener entre 4 y 20 caracteres alfanuméricos.";

const phoneField = z
  .string()
  .trim()
  .refine((value) => value === "" || /^[0-9+()\s-]{7,20}$/.test(value), {
    message: "El teléfono debe tener entre 7 y 20 caracteres: dígitos, espacios, +, -, ( o ).",
  });

const municipioField = z.string().refine((value) => value === "" || /^\d+$/.test(value), {
  message: "El municipio seleccionado no es válido.",
});

export const userEditFormSchema = z.object({
  primer_nombre: requiredName("El primer nombre"),
  segundo_nombre: optionalText(80),
  primer_apellido: requiredName("El primer apellido"),
  segundo_apellido: optionalText(80),
  tipo_documento: optionalText(20),
  numero_documento: z
    .string()
    .trim()
    .refine((value) => value === "" || DOCUMENT_PATTERN.test(value), { message: DOCUMENT_MESSAGE }),
  numero_telefono: phoneField,
  id_municipio: municipioField,
});

export type UserEditFormValues = z.infer<typeof userEditFormSchema>;

export const userStatusFormSchema = z.object({
  justificacion: z.string().trim().min(1, "La justificación es obligatoria.").max(500, "Máximo 500 caracteres."),
});

export type UserStatusFormValues = z.infer<typeof userStatusFormSchema>;

export const INVITABLE_ROLE_IDS: readonly number[] = [1, 2, 5];

export const userInviteFormSchema = z.object({
  correo: z.string().trim().min(1, "El correo es obligatorio.").pipe(z.email("El correo no es válido.")),
  primer_nombre: requiredName("El primer nombre"),
  segundo_nombre: optionalText(80),
  primer_apellido: requiredName("El primer apellido"),
  segundo_apellido: optionalText(80),
  tipo_documento: z.string().trim().min(1, "El tipo de documento es obligatorio.").max(20, "Máximo 20 caracteres."),
  numero_documento: z
    .string()
    .trim()
    .min(1, "El número de documento es obligatorio.")
    .regex(DOCUMENT_PATTERN, DOCUMENT_MESSAGE),
  numero_telefono: phoneField,
  id_municipio: municipioField,
  id_rol: z
    .string()
    .min(1, "Debes seleccionar un rol.")
    .refine((value) => /^\d+$/.test(value) && INVITABLE_ROLE_IDS.includes(Number(value)), {
      message: "El rol seleccionado no se puede asignar por invitación.",
    }),
});

export type UserInviteFormValues = z.infer<typeof userInviteFormSchema>;

export const invitarUsuarioResultSchema = z.object({ id_usuario: z.guid() });

export const invitarUsuarioErrorSchema = z.object({
  codigo: z.string().optional(),
  requiere_revision: z.boolean().optional(),
});
