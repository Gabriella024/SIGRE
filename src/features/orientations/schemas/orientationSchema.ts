import { z } from "zod";

export const ORIENTACION_COLUMNS =
  "id, tema, fecha, hora_inicio, hora_fin, modalidad, lugar_link, audiencia_esperada, estado";

export const orientacionRowSchema = z.object({
  id: z.string(),
  tema: z.string(),
  fecha: z.string(),
  hora_inicio: z.string(),
  hora_fin: z.string(),
  modalidad: z.string().nullable(),
  lugar_link: z.string().nullable(),
  audiencia_esperada: z.string().nullable(),
  estado: z.string(),
});

export type OrientacionRow = z.infer<typeof orientacionRowSchema>;
