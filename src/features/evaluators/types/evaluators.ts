export type EvaluatorStatus = 'Activo' | 'Inactivo'

export interface Evaluador {
    id: string
    documento: string
    nombre: string
    especialidad: string
    entidad: string
    telefono: string
    estado: EvaluatorStatus
}