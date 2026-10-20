import { z } from "zod";

export const PROYECTO_COLUMNS =
  "id, titulo, sector_economico, estado_proyecto, etapa_actual, created_at, id_emprendedor_fk, emprendedor:emprendedores(nombre_completo)";

export const proyectoRowSchema = z.object({
  id: z.string(),
  titulo: z.string(),
  sector_economico: z.string().nullable(),
  estado_proyecto: z.string().nullable(),
  etapa_actual: z.string().nullable(),
  created_at: z.string(),
  id_emprendedor_fk: z.string().nullable(),
  emprendedor: z.object({ nombre_completo: z.string() }).nullable(),
});

export type ProyectoRow = z.infer<typeof proyectoRowSchema>;

export const PROYECTO_EXPORT_COLUMNS = `${PROYECTO_COLUMNS}, updated_at`;

export const proyectoExportRowSchema = proyectoRowSchema.extend({
  updated_at: z.string().nullable(),
});

export type ProyectoExportRow = z.infer<typeof proyectoExportRowSchema>;

export const PROYECTO_DETAIL_COLUMNS =
  "id, titulo, descripcion, sector_economico, problema_oportunidad, propuesta_valor, estado_proyecto, etapa_actual, observaciones, created_at, updated_at, id_emprendedor_fk, emprendedor:emprendedores(nombre_completo)";

export const proyectoDetailRowSchema = proyectoRowSchema.extend({
  descripcion: z.string().nullable(),
  problema_oportunidad: z.string().nullable(),
  propuesta_valor: z.string().nullable(),
  observaciones: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export type ProyectoDetailRow = z.infer<typeof proyectoDetailRowSchema>;

export const DEFAULT_PROYECTO_ESTADO = "borrador";

export const projectFormSchema = z.object({
  id_emprendedor_fk: z
    .string()
    .trim()
    .min(1, { message: "Debes asociar un emprendedor al proyecto.", abort: true })
    .pipe(z.uuid("El emprendedor seleccionado no es válido.")),
  titulo: z.string().trim().min(1, "El título del proyecto es obligatorio."),
  descripcion: z.string().trim(),
  sector_economico: z.string().trim(),
  problema_oportunidad: z.string().trim(),
  propuesta_valor: z.string().trim(),
  observaciones: z.string().trim(),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

export const crearProyectoResultSchema = z.uuid();

export const projectEditFormSchema = projectFormSchema.extend({
  id_emprendedor_fk: z.string(),
});

const nullableText = z.string().nullable();

export const editarProyectoInputSchema = z.object({
  idProyecto: z.uuid("El identificador del proyecto no es válido."),
  updatedAtEsperado: z
    .string()
    .min(1, "El proyecto no tiene una versión registrada y no puede editarse.")
    .refine((value) => !Number.isNaN(Date.parse(value)), "La versión del proyecto no es válida."),
  titulo: z.string().trim().min(1, "El título del proyecto es obligatorio."),
  descripcion: nullableText,
  sectorEconomico: nullableText,
  problemaOportunidad: nullableText,
  propuestaValor: nullableText,
  observaciones: nullableText,
});

export const editarProyectoResultSchema = z.uuid();

export const eliminarProyectoInputSchema = z.object({
  idProyecto: z.uuid("El identificador del proyecto no es válido."),
  updatedAtEsperado: z
    .string()
    .min(1, "El proyecto no tiene una versión registrada y no puede eliminarse.")
    .refine((value) => !Number.isNaN(Date.parse(value)), "La versión del proyecto no es válida."),
});

export const eliminarProyectoResultSchema = z.uuid();
