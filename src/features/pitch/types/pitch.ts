export type PitchStatus = 'programado'| 'cerrado'| 'en evaluación'

export type PitchStages = 'R4' | 'R6'

export type PitchModalities = 'Virtual' | 'Presencial'

export interface Pitch {
    id:string
    etapa: PitchStages
    nombre: string
    fechayhora: string
    modalidad: PitchModalities
    lugarylink: string
    estado: PitchStatus
}