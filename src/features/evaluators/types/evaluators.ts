export type EvaluatorStatus = 'Activo' | 'Inactivo'

export interface Evaluator {
    id: string
    documento: string
    nombre: string
    especialidad: string
    entidad: string
    telefono: string
    estado: EvaluatorStatus
}