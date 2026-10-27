import { z } from "zod";

import { supabase } from "@/lib/supabase";

import { orientadorElegibleRowSchema } from "../schemas/entrepreneursSchema";
import { isNetworkError, NETWORK_ERROR_MESSAGE, type DbError } from "../utils/dbError";
import { toOrientadorElegible } from "../utils/entrepreneurUtils";

import type { OrientadorElegible } from "../types/entrepreneur";

function toOrientadoresError(error: DbError): Error {
  if (isNetworkError(error)) return new Error(NETWORK_ERROR_MESSAGE);

  switch (error.code) {
    case "42501":
      return new Error("No tienes autorización para consultar orientadores.");
    case "PGRST202":
      return new Error("La función de orientadores elegibles no está disponible en este momento.");
    default:
      return new Error("No fue posible cargar los orientadores elegibles.");
  }
}

export async function getOrientadoresElegibles(): Promise<OrientadorElegible[]> {
  const { data, error } = await supabase.rpc("sigre_listar_orientadores_elegibles");

  if (error) throw toOrientadoresError(error);

  const parsed = z.array(orientadorElegibleRowSchema).safeParse(data);

  if (!parsed.success) {
    throw new Error("La respuesta de orientadores elegibles no tiene el formato esperado.");
  }

  return parsed.data
    .map(toOrientadorElegible)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
