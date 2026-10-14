import type { JORNADA_WRITABLE_FIELDS } from "../schemas/orientationSchema";

export interface Orientacion {
  id: string;
  tema: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  fechaHora: string;
  modalidad: string | null;
  lugarLink: string | null;
  audiencia: string | null;
  estado: string;
  idOrientador: string | null;
}

export interface OrientacionDetalle extends Orientacion {
  descripcion: string | null;
  fuente: string | null;
}

export interface OrientationFilters {
  search: string;
  estado: string;
  modalidad: string;
  fecha: string;
}

export type OrientationEditorMode = "create" | "edit";

export type OrientationRoleView = "administrador" | "coordinador" | "orientador" | "emprendedor";

export interface OrientationCapabilities {
  view: OrientationRoleView | null;
  createJornada: boolean;
  editJornada: boolean;
  assignOrientador: boolean;
  closeJornadas: boolean;
  manageAttendance: boolean;
  registerManualAttendee: boolean;
  exportOwnReport: boolean;
  enroll: boolean;
}

export type JornadaWritableField = (typeof JORNADA_WRITABLE_FIELDS)[number];

export type JornadaChanges = Partial<Record<JornadaWritableField, string | null>>;

export type JornadaInsert = JornadaChanges & {
  tema: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
};
