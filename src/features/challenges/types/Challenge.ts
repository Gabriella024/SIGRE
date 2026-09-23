export type EstadoReto = 'Programado' | 'En curso' | 'Finalizado' | 'Cancelado'
export type NivelReto = 'R1' | 'R2' | 'R3'
export type ModalidadReto = 'Presencial' | 'Virtual'

export interface Reto {
  id: string
  codigo: string
  nivel: NivelReto
  sesion: string
  fechaHora: string
  modalidad: ModalidadReto
  cupo: number
  estado: EstadoReto
}