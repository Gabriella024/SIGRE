export const SCREEN_CODES = {
  panel: "panel_principal",
  emprendedores: "emprendedores_principal",
  proyectos: "proyectos_principal",
  orientaciones: "orientaciones_principal",
  orientacion_masiva: "orientacion_masiva_principal",
  retos: "retos_principal",
  pitch: "pitch_principal",
  evaluaciones: "evaluaciones_principal",
  evaluadores: "evaluadores_principal",
  informes: "informes_principal",
  usuarios: "usuarios_principal",
  control_accesos: "control_accesos_principal",
  configuracion: "configuracion_principal",
} as const;

export type ModuleCode = keyof typeof SCREEN_CODES;
export type ScreenCode = (typeof SCREEN_CODES)[ModuleCode];
