
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

    function field(name: string): string {
      const value = payload[name];
      return typeof value === "string"
        ? value.trim()
        : "";
    }

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

    const { data: correoExistente, error: correoError } =
      await admin
        .from("usuarios")
        .select("id")
        .eq("correo_electronico", correo)
        .limit(1);

    const { data: documentoExistente, error: documentoError } =
      await admin
        .from("usuarios")
        .select("id")
        .eq("numero_documento", numeroDocumento)
        .limit(1);

    if (correoError || documentoError) {
      return jsonResponse(
        500,
        { error: "No se pudieron verificar duplicados" },
        origin,
      );
    }

    if (
      (correoExistente?.length ?? 0) > 0 ||
      (documentoExistente?.length ?? 0) > 0
    ) {
      return jsonResponse(
        409,
        { error: "Correo o documento ya registrado" },
        origin,
      );
    }

    // Crear la invitación en Supabase Auth.
    const { data: invitation, error: invitationError } =
      await admin.auth.admin.inviteUserByEmail(correo);

    if (invitationError || !invitation.user) {
      console.error(
        "Error de invitación:",
        invitationError?.message,
      );

      return jsonResponse(
        409,
        {
          error:
            "No se pudo crear la invitación. Revisar Auth.",
        },
        origin,
      );
    }

    const newUserId = invitation.user.id;

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
        registrationError?.message,
      );

      return jsonResponse(
        500,
        {
          error:
            "Invitación enviada, pero el registro en SIGRE no se completó",
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
    console.error("Error interno de A5:", error);

    return jsonResponse(
      500,
      { error: "Error interno del servidor" },
      origin,
    );
  }
});
