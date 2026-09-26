export type EstadoEvaluacion = 'Pendiente' | 'Completado'

export interface Evaluacion {
    id: string
    codigoPitch: string
    codigoProyecto: string
    proyecto: string
    emprendedor: string
    fechaPitch: string
    estado: EstadoEvaluacion
    puntaje?: number
}