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
