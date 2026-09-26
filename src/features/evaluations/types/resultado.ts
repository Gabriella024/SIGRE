export type ResultadoConsolidado = 'Completado' | 'Rechazado' | 'En revisión'

export interface EvaluadorAsignado {
    iniciales: string
    color: string
}

export interface ResultadoEvaluacion {
    id:string
    codigo: string
    proyecto: string
    fechaPitch: string
    evaluadores: EvaluadorAsignado[]
    puntajePromedio: number | null
    resultado: ResultadoConsolidado
}