import { supabase } from "@/lib/supabase";

import { inscribirEnJornadaResultSchema } from "../schemas/enrollmentSchema";

import type { InscribirEmprendedorInput } from "../types/orientations";

type DbError = { code?: string; message: string };

function toEnrollmentError(error: DbError): Error {
  switch (error.code) {
    case "42501":
      return new Error("No tienes autorización para inscribir emprendedores en esta jornada.");
    case "23505":
      return new Error("El emprendedor ya tiene una inscripción activa en esta jornada.");
    case "22023":
      return new Error(`No es posible realizar la inscripción: ${error.message}`);
    case "PGRST202":
      return new Error("La función de inscripción no está disponible en la base de datos.");
    default:
      return new Error(`No fue posible realizar la inscripción. ${error.message}`);
  }
}

export async function inscribirEmprendedor(input: InscribirEmprendedorInput): Promise<string> {
  const { data, error } = await supabase.rpc("sigre_inscribir_en_jornada", {
    p_orientacion_id: input.orientacionId,
    p_emprendedor_id: input.emprendedorId,
  });

  if (error) throw toEnrollmentError(error);

  const parsed = inscribirEnJornadaResultSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("La respuesta de la inscripción no tiene el formato esperado.");
  }

  return parsed.data;
}
