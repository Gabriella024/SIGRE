import { SCREEN_CODES } from "@/features/access-control/constants/screens";
import { useAccessControl } from "@/features/access-control/hooks/useAccessControl";
import { useAdminMutation } from "@/hooks/useAdminMutation";
import { useUserScopedQuery } from "@/hooks/useUserScopedQuery";

import {
  actualizarPantallasAdmin,
  cambiarEstadoCentroSenaAdmin,
  cambiarEstadoMunicipioAdmin,
  getCentrosSenaAdmin,
  getMunicipios,
  getPantallas,
  guardarCentroSenaAdmin,
  guardarMunicipioAdmin,
} from "../services/settingsService";

export function useMunicipios() {
  return useUserScopedQuery(getMunicipios);
}

export function useCentrosSenaAdmin() {
  return useUserScopedQuery(getCentrosSenaAdmin);
}

export function usePantallas() {
  return useUserScopedQuery(getPantallas);
}

export function useSettingsAccess() {
  const { can } = useAccessControl();
  const screen = SCREEN_CODES.configuracion;

  return {
    canCreate: can("configuracion", "crear", screen),
    canEdit: can("configuracion", "editar", screen),
  };
}

const DENIED = "No tienes autorización para modificar la configuración.";

export function useSettingsMutations() {
  const { canCreate, canEdit } = useSettingsAccess();
  const canManage = canCreate || canEdit;

  return {
    municipio: useAdminMutation(guardarMunicipioAdmin, {
      allowed: canManage,
      deniedMessage: DENIED,
      fallbackMessage: "No fue posible guardar el municipio.",
      backend: { name: "sigre_admin_guardar_municipio", operation: "Guardar municipio" },
    }),
    estadoMunicipio: useAdminMutation(cambiarEstadoMunicipioAdmin, {
      allowed: canEdit,
      deniedMessage: DENIED,
      fallbackMessage: "No fue posible cambiar el estado del municipio.",
      backend: { name: "sigre_admin_cambiar_estado_municipio", operation: "Activar o inactivar municipio" },
    }),
    centro: useAdminMutation(guardarCentroSenaAdmin, {
      allowed: canManage,
      deniedMessage: DENIED,
      fallbackMessage: "No fue posible guardar el centro SENA.",
      backend: { name: "sigre_admin_guardar_centro_sena", operation: "Guardar centro SENA" },
    }),
    estadoCentro: useAdminMutation(cambiarEstadoCentroSenaAdmin, {
      allowed: canEdit,
      deniedMessage: DENIED,
      fallbackMessage: "No fue posible cambiar el estado del centro SENA.",
      backend: { name: "sigre_admin_cambiar_estado_centro_sena", operation: "Cambiar estado de centro SENA" },
    }),
    pantallas: useAdminMutation(actualizarPantallasAdmin, {
      allowed: canEdit,
      deniedMessage: DENIED,
      fallbackMessage: "No fue posible guardar la configuración de pantallas.",
      backend: { name: "sigre_admin_actualizar_pantallas", operation: "Actualizar módulos y pantallas" },
    }),
  };
}
