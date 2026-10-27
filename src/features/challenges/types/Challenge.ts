export interface Challenge {
  id: string
  titulo: string
  descripcion: string | null
  orden: number | null
  nivel: string
  estado: string | null
  proyectos: number
  createdAt: string
  updatedAt: string | null
}

export interface ChallengeDefense {
  id: string
  resultado: string | null
  observacion: string | null
  fecha: string | null
  orientador: string | null
}

export interface ChallengeCompliance {
  id: string
  proyectoId: string | null
  proyecto: string | null
  emprendedor: string | null
  fechaEntrega: string | null
  estado: string | null
  observacion: string | null
  evidencia: string | null
  sustentaciones: ChallengeDefense[]
}

export interface ChallengeFilters {
  search: string
  estado: string
  nivel: string
}

export interface ChallengeCapabilities {
  canCreate: boolean
  canEdit: boolean
}

export interface GuardarRetoInput {
  idReto: string | null
  updatedAtEsperado: string | null
  titulo: string
  descripcion: string | null
  orden: number
  estado: string
}

export interface CambiarEstadoRetoInput {
  idReto: string
  estado: string
  updatedAtEsperado: string
}

export interface AsignarRetoProyectoInput {
  idReto: string
  idProyecto: string
  fechaEntrega: string | null
}
