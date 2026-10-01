export type ConsolidatedResult = 'Completado' | 'Rechazado' | 'En revisión'

export interface EvaluadorAsignado {
    iniciales: string
    color: string
}

export interface EvaluationResults {
    id: string
    codigo: string
    proyecto: string
    fechaPitch: string
    evaluadores: EvaluadorAsignado[]
    puntajePromedio: number | null
    resultado: ConsolidatedResult
}