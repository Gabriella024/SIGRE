// Parámetros que Supabase Auth agrega al volver de un enlace de invitación o recuperación (flujo implícito).
export type TipoEnlaceAuth = "invite" | "recovery";

export interface RedireccionAuth {
  tipo: TipoEnlaceAuth | null;
  error: string | null;
}

const TIPOS_ACTIVACION: readonly string[] = ["invite", "recovery"];

const MENSAJES_ERROR: Readonly<Record<string, string>> = {
  otp_expired: "El enlace expiró o ya fue usado. Solicita a un administrador una nueva invitación.",
  access_denied: "El enlace no es válido. Solicita a un administrador una nueva invitación.",
};

export function parseAuthRedirect(hash: string, search = ""): RedireccionAuth {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  new URLSearchParams(search.replace(/^\?/, "")).forEach((valor, clave) => {
    if (!params.has(clave)) params.set(clave, valor);
  });

  const codigoError = params.get("error_code") ?? params.get("error");
  if (codigoError || params.get("error_description")) {
    return {
      tipo: null,
      error: (codigoError && MENSAJES_ERROR[codigoError]) ?? "No fue posible validar el enlace. Solicita una nueva invitación.",
    };
  }

  const tipo = params.get("type");
  return {
    tipo: tipo && TIPOS_ACTIVACION.includes(tipo) && params.get("access_token") ? (tipo as TipoEnlaceAuth) : null,
    error: null,
  };
}
