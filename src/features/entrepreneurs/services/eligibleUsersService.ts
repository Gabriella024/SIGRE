import { z } from "zod";

import { supabase } from "@/lib/supabase";

import { usuarioElegibleRowSchema } from "../schemas/entrepreneursSchema";
import { toEligibleEntrepreneurUser } from "../utils/entrepreneurUtils";

import type { EligibleEntrepreneurUser } from "../types/entrepreneur";

type DbError = { code?: string; message: string };

function toEligibleUsersError(error: DbError): Error {
  switch (error.code) {
    case "42501":
      return new Error("No tienes autorización para consultar usuarios elegibles.");
    case "PGRST202":
      return new Error("La función de usuarios elegibles no está disponible en la base de datos.");
    default:
      return new Error(`No fue posible cargar los usuarios elegibles. ${error.message}`);
  }
}

export async function getEligibleEntrepreneurUsers(): Promise<EligibleEntrepreneurUser[]> {
  const { data, error } = await supabase.rpc("sigre_listar_usuarios_elegibles_emprendedor");

  if (error) throw toEligibleUsersError(error);

  const parsed = z.array(usuarioElegibleRowSchema).safeParse(data);

  if (!parsed.success) {
    throw new Error("La respuesta de usuarios elegibles no tiene el formato esperado.");
  }

  return parsed.data
    .map(toEligibleEntrepreneurUser)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
