export type ProyectStatus = 'Activo' | 'Inactivo' | 'Finalizado'

export interface Proyecto {
  id: string
  nombre: string
  emprendedor: string
  etapa: string
  centro: string
  fechaRegistro: string
  estado: ProyectStatus
}

