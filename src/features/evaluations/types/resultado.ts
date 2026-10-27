export type ConsolidatedResult = 'Calificación completa' | 'En revisión'

export interface EvaluadorAsignado {
    nombre: string | null
    iniciales: string
    color: string
    calificado: boolean
}

export interface EvaluationResults {
    id: string
    proyecto: string | null
    emprendedor: string | null
    fechaPitch: string | null
    estadoPitch: string | null
    evaluadores: EvaluadorAsignado[]
    asignados: number
    calificados: number
    votosAprobado: number
    votosNoAprobado: number
    puntajePromedio: number | null
    resultado: ConsolidatedResult
}

export interface ResultFiltersValue {
    search: string
    resultado: string
    fechaPitch: string
}
