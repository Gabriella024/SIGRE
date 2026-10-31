
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

const allowedOrigins = (
  Deno.env.get("SIGRE_ALLOWED_ORIGINS") ?? ""
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Página pública de SIGRE que recibe el enlace de invitación (/activar-cuenta).
// Debe estar en las Redirect URLs de Auth; sin ella no se envían invitaciones.
const activationUrl = (() => {
  try {
    const url = new URL(Deno.env.get("SIGRE_ACTIVATION_URL") ?? "");
    return ["https:", "http:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
})();

const MENSAJE_INVITACION_ABIERTA =
  "Ya existe una invitación en curso o en revisión para este correo";

const MENSAJE_DOCUMENTO_INVITACION_ABIERTA =
  "Ya existe una invitación en curso o en revisión para este documento";

const INDICE_DOCUMENTO_ABIERTO = "sigre_invitaciones_documento_abierto_uk";

const CODIGOS_AUTH_CUENTA_EXISTENTE = new Set([
  "email_exists",
  "user_already_exists",
]);

// Rechazos de validación que Auth emite antes de crear la cuenta.
const CODIGOS_AUTH_RECHAZO = new Set([
  "email_address_invalid",
  "validation_failed",
]);

type ResultadoErrorAuth =
  | "cuenta_existente"
  | "rechazado"
  | "no_confirmado";

interface ErrorAuth {
  code?: string;
  status?: number;
  message: string;
}

function clasificarErrorAuth(error: ErrorAuth): ResultadoErrorAuth {
  if (error.code) {
    if (CODIGOS_AUTH_CUENTA_EXISTENTE.has(error.code)) {
      return "cuenta_existente";
    }

    return CODIGOS_AUTH_RECHAZO.has(error.code)
      ? "rechazado"
      : "no_confirmado";
  }

  // Versiones de Auth sin `code`: solo el 422 con este mensaje
  // confirma la cuenta existente.
  if (
    error.status === 422 &&
    /already been registered/i.test(error.message)
  ) {
    return "cuenta_existente";
  }

  return "no_confirmado";
}

function getHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Headers":
      "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };

  if (origin && allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}

function jsonResponse(
  status: number,
  body: unknown,
  origin: string | null,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: getHeaders(origin),
  });
}

async function actualizarSeguimiento(
  id: string,
  estadoEsperado: string,
  cambios: Record<string, unknown>,
): Promise<boolean> {
  try {
    const { data, error } = await admin
      .from("sigre_invitaciones")
      .update({ ...cambios, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("estado", estadoEsperado)
      .select("id");

    if (error || data?.length !== 1) {
      console.error(
        "A5: no se pudo actualizar el seguimiento",
        id,
        error?.message ?? `filas afectadas: ${data?.length ?? 0}`,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("A5: excepción al actualizar el seguimiento", id, error);
    return false;
  }
}

function respuestaInvitacionAbierta(
  porDocumento: boolean,
  origin: string | null,
) {
  return jsonResponse(
    409,
    porDocumento
      ? {
        error: MENSAJE_DOCUMENTO_INVITACION_ABIERTA,
        codigo: "DOCUMENTO_INVITACION_ABIERTA",
      }
      : {
        error: MENSAJE_INVITACION_ABIERTA,
        codigo: "INVITACION_ABIERTA",
      },
    origin,
  );
}

Deno.serve(async (request) => {
  const origin = request.headers.get("Origin");

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: origin && allowedOrigins.includes(origin) ? 204 : 403,
      headers: getHeaders(origin),
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      405,
      { error: "Método no permitido" },
      origin,
    );
  }

  if (origin && !allowedOrigins.includes(origin)) {
    return jsonResponse(
      403,
      { error: "Origen no autorizado" },
      origin,
    );
  }

  if (!activationUrl) {
    console.error("A5: falta SIGRE_ACTIVATION_URL válida");
    return jsonResponse(
      503,
      {
        error: "La activación de cuentas no está configurada",
        codigo: "ACTIVACION_NO_CONFIGURADA",
      },
      origin,
    );
  }

  let seguimientoId: string | null = null;

  try {
    const authorization =
      request.headers.get("Authorization") ?? "";

    if (!authorization.startsWith("Bearer ")) {
      return jsonResponse(
        401,
        { error: "Debe iniciar sesión" },
        origin,
      );
    }

    const token = authorization.substring(7);

    const { data: authData, error: authError } =
      await admin.auth.getUser(token);

    if (authError || !authData.user) {
      return jsonResponse(
        401,
        { error: "Sesión inválida" },
        origin,
      );
    }

    const actorId = authData.user.id;

    const userClient = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: authorization,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );

    const [roleResult, permissionResult] =
      await Promise.all([
        userClient.rpc("tiene_rol", {
          nombre_rol: "administrador",
        }),
        userClient.rpc("tiene_permiso", {
          p_modulo: "usuarios",
          p_accion: "crear",
        }),
      ]);

    if (
      roleResult.error ||
      permissionResult.error ||
      roleResult.data !== true ||
      permissionResult.data !== true
    ) {
      return jsonResponse(
        403,
        { error: "No autorizado para invitar usuarios" },
        origin,
      );
    }

    let payload: Record<string, unknown>;

    try {
      const parsed = await request.json();

      if (
        !parsed ||
        typeof parsed !== "object" ||
        Array.isArray(parsed)
      ) {
        throw new Error("Formato inválido");
      }

      payload = parsed;
    } catch {
      return jsonResponse(
        400,
        { error: "Datos JSON inválidos" },
        origin,
      );
    }

    const field = (name: string): string => {
      const value = payload[name];
      return typeof value === "string"
        ? value.trim()
        : "";
    };

    const correo = field("correo").toLowerCase();
    const primerNombre = field("primer_nombre");
    const segundoNombre = field("segundo_nombre");
    const primerApellido = field("primer_apellido");
    const segundoApellido = field("segundo_apellido");
    const tipoDocumento = field("tipo_documento");
    const numeroDocumento = field("numero_documento");
    const numeroTelefono = field("numero_telefono");

    const idRol = payload.id_rol;
    const idMunicipio = payload.id_municipio ?? null;

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) ||
      !primerNombre ||
      !primerApellido ||
      !tipoDocumento ||
      !numeroDocumento ||
      typeof idRol !== "number" ||
      !Number.isInteger(idRol) ||
      ![1, 2, 5].includes(idRol) ||
      (
        idMunicipio !== null &&
        (
          typeof idMunicipio !== "number" ||
          !Number.isInteger(idMunicipio)
        )
      )
    ) {
      return jsonResponse(
        400,
        { error: "Datos obligatorios o rol inválidos" },
        origin,
      );
    }

    const { data: rol, error: rolError } = await admin
      .from("roles")
      .select("id")
      .eq("id", idRol)
      .eq("estado", "activo")
      .is("deleted_at", null)
      .maybeSingle();

    if (rolError || !rol) {
      return jsonResponse(
        400,
        { error: "El rol no está disponible" },
        origin,
      );
    }

    if (idMunicipio !== null) {
      const { data: municipio, error: municipioError } =
        await admin
          .from("municipios")
          .select("id")
          .eq("id", idMunicipio)
          .eq("esta_activo", true)
          .maybeSingle();

      if (municipioError || !municipio) {
        return jsonResponse(
          400,
          { error: "Municipio no válido" },
          origin,
        );
      }
    }

    const [
      correoResult,
      documentoResult,
      invitacionResult,
      invitacionDocumentoResult,
    ] =
      await Promise.all([
        admin
          .from("usuarios")
          .select("id")
          .eq("correo_electronico", correo)
          .limit(1),
        admin
          .from("usuarios")
          .select("id")
          .eq("numero_documento", numeroDocumento)
          .limit(1),
        admin
          .from("sigre_invitaciones")
          .select("id")
          .eq("correo_electronico", correo)
          .in("estado", ["pendiente", "requiere_revision"])
          .limit(1),
        admin
          .from("sigre_invitaciones")
          .select("id")
          .eq("numero_documento", numeroDocumento)
          .in("estado", ["pendiente", "requiere_revision"])
          .limit(1),
      ]);

    if (
      correoResult.error ||
      documentoResult.error ||
      invitacionResult.error ||
      invitacionDocumentoResult.error
    ) {
      return jsonResponse(
        500,
        { error: "No se pudieron verificar duplicados" },
        origin,
      );
    }

    if ((correoResult.data?.length ?? 0) > 0) {
      return jsonResponse(
        409,
        {
          error: "El correo ya está registrado en SIGRE",
          codigo: "CORREO_REGISTRADO",
        },
        origin,
      );
    }

    if ((documentoResult.data?.length ?? 0) > 0) {
      return jsonResponse(
        409,
        {
          error: "El documento ya está registrado en SIGRE",
          codigo: "DOCUMENTO_REGISTRADO",
        },
        origin,
      );
    }

    if ((invitacionResult.data?.length ?? 0) > 0) {
      return respuestaInvitacionAbierta(false, origin);
    }

    if ((invitacionDocumentoResult.data?.length ?? 0) > 0) {
      return respuestaInvitacionAbierta(true, origin);
    }

    // Los índices únicos parciales sobre invitaciones abiertas
    // bloquean solicitudes concurrentes por correo y documento.
    const { data: seguimiento, error: seguimientoError } = await admin
      .from("sigre_invitaciones")
      .insert({
        correo_electronico: correo,
        numero_documento: numeroDocumento,
        id_administrador: actorId,
        id_rol: idRol,
        estado: "pendiente",
      })
      .select("id")
      .single();

    if (seguimientoError || !seguimiento) {
      if (seguimientoError?.code === "23505") {
        const porDocumento = `${seguimientoError.message} ${seguimientoError.details ?? ""}`
          .includes(INDICE_DOCUMENTO_ABIERTO);

        return respuestaInvitacionAbierta(porDocumento, origin);
      }

      console.error(
        "A5: no se pudo crear el seguimiento",
        seguimientoError?.message,
      );

      return jsonResponse(
        500,
        { error: "No se pudo registrar la invitación" },
        origin,
      );
    }

    seguimientoId = seguimiento.id as string;

    // Sin reintentos: Auth puede fallar después de crear la cuenta.
    let invitedUserId: string | null = null;
    let invitationError: ErrorAuth | null = null;

    try {
      const { data, error } =
        await admin.auth.admin.inviteUserByEmail(correo, {
          redirectTo: activationUrl,
        });
      invitedUserId = data?.user?.id ?? null;
      invitationError = error;
    } catch (error) {
      invitationError = {
        message: error instanceof Error ? error.message : String(error),
      };
    }

    if (invitationError || !invitedUserId) {
      const resultado: ResultadoErrorAuth = invitationError
        ? clasificarErrorAuth(invitationError)
        : "no_confirmado";

      const detalle =
        invitationError?.code ??
        invitationError?.status?.toString() ??
        (invitationError ? "excepcion" : "sin_usuario");

      console.error(
        "A5: error de invitación en Auth",
        seguimientoId,
        resultado,
        detalle,
        invitationError?.message,
      );

      await actualizarSeguimiento(seguimientoId, "pendiente", {
        estado: "requiere_revision",
        codigo_error: `auth_${resultado}:${detalle}`,
      });

      if (resultado === "cuenta_existente") {
        return jsonResponse(
          409,
          {
            error:
              "El correo ya tiene una cuenta de acceso. La invitación quedó en revisión administrativa.",
            codigo: "AUTH_CUENTA_EXISTENTE",
            requiere_revision: true,
          },
          origin,
        );
      }

      if (resultado === "rechazado") {
        return jsonResponse(
          422,
          {
            error:
              "El servicio de autenticación rechazó el correo. La invitación quedó en revisión administrativa.",
            codigo: "AUTH_RECHAZADO",
            requiere_revision: true,
          },
          origin,
        );
      }

      return jsonResponse(
        502,
        {
          error:
            "No se pudo confirmar la invitación. Quedó en revisión administrativa; no la reintente.",
          codigo: "AUTH_NO_CONFIRMADO",
          requiere_revision: true,
        },
        origin,
      );
    }

    const newUserId = invitedUserId;

    await actualizarSeguimiento(seguimientoId, "pendiente", {
      id_usuario_auth: newUserId,
    });

    // Registrar perfil, rol y auditoría en una sola
    // transacción SQL mediante la RPC de A5.
    const { data: registeredUserId, error: registrationError } =
      await admin.rpc("sigre_registrar_usuario_invitado", {
        p_id_usuario: newUserId,
        p_id_administrador: actorId,
        p_correo: correo,
        p_primer_nombre: primerNombre,
        p_segundo_nombre: segundoNombre,
        p_primer_apellido: primerApellido,
        p_segundo_apellido: segundoApellido,
        p_tipo_documento: tipoDocumento,
        p_numero_documento: numeroDocumento,
        p_numero_telefono: numeroTelefono,
        p_id_municipio: idMunicipio,
        p_id_rol: idRol,
      });

    if (
      registrationError ||
      registeredUserId !== newUserId
    ) {
      console.error(
        "A5: registro SQL fallido",
        newUserId,
        registrationError?.code,
        registrationError?.message,
      );

      await actualizarSeguimiento(seguimientoId, "pendiente", {
        estado: "requiere_revision",
        codigo_error: `registro_sql:${registrationError?.code ?? "id_distinto"}`,
      });

      return jsonResponse(
        500,
        {
          error:
            "Invitación enviada, pero el registro en SIGRE no se completó",
          codigo: "REGISTRO_INCOMPLETO",
          id_usuario: newUserId,
          requiere_revision: true,
        },
        origin,
      );
    }

    const completada = await actualizarSeguimiento(
      seguimientoId,
      "pendiente",
      { estado: "completada", id_usuario_auth: newUserId },
    );

    if (!completada) {
      await actualizarSeguimiento(seguimientoId, "pendiente", {
        estado: "requiere_revision",
        codigo_error: "seguimiento_no_completado",
      });

      return jsonResponse(
        500,
        {
          error:
            "El usuario quedó registrado, pero el seguimiento de la invitación no se cerró. Quedó en revisión administrativa.",
          codigo: "SEGUIMIENTO_INCOMPLETO",
          id_usuario: newUserId,
          requiere_revision: true,
        },
        origin,
      );
    }

    return jsonResponse(
      201,
      {
        mensaje: "Invitación creada correctamente",
        id_usuario: newUserId,
        estado: "invitado",
      },
      origin,
    );
  } catch (error) {
    console.error("Error interno de A5:", seguimientoId, error);

    if (seguimientoId) {
      await actualizarSeguimiento(seguimientoId, "pendiente", {
        estado: "requiere_revision",
        codigo_error: "excepcion_interna",
      });
    }

    return jsonResponse(
      500,
      {
        error: "Error interno del servidor",
        requiere_revision: seguimientoId !== null,
      },
      origin,
    );
  }
});
