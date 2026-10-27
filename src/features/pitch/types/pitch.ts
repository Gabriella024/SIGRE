export type PitchStage = 'R5' | 'R6'

export interface PitchAssignment {
  id: string
  evaluadorId: string | null
  usuarioId: string | null
  nombre: string | null
  especialidad: string | null
  estado: string | null
  fechaAsignacion: string | null
  updatedAt: string | null
}

export interface Pitch {
  id: string
  proyectoId: string | null
  proyecto: string | null
  emprendedor: string | null
  fechaHora: string | null
  modalidad: string | null
  lugarLink: string | null
  estado: string | null
  observacion: string | null
  updatedAt: string | null
  evaluadores: PitchAssignment[]
  totalEvaluadores: number
}

export interface PitchPreparation {
  id: string
  proyecto: string | null
  emprendedor: string | null
  orientador: string | null
  fecha: string | null
  estado: string | null
  observacion: string | null
}

export interface PitchFilters {
  search: string
  estado: string
  modalidad: string
  fecha: string
}

export interface PitchCapabilities {
  evaluatorScoped: boolean
  canCreate: boolean
  canEdit: boolean
}

export interface GuardarPitchInput {
  idPitch: string | null
  updatedAtEsperado: string | null
  idProyecto: string
  fechaHora: string
  modalidad: string
  lugarLink: string | null
  estado: string
  observacion: string | null
}

export interface CambiarEstadoPitchInput {
  idPitch: string
  estado: string
  updatedAtEsperado: string
}

export interface AsignarEvaluadorPitchInput {
  idPitch: string
  idEvaluador: string
}

export interface RetirarEvaluadorPitchInput {
  idAsignacion: string
  updatedAtEsperado: string
}
