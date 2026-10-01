export type EntrepreneurStatus = 'Activo' | 'Inactivo' | 'Suspendido'

export interface Entrepreneur {
    id: string
    documento: string
    nombre: string
    correo: string
    municipio: string
    centro: string
    estado: EntrepreneurStatus
}