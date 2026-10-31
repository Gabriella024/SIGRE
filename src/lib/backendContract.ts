import { AdminOperationError, missingBackendMessage } from "./adminOperation";

type BackendStatus = "existente" | "solo_staging" | "propuesta";

const STAGING_PROJECT_HOST = "febelffifcqzvnttpued.supabase.co";

function isStagingProject(): boolean {
  try {
    return new URL(String(import.meta.env.VITE_SUPABASE_URL ?? "")).hostname === STAGING_PROJECT_HOST;
  } catch {
    return false;
  }
}

const IS_STAGING = isStagingProject();

export const BACKEND_OPERATIONS = {
  obtener_mis_permisos: "existente",
  tiene_permiso: "existente",
  sigre_listar_usuarios_elegibles_emprendedor: "existente",
  sigre_inscribir_en_jornada: "existente",
  sigre_listar_inscritos_asistencia: "existente",
  sigre_registrar_asistencia: "existente",
  sigre_admin_crear_proyecto: "existente",
  sigre_admin_editar_proyecto: "existente",
  sigre_admin_eliminar_proyecto: "existente",

  sigre_admin_guardar_municipio: "solo_staging",
  sigre_admin_cambiar_estado_municipio: "solo_staging",
  sigre_admin_guardar_centro_sena: "solo_staging",
  sigre_admin_cambiar_estado_centro_sena: "solo_staging",
  sigre_admin_actualizar_pantallas: "solo_staging",
  sigre_admin_editar_usuario: "solo_staging",
  sigre_admin_cambiar_estado_usuario: "solo_staging",
  sigre_admin_guardar_permisos_rol: "solo_staging",
  sigre_admin_asignar_roles_usuario: "solo_staging",
  "sigre-admin-invitar-usuario": "solo_staging",
  sigre_registrar_carga_asistentes: "solo_staging",
  sigre_admin_guardar_reto: "solo_staging",
  sigre_admin_cambiar_estado_reto: "solo_staging",
  sigre_admin_asignar_reto_proyecto: "solo_staging",
  sigre_admin_guardar_pitch: "solo_staging",
  sigre_admin_cambiar_estado_pitch: "solo_staging",
  sigre_admin_asignar_evaluador_pitch: "solo_staging",
  sigre_admin_retirar_evaluador_pitch: "solo_staging",
  sigre_admin_guardar_evaluador: "solo_staging",
  sigre_admin_cambiar_estado_evaluador: "solo_staging",
  sigre_evaluador_registrar_calificacion: "solo_staging",
  sigre_registrar_avance_reto: "solo_staging",
  sigre_revisar_reto: "solo_staging",
} as const satisfies Record<string, BackendStatus>;

export type BackendOperation = keyof typeof BACKEND_OPERATIONS;

export interface BackendRequirement {
  name: BackendOperation;
  operation: string;
}

const OPERATION_STATUS: Readonly<Record<BackendOperation, BackendStatus>> = BACKEND_OPERATIONS;

export function isBackendAvailable(name: BackendOperation): boolean {
  const status = OPERATION_STATUS[name];
  return status === "existente" || (status === "solo_staging" && IS_STAGING);
}

export function pendingBackendMessage(requirement: BackendRequirement): string | null {
  return isBackendAvailable(requirement.name) ? null : missingBackendMessage(requirement.operation);
}

export function assertBackendAvailable(requirement: BackendRequirement): void {
  const message = pendingBackendMessage(requirement);
  if (message) throw new AdminOperationError(message, { missingBackend: true });
}
