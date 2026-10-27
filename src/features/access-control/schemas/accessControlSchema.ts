import { z } from "zod";

export const ROL_COLUMNS = "id, nombre_rol, estado";

export const rolRowSchema = z.object({
  id: z.number().int(),
  nombre_rol: z.string(),
  estado: z.string().nullable(),
});

export type RolRow = z.infer<typeof rolRowSchema>;

export const PANTALLA_ACCION_COLUMNS =
  "id, estado, pantalla:app_pantallas(id, codigo, nombre, orden, deleted_at, modulo:app_modulos(codigo, nombre)), accion:app_acciones(codigo, nombre)";

export const pantallaAccionRowSchema = z.object({
  id: z.string(),
  estado: z.string().nullable(),
  pantalla: z
    .object({
      id: z.string(),
      codigo: z.string(),
      nombre: z.string(),
      orden: z.number().nullable(),
      deleted_at: z.string().nullable(),
      modulo: z.object({ codigo: z.string(), nombre: z.string() }).nullable(),
    })
    .nullable(),
  accion: z.object({ codigo: z.string(), nombre: z.string() }).nullable(),
});

export type PantallaAccionRow = z.infer<typeof pantallaAccionRowSchema>;

export const ROL_PERMISO_COLUMNS = "id, id_rol_fk, id_pantalla_accion_fk, nivel_acceso, estado";

export const rolPermisoRowSchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  id_rol_fk: z.number().int(),
  id_pantalla_accion_fk: z.string(),
  nivel_acceso: z.string(),
  estado: z.string().nullable(),
});

export type RolPermisoRow = z.infer<typeof rolPermisoRowSchema>;
