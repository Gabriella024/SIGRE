export interface Evaluator {
  id: string
  usuarioId: string | null
  nombre: string | null
  documento: string | null
  correo: string | null
  telefono: string | null
  especialidad: string | null
  entidad: string | null
  experiencia: string | null
  estado: string | null
  asignaciones: number
  updatedAt: string | null
}

export interface EvaluatorFilters {
  search: string
  estado: string
}

export interface EvaluatorCapabilities {
  ownOnly: boolean
  canCreate: boolean
  canEdit: boolean
}

export interface GuardarEvaluadorInput {
  idEvaluador: string | null
  idUsuario: string
  updatedAtEsperado: string | null
  especialidad: string
  entidad: string | null
  experiencia: string | null
}

export interface CambiarEstadoEvaluadorInput {
  idEvaluador: string
  estado: string
  updatedAtEsperado: string
}
