export type ProyectStatus = 'Activo' | 'Inactivo' | 'Finalizado'

export interface Proyecto {
  id: string
  nombre: string
  emprendedor: string
  municipio: string
  sector: string
  etapa: string
  fechaRegistro: string
  estado: ProyectStatus
}

