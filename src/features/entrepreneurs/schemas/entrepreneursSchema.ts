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
