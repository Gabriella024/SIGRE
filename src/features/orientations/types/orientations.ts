export type OrientationStatus = 'Programada'| 'Finalizada' | 'En Proceso'

export interface Orientacion {
    id: string
    nombre: string
    fechayhora: string
    modalidad: string
    lugarylink: string
    cupo: string
    estado: OrientationStatus
}