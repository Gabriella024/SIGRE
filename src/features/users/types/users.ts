export type RolUsuario = 'Administrador' | 'Coordinador' | 'Evaluador' | 'Emprendedor' | 'Orientador'
export type EstadoUsuario = 'Activo' | 'Inactivo' | 'Suspendido'

export interface User {
  id: string
  nombre: string
  correo: string
  roles: RolUsuario[]
  estado: EstadoUsuario
  ultimoAcceso: string | null
  fechaCreacion: string
}