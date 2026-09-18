export type UserStatus = 'Activo' | 'Inactivo' | 'Suspendido'
export type UserRol = 'Administrador' | 'Coordinador' | 'Orientador' | 'Evaluador' | 'Emprendedor'

export interface User {
    id: string
    nombre: string
    correo: string
    rol: UserRol
    estado: UserStatus
    ultimoAcceso: string
}