export interface Municipality {
  id: string;
  name: string;
  department: string;
  active: boolean;
}

export type MunicipalityStatusFilter = "all" | "active" | "inactive";

export type EmailTemplateId =
  | "bienvenida"
  | "inscripcion"
  | "recordatorio"
  | "evaluador"
  | "pitch"
  | "password";

export type TemplateVariable = "nombre" | "fecha" | "enlace";

export interface EmailTemplate {
  id: EmailTemplateId;
  name: string;
  trigger: string;
  subject: string;
  body: string;
  enabled: boolean;
}

export type ModuleIconKey = "users" | "folder" | "calendar" | "target" | "mic" | "chart";

export interface SystemModule {
  id: string;
  module: string;
  code: string;
  screenName: string;
  route: string;
  order: number;
  icon: ModuleIconKey;
  active: boolean;
}