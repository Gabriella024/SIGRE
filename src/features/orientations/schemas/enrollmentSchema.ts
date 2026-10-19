import { z } from "zod";

export const inscribirEnJornadaResultSchema = z.uuid();

export const enrollmentFormSchema = z.object({
  orientacionId: z.string().min(1, "Selecciona una jornada."),
  emprendedorId: z.string().min(1, "Selecciona un emprendedor."),
});

export type EnrollmentFormValues = z.infer<typeof enrollmentFormSchema>;
