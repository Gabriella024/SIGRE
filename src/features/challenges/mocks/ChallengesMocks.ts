import type { Challenge } from "../types/Challenge"

export const MOCK_CHALLENGES: Challenge[] = [
  {
    id: '1',
    codigo: '0000011',
    nivel: 'R1',
    sesion: 'Introducción primeros pasos - #01',
    fechayhora: '2026-02-14/ 8:00 AM',
    modalidad: 'Presencial',
    cupo: 30,
    estado: 'Programado',
  },
  {
    id: '2',
    codigo: '0000012',
    nivel: 'R1',
    sesion: 'Introducción primeros pasos - #02',
    fechayhora: '2026-02-14/ 8:00 AM',
    modalidad: 'Virtual',
    cupo: 40,
    estado: 'Programado',
  },
  {
    id: '3',
    codigo: '0000021',
    nivel: 'R2',
    sesion: 'Validación de idea de negocio - #01',
    fechayhora: '2026-02-14/ 8:00 AM',
    modalidad: 'Presencial',
    cupo: 25,
    estado: 'En curso',
  },
  {
    id: '4',
    codigo: '0000031',
    nivel: 'R3',
    sesion: 'Pitch final - #01',
    fechayhora: '2026-02-14/ 8:00 AM',
    modalidad: 'Presencial',
    cupo: 20,
    estado: 'Finalizado',
  },
]