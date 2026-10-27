import type { EstadoAsistencia } from "../constants/jornada";
import type { JORNADA_WRITABLE_FIELDS } from "../schemas/orientationSchema";

export type { EstadoAsistencia };

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
  cupo: number | null;
}

export interface OrientacionDetalle extends Orientacion {
  descripcion: string | null;
  fuente: string | null;
}

export interface EntrepreneurOrientationHistoryItem {
  orientacionId: string;
  jornada: {
    tema: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    modalidad: string | null;
    estado: string;
  } | null;
  inscripcion: { estado: string | null; origen: string | null; createdAt: string } | null;
  asistencia: { estado: string | null; observacion: string | null; confirmadoAt: string | null } | null;
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
  enrollEntrepreneurs: boolean;
  registerManualAttendee: boolean;
  exportOwnReport: boolean;
  enroll: boolean;
}

export interface OrientadorOption {
  id: string;
  nombre: string;
  correo: string | null;
}

export interface InscritoAsistencia {
  idInscripcion: string;
  emprendedorId: string;
  nombreCompleto: string;
  estadoAsistencia: EstadoAsistencia | null;
  observacion: string | null;
  confirmadoAt: string | null;
  registradoPorUsuarioId: string | null;
}

export interface RegistrarAsistenciaInput {
  orientacionId: string;
  emprendedorId: string;
  estado: EstadoAsistencia;
  observacion: string | null;
}

export interface InscribirEmprendedorInput {
  orientacionId: string;
  emprendedorId: string;
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
