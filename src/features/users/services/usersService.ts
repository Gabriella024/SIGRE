import { FunctionsHttpError } from "@supabase/supabase-js";
import { z } from "zod";

import { supabase } from "@/lib/supabase";
import { fetchAllPagesWithRetry, type PageResult } from "@/lib/pagination";
import {
  AdminOperationError,
  type AdminErrorCopy,
  parseOperationId,
  toAdminOperationError,
  toFunctionError,
  toQueryError,
} from "@/lib/adminOperation";
import { assertBackendAvailable } from "@/lib/backendContract";

import {
  USUARIO_ADMIN_COLUMNS,
  invitarUsuarioErrorSchema,
  invitarUsuarioResultSchema,
  usuarioAdminRowSchema,
} from "../schemas/userSchema";
import { toUser } from "../utils/userUtils";

import type {
  CambiarEstadoUsuarioAdminInput,
  EditarUsuarioAdminInput,
  InvitarUsuarioInput,
  User,
} from "../types/users";

const USERS_SUBJECT = "los usuarios";

async function getUsersPage(from: number, to: number): Promise<PageResult<User>> {
  const { data, error, count } = await supabase
    .from("usuarios")
    .select(USUARIO_ADMIN_COLUMNS, { count: "exact" })
    .is("deleted_at", null)
    .order("primer_nombre", { ascending: true })
    .order("id", { ascending: true })
    .range(from, to);

  if (error) throw toQueryError(error, USERS_SUBJECT);

  const parsed = z.array(usuarioAdminRowSchema).safeParse(data);
  if (!parsed.success) throw new Error("La respuesta de usuarios no tiene el formato esperado.");

  return { rows: parsed.data.map(toUser), total: count };
}

export function getAllUsers(): Promise<User[]> {
  return fetchAllPagesWithRetry(getUsersPage);
}

const USER_ERROR_COPY = {
  denied: "No tienes autorización para administrar usuarios.",
  notFound: "El usuario no existe o fue eliminado. Recarga el listado.",
  duplicate: "Ya existe un usuario con ese documento o correo.",
  reference: "El municipio seleccionado no es válido.",
};

export async function editarUsuarioAdmin(input: EditarUsuarioAdminInput): Promise<string> {
  const operation = "Editar usuario";
  assertBackendAvailable({ name: "sigre_admin_editar_usuario", operation });

  const { data, error } = await supabase.rpc("sigre_admin_editar_usuario", {
    p_id_usuario: input.idUsuario,
    p_updated_at_esperado: input.updatedAtEsperado,
    p_primer_nombre: input.primerNombre,
    p_segundo_nombre: input.segundoNombre,
    p_primer_apellido: input.primerApellido,
    p_segundo_apellido: input.segundoApellido,
    p_tipo_documento: input.tipoDocumento,
    p_numero_documento: input.numeroDocumento,
    p_numero_telefono: input.numeroTelefono,
    p_id_municipio: input.idMunicipio,
  });

  if (error) {
    throw toAdminOperationError(error, {
      ...USER_ERROR_COPY,
      operation,
      invalid: "Los datos del usuario no son válidos o no tienen cambios.",
      fallback: "No fue posible guardar los cambios del usuario. Inténtalo nuevamente más tarde.",
    });
  }

  return parseOperationId(data, operation);
}

export async function cambiarEstadoUsuarioAdmin(input: CambiarEstadoUsuarioAdminInput): Promise<string> {
  const operation = "Cambiar estado de usuario";
  assertBackendAvailable({ name: "sigre_admin_cambiar_estado_usuario", operation });

  const { data, error } = await supabase.rpc("sigre_admin_cambiar_estado_usuario", {
    p_id_usuario: input.idUsuario,
    p_updated_at_esperado: input.updatedAtEsperado,
    p_estado_nuevo: input.estadoNuevo,
    p_justificacion: input.justificacion,
  });

  if (error) {
    throw toAdminOperationError(error, {
      ...USER_ERROR_COPY,
      operation,
      invalid: "No se pudo aplicar el cambio: el estado no es válido, el usuario ya lo tiene o intentas cambiar tu propio estado.",
      fallback: "No fue posible cambiar el estado del usuario. Inténtalo nuevamente más tarde.",
    });
  }

  return parseOperationId(data, operation);
}

const REVIEW_NOTICE = "La solicitud quedó en revisión administrativa; no la reintentes.";

const INVITE_ERROR_MESSAGES: Record<string, string> = {
  CORREO_REGISTRADO: "Ya existe un usuario registrado con ese correo.",
  DOCUMENTO_REGISTRADO: "Ya existe un usuario registrado con ese documento.",
  INVITACION_ABIERTA: "Ya hay una invitación en curso o en revisión para ese correo.",
  DOCUMENTO_INVITACION_ABIERTA: "Ya hay una invitación en curso o en revisión para ese documento.",
  AUTH_CUENTA_EXISTENTE: `El correo ya tiene una cuenta de acceso. ${REVIEW_NOTICE}`,
  AUTH_RECHAZADO: `El servicio de autenticación rechazó el correo. ${REVIEW_NOTICE}`,
  AUTH_NO_CONFIRMADO: `No se pudo confirmar el envío de la invitación. ${REVIEW_NOTICE}`,
  REGISTRO_INCOMPLETO: `La invitación se envió, pero el registro en SIGRE no se completó. ${REVIEW_NOTICE}`,
  SEGUIMIENTO_INCOMPLETO: `El usuario quedó registrado, pero la invitación no se cerró. ${REVIEW_NOTICE}`,
  ACTIVACION_NO_CONFIGURADA: "La activación de cuentas no está configurada. No se envió ninguna invitación.",
};

async function toInviteError(error: unknown, copy: AdminErrorCopy): Promise<AdminOperationError> {
  if (error instanceof FunctionsHttpError && error.context instanceof Response) {
    const body: unknown = await error.context.clone().json().catch(() => null);
    const parsed = invitarUsuarioErrorSchema.safeParse(body);

    if (parsed.success) {
      const message = parsed.data.codigo ? INVITE_ERROR_MESSAGES[parsed.data.codigo] : undefined;
      if (message) return new AdminOperationError(message);
      if (parsed.data.requiere_revision) return new AdminOperationError(`Ocurrió un error inesperado. ${REVIEW_NOTICE}`);
    }
  }

  return toFunctionError(error, copy);
}

export async function invitarUsuarioAdmin(input: InvitarUsuarioInput): Promise<string> {
  const operation = "Invitar usuario";
  assertBackendAvailable({ name: "sigre-admin-invitar-usuario", operation });

  const copy = {
    ...USER_ERROR_COPY,
    operation,
    invalid: "Los datos de la invitación no son válidos.",
    duplicate: "Ya existe un usuario registrado con ese correo.",
    fallback: "No fue posible enviar la invitación. Inténtalo nuevamente más tarde.",
  };

  const { data, error } = await supabase.functions.invoke("sigre-admin-invitar-usuario", {
    body: {
      correo: input.correo,
      primer_nombre: input.primerNombre,
      segundo_nombre: input.segundoNombre,
      primer_apellido: input.primerApellido,
      segundo_apellido: input.segundoApellido,
      tipo_documento: input.tipoDocumento,
      numero_documento: input.numeroDocumento,
      numero_telefono: input.numeroTelefono,
      id_municipio: input.idMunicipio,
      id_rol: input.idRol,
    },
  });

  if (error) throw await toInviteError(error, copy);

  const parsed = invitarUsuarioResultSchema.safeParse(data);
  if (!parsed.success) throw new AdminOperationError(`La respuesta de "${operation}" no tiene el formato esperado.`);

  return parsed.data.id_usuario;
}
