import { useCallback } from "react";

import { SCREEN_CODES } from "@/features/access-control/constants/screens";
import { useAccessControl } from "@/features/access-control/hooks/useAccessControl";
import { useAdminMutation } from "@/hooks/useAdminMutation";
import { useUserScopedQuery } from "@/hooks/useUserScopedQuery";
import { AdminOperationError } from "@/lib/adminOperation";

import { userEditFormSchema, userInviteFormSchema, userStatusFormSchema } from "../schemas/userSchema";
import { cambiarEstadoUsuarioAdmin, editarUsuarioAdmin, getAllUsers, invitarUsuarioAdmin } from "../services/usersService";
import { MISSING_VERSION_MESSAGE, toEditarUsuarioAdminInput } from "../utils/userUtils";

import type { UserEditFormValues, UserInviteFormValues } from "../schemas/userSchema";
import type { User, UserStatusTarget } from "../types/users";

export function useUsers() {
  return useUserScopedQuery(getAllUsers);
}

export function useUserAccess() {
  const { can } = useAccessControl();
  const screen = SCREEN_CODES.usuarios;

  return {
    canCreate: can("usuarios", "crear", screen),
    canEdit: can("usuarios", "editar", screen),
  };
}

function validated<T>(result: { success: true; data: T } | { success: false; error: { issues: Array<{ message: string }> } }): T {
  if (!result.success) throw new AdminOperationError(result.error.issues[0]?.message ?? "Los datos no son válidos.");
  return result.data;
}

const DENIED = "No tienes autorización para administrar usuarios.";

export function useUserMutations() {
  const { canCreate, canEdit } = useUserAccess();

  const editOperation = useCallback(async (user: User, values: UserEditFormValues) => {
    if (!user.updatedAt) throw new AdminOperationError(MISSING_VERSION_MESSAGE);
    const parsed = validated(userEditFormSchema.safeParse(values));
    return editarUsuarioAdmin(toEditarUsuarioAdminInput(user, user.updatedAt, parsed));
  }, []);

  const statusOperation = useCallback(async (target: UserStatusTarget, justificacion: string) => {
    const parsed = validated(userStatusFormSchema.safeParse({ justificacion }));
    return cambiarEstadoUsuarioAdmin({
      idUsuario: target.id,
      updatedAtEsperado: target.updatedAt,
      estadoNuevo: target.estadoNuevo,
      justificacion: parsed.justificacion,
    });
  }, []);

  const inviteOperation = useCallback(async (values: UserInviteFormValues) => {
    const parsed = validated(userInviteFormSchema.safeParse(values));
    return invitarUsuarioAdmin({
      correo: parsed.correo,
      primerNombre: parsed.primer_nombre,
      segundoNombre: parsed.segundo_nombre || null,
      primerApellido: parsed.primer_apellido,
      segundoApellido: parsed.segundo_apellido || null,
      tipoDocumento: parsed.tipo_documento,
      numeroDocumento: parsed.numero_documento,
      numeroTelefono: parsed.numero_telefono || null,
      idMunicipio: parsed.id_municipio ? Number(parsed.id_municipio) : null,
      idRol: Number(parsed.id_rol),
    });
  }, []);

  return {
    edit: useAdminMutation(editOperation, {
      allowed: canEdit,
      deniedMessage: DENIED,
      fallbackMessage: "No fue posible guardar los cambios del usuario.",
      backend: { name: "sigre_admin_editar_usuario", operation: "Editar usuario" },
    }),
    status: useAdminMutation(statusOperation, {
      allowed: canEdit,
      deniedMessage: DENIED,
      fallbackMessage: "No fue posible cambiar el estado del usuario.",
      backend: { name: "sigre_admin_cambiar_estado_usuario", operation: "Cambiar estado de usuario" },
    }),
    invite: useAdminMutation(inviteOperation, {
      allowed: canCreate,
      deniedMessage: DENIED,
      fallbackMessage: "No fue posible enviar la invitación.",
      backend: { name: "sigre-admin-invitar-usuario", operation: "Invitar usuario" },
    }),
  };
}
