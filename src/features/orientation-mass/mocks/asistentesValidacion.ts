import type {FilaRegistro, InfoOrientacion } from '../types/cargaMasiva';

export const MOCK_INFO_ORIENTACION: InfoOrientacion = {
    orientacion: 'Inducción SENA 2026-II',
    detallesOrientacion: 'Centro de Comercio y Servicios',
    archivoNombre: 'Asistentes_Orientacion_SENA.xlsx',
    fechaCarga: '04/10/2026',
    cargadoPor: 'Coordinación Académica',
};

export const MOCK_FILAS_VALIDACION: FilaRegistro[] = [
    { fila: 2, doc: '1045738291', nombre: 'Laura Sofía Martínez Díaz', correo: 'laura.martinez@email.com', estado: 'valida', mensaje: 'Lista para registrar' },
    { fila: 3, doc: '1140812397', nombre: 'Carlos Andrés Pérez Orozco', correo: 'carlos.perez@email.com', estado: 'valida', mensaje: 'Lista para registrar' },
    { fila: 4, doc: '1002184756', nombre: 'María José Castro León', correo: 'maria.castro@email.com', estado: 'error', mensaje: 'Documento no válido' },
    { fila: 5, doc: '5901842', nombre: 'Daniel Gómez Silva', correo: '—', estado: 'error', mensaje: 'Falta el correo' },
    { fila: 6, doc: '1049927361', nombre: 'Valentina Torres Ruiz', correo: 'valentina.torres@email.com', estado: 'duplicada', mensaje: 'Repetido en la fila 14' },
    { fila: 7, doc: '1046872840', nombre: 'Andrés Felipe Acosta', correo: 'andres.acosta@email.com', estado: 'existente', mensaje: 'Ya registrado en esta orientación' },
    { fila: 8, doc: '1007849302', nombre: 'Natalia Andrea López', correo: 'natalia.lopez@email.com', estado: 'valida', mensaje: 'Lista para registrar' },
    { fila: 9, doc: '1143220891', nombre: 'Samuel David Herrera', correo: 'samuel.herrera@email.com', estado: 'valida', mensaje: 'Lista para registrar' },
];