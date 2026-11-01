import type { Entrepreneur } from "@/features/entrepreneurs/types/entrepreneur";
import type { ProjectExportRow } from "@/features/projects/types/proyect";
import type { User } from "@/features/users/types/users";
import type {
  ComplianceReportRow,
  EvaluationReportRow,
  OrientationReportRow,
  PitchReportRow,
} from "@/features/informes/types/types";

export type SourceId = "emprendedores" | "proyectos" | "orientaciones" | "retos" | "pitch" | "evaluaciones" | "usuarios";

export type DashboardRole = "administrador" | "coordinador" | "orientador" | "evaluador" | "emprendedor";

export interface DashboardData {
  emprendedores: readonly Entrepreneur[];
  proyectos: readonly ProjectExportRow[];
  orientaciones: readonly OrientationReportRow[];
  retos: readonly ComplianceReportRow[];
  pitch: readonly PitchReportRow[];
  evaluaciones: readonly EvaluationReportRow[];
  usuarios: readonly Pick<User, "id" | "estado">[];
}

export interface DashboardOptions {
  now: Date;
  minEvaluadores: number;
}

export type KpiIcon =
  | "users"
  | "projects"
  | "calendar"
  | "attendance"
  | "target"
  | "review"
  | "pitch"
  | "evaluation"
  | "pending"
  | "clock"
  | "userCheck"
  | "orientador";

export type KpiTone = "blue" | "green" | "red" | "amber";

export interface KpiItem {
  id: string;
  title: string;
  value: number;
  hint: string | null;
  icon: KpiIcon;
  tone: KpiTone;
  deps: readonly SourceId[];
}

export interface MonthlySeries {
  key: string;
  label: string;
  color: "brand" | "sky";
}

export type MonthlyPoint = { mes: string } & Record<string, string | number>;

export interface DistributionItem {
  label: string;
  value: number;
}

export type AgendaKind = "jornada" | "pitch" | "reto";

export interface AgendaItem {
  id: string;
  kind: AgendaKind;
  title: string;
  detail: string | null;
  date: string;
  status: string | null;
  overdue: boolean;
}

export type AlertSeverity = "alta" | "media";

export interface AlertItem {
  id: string;
  severity: AlertSeverity;
  reason: string;
  subject: string | null;
  detail: string | null;
  date: string | null;
  days: number | null;
}

export interface ProgressItem {
  id: string;
  label: string;
  detail: string | null;
  done: number;
  total: number;
}

export type ChecklistState = "done" | "review" | "current" | "blocked";

export interface ChecklistItem {
  id: string;
  label: string;
  detail: string | null;
  state: ChecklistState;
  stateLabel: string;
}

export type StepTone = "action" | "waiting" | "done";

export interface NextStep {
  id: string;
  text: string;
  detail: string | null;
  tone: StepTone;
}

export interface ProjectSummary {
  titulo: string;
  etapa: string | null;
  estado: string | null;
  sector: string | null;
  otros: number;
}

export interface PitchSummary {
  estado: string | null;
  estadoLabel: string | null;
  fechaHora: string | null;
  modalidad: string | null;
}

export type SectionSpan = "narrow" | "wide" | "full";

interface SectionBase {
  id: string;
  title: string;
  description: string;
  deps: readonly SourceId[];
  span: SectionSpan;
}

export type DashboardSectionModel = SectionBase &
  (
    | { kind: "monthly"; series: readonly MonthlySeries[]; data: readonly MonthlyPoint[] }
    | { kind: "distribution"; items: readonly DistributionItem[]; emptyMessage: string }
    | { kind: "agenda"; items: readonly AgendaItem[]; emptyMessage: string }
    | { kind: "alerts"; items: readonly AlertItem[]; emptyMessage: string }
    | { kind: "progress"; items: readonly ProgressItem[]; emptyMessage: string }
    | { kind: "checklist"; items: readonly ChecklistItem[]; done: number; emptyMessage: string }
    | { kind: "steps"; items: readonly NextStep[] }
    | { kind: "project"; project: ProjectSummary | null; pitch: PitchSummary | null; showPitch: boolean }
  );

export interface RoleDashboardModel {
  role: DashboardRole;
  description: string;
  kpis: readonly KpiItem[];
  sections: readonly DashboardSectionModel[];
}
