export type EntrepreneurStatus = 'Activo' | 'Inactivo' | 'Suspendido'

export interface Emprendedor {
    id: string
    nombre: string
    documento: string
    correo: string
    municipio: string
    centro: string
    estado: EntrepreneurStatus
}