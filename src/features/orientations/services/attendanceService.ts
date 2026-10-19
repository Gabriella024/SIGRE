import { z } from "zod";

import { supabase } from "@/lib/supabase";

import { inscritoAsistenciaRowSchema, registrarAsistenciaResultSchema } from "../schemas/attendanceSchema";
import { toInscritoAsistencia } from "../utils/orientationUtils";

import type { InscritoAsistencia, RegistrarAsistenciaInput } from "../types/orientations";

type DbError = { code?: string; message: string };

function toAttendanceError(error: DbError, fallback: string): Error {
  switch (error.code) {
    case "42501":
      return new Error("No tienes autorización para gestionar la asistencia de esta jornada.");
    case "22023":
      return new Error(`Datos no válidos: ${error.message}`);
    case "PGRST202":
      return new Error("La función de asistencias no está disponible en la base de datos.");
    default:
      return new Error(`${fallback} ${error.message}`);
  }
}

export async function getInscritosAsistencia(orientacionId: string): Promise<InscritoAsistencia[]> {
  const { data, error } = await supabase.rpc("sigre_listar_inscritos_asistencia", {
    p_orientacion_id: orientacionId,
  });

  if (error) throw toAttendanceError(error, "No fue posible cargar los inscritos.");

  const parsed = z.array(inscritoAsistenciaRowSchema).safeParse(data);

  if (!parsed.success) {
    throw new Error("La respuesta de inscritos no tiene el formato esperado.");
  }

  return parsed.data.map(toInscritoAsistencia);
}

export async function registrarAsistencia(input: RegistrarAsistenciaInput): Promise<string> {
  const { data, error } = await supabase.rpc("sigre_registrar_asistencia", {
    p_orientacion_id: input.orientacionId,
    p_emprendedor_id: input.emprendedorId,
    p_estado: input.estado,
    p_observacion: input.observacion ?? null,
  });

  if (error) throw toAttendanceError(error, "No fue posible registrar la asistencia.");

  const parsed = registrarAsistenciaResultSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("La respuesta del registro de asistencia no tiene el formato esperado.");
  }

  return parsed.data;
}
