import { z } from "zod";

import { supabase } from "@/lib/supabase";

import { centroSenaRowSchema } from "../schemas/entrepreneursSchema";
import { isNetworkError, NETWORK_ERROR_MESSAGE, type DbError } from "../utils/dbError";
import { toCentroSena } from "../utils/entrepreneurUtils";

import type { CentroSena } from "../types/entrepreneur";

function toCentrosSenaError(error: DbError): Error {
  if (isNetworkError(error)) return new Error(NETWORK_ERROR_MESSAGE);

  switch (error.code) {
    case "42501":
      return new Error("No tienes autorización para consultar los centros SENA.");
    case "PGRST202":
      return new Error("El catálogo de centros SENA no está disponible en este momento.");
    default:
      return new Error("No fue posible cargar los centros SENA.");
  }
}

export async function getActiveCentrosSena(): Promise<CentroSena[]> {
  const { data, error } = await supabase.rpc("sigre_listar_centros_sena_activos");

  if (error) throw toCentrosSenaError(error);

  const parsed = z.array(centroSenaRowSchema).safeParse(data);

  if (!parsed.success) {
    throw new Error("La respuesta del catálogo de centros SENA no tiene el formato esperado.");
  }

  return parsed.data.map(toCentroSena).sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
