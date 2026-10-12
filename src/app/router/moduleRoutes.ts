import {
  SCREEN_CODES,
  type ModuleCode,
  type ScreenCode,
} from "@/features/access-control/constants/screens";

export type ModuleRoute = {
  path: string;
  moduleCode: ModuleCode;
  screenCode: ScreenCode;
};

export const MODULE_ROUTES: readonly ModuleRoute[] = [
  { path: "/dashboard", moduleCode: "panel", screenCode: SCREEN_CODES.panel },
  { path: "/proyectos", moduleCode: "proyectos", screenCode: SCREEN_CODES.proyectos },
  { path: "/emprendedores", moduleCode: "emprendedores", screenCode: SCREEN_CODES.emprendedores },
  { path: "/orientaciones", moduleCode: "orientaciones", screenCode: SCREEN_CODES.orientaciones },
  { path: "/orientacion-masiva", moduleCode: "orientacion_masiva", screenCode: SCREEN_CODES.orientacion_masiva },
  { path: "/retos", moduleCode: "retos", screenCode: SCREEN_CODES.retos },
  { path: "/pitch", moduleCode: "pitch", screenCode: SCREEN_CODES.pitch },
  { path: "/evaluaciones", moduleCode: "evaluaciones", screenCode: SCREEN_CODES.evaluaciones },
  { path: "/evaluadores", moduleCode: "evaluadores", screenCode: SCREEN_CODES.evaluadores },
  { path: "/informes", moduleCode: "informes", screenCode: SCREEN_CODES.informes },
  { path: "/usuarios", moduleCode: "usuarios", screenCode: SCREEN_CODES.usuarios },
  { path: "/control-accesos", moduleCode: "control_accesos", screenCode: SCREEN_CODES.control_accesos },
  { path: "/configuracion", moduleCode: "configuracion", screenCode: SCREEN_CODES.configuracion },
];
