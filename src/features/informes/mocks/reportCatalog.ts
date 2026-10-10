import {
  Activity,
  CalendarDays,
  Globe,
  Presentation,
  Sparkles,
  Users,
} from "lucide-react";
import type { ReportDefinition } from "../../../features/informes/types/types";

export const REPORTS: ReadonlyArray<ReportDefinition> = [
  {
    id: "emprendedores",
    title: "Informe de emprendedores",
    description: "Estadísticas de registro, etapas y distribución por municipio.",
    tone: "slate",
    icon: Users,
  },
  {
    id: "orientaciones",
    title: "Informe de orientaciones",
    description: "Sesiones realizadas, promedio por orientador y tasas de cumplimiento.",
    tone: "violet",
    icon: CalendarDays,
  },
  {
    id: "pitch",
    title: "Informe de pitch",
    description: "Resultados de evaluaciones, puntajes promedio y proyectos destacados.",
    tone: "fuchsia",
    icon: Sparkles,
  },
  {
    id: "municipio",
    title: "Informe de municipio",
    description: "Distribución geográfica de proyectos, orientadores y resultados de pitch.",
    tone: "green",
    icon: Globe,
  },
  {
    id: "proyectos",
    title: "Informe de proyectos",
    description: "Avance de proyecto, señales de riesgo, última actividad y orientador asignado.",
    tone: "orange",
    icon: Presentation,
  },
  // {
  //   id: "auditoria",
  //   title: "Auditoría",
  //   description: "Cambios importantes dentro del sistema SIGRE.",
  //   tone: "teal",
  //   icon: PersonStanding,
  // },
  {
    id: "rendimiento",
    title: "Informe de rendimiento",
    description: "Clasificación de orientadores y evaluadores, opiniones controversiales.",
    tone: "red",
    icon: Activity,
  },
];