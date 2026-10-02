import type {User} from '../types/users'

export const MOCK_USERS: User[] = [
  {
    id: '1',
    nombre: 'Pedro Antonio Salas Sanchez',
    correo: 'p.salas92@gmail.com',
    roles: ['Evaluador'],
    estado: 'Activo',
    ultimoAcceso: '2026-05-24',
    fechaCreacion: '2025-11-02',
  },
  {
    id: '2',
    nombre: 'Jane Cooper',
    correo: 'jessica.hanson@example.com',
    roles: ['Orientador'],
    estado: 'Inactivo',
    ultimoAcceso: null,
    fechaCreacion: '2025-08-14',
  },
  {
    id: '3',
    nombre: 'Wade Warren',
    correo: 'willie.jennings@example.com',
    roles: ['Administrador', 'Orientador', 'Coordinador', 'Evaluador', 'Emprendedor'],
    estado: 'Suspendido',
    ultimoAcceso: '2026-05-19',
    fechaCreacion: '2025-06-01',
  },
  {
    id: '4',
    nombre: 'Esther Howard',
    correo: 'd.chambers@example.com',
    roles: ['Coordinador', 'Emprendedor'],
    estado: 'Activo',
    ultimoAcceso: '2026-03-04',
    fechaCreacion: '2025-01-22',
  },
  {
    id: '5',
    nombre: 'Guy Hawkins',
    correo: 'michael.mitc@example.com',
    roles: ['Emprendedor'],
    estado: 'Activo',
    ultimoAcceso: '2026-07-27',
    fechaCreacion: '2026-02-10',
  },
]