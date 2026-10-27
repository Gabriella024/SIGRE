export type EstadoEvaluacion = 'Pendiente' | 'Completado'

export interface Calificacion {
    id: string
    puntaje: number | null
    resultado: string | null
    observacion: string | null
}

export interface Evaluacion {
    id: string
    pitchId: string | null
    proyecto: string | null
    emprendedor: string | null
    fechaPitch: string | null
    estadoPitch: string | null
    modalidad: string | null
    estado: EstadoEvaluacion
    calificacion: Calificacion | null
}

export interface RegistrarCalificacionInput {
    idAsignacion: string
    puntaje: number
    resultado: string
    observacion: string | null
}

export interface EvaluationCapabilities {
    evaluatorScoped: boolean
    canGrade: boolean
    canViewResults: boolean
    canManageAssignments: boolean
}
