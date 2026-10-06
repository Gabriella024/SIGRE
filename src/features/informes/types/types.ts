import type { LucideIcon } from "lucide-react";

export type ReportId =
  | "emprendedores"
  | "orientaciones"
  | "pitch"
  | "municipio"
  | "proyectos"
  | "auditoria"
  | "rendimiento";

export type ReportTone = "slate" | "violet" | "fuchsia" | "green" | "orange" | "teal" | "red";

export interface ReportDefinition {
  id: ReportId;
  title: string;
  description: string;
  tone: ReportTone;
  icon: LucideIcon;
}