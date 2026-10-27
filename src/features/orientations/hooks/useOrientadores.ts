import { useMemo } from "react";

import { useUsers } from "@/features/users/hooks/useUsers";
import { isActiveUser } from "@/features/users/utils/userUtils";
import { normalizeText } from "@/lib/format";

import { ORIENTADOR_ROLE } from "../constants/jornada";

import type { OrientadorOption } from "../types/orientations";

export function useOrientadores() {
  const { data, error, isLoading, reload } = useUsers();

  const orientadores = useMemo<OrientadorOption[] | null>(
    () =>
      data
        ?.filter(
          (user) => isActiveUser(user) && user.roles.some((role) => normalizeText(role.rol) === ORIENTADOR_ROLE)
        )
        .map((user) => ({ id: user.id, nombre: user.nombre, correo: user.correo }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, "es")) ?? null,
    [data]
  );

  return { data: orientadores, error, isLoading, reload };
}
