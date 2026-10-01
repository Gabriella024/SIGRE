export type EstadoReto = 'Programado' | 'En curso' | 'Finalizado' | 'Cancelado'
export type NivelReto = 'R1' | 'R2' | 'R3'
export type ModalidadReto = 'Presencial' | 'Virtual'

export interface Challenge {
  id: string
  codigo: string
  nivel: NivelReto
  sesion: string
  fechayhora: string
  modalidad: ModalidadReto
  cupo: number
  estado: EstadoReto
}