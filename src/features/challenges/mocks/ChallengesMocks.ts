import type { Reto } from "../types/Challenge"

export const retosMock: Reto[] = [
  {
    id: '1',
    codigo: '0000011',
    nivel: 'R1',
    sesion: 'Introducción primeros pasos - #01',
    fechaHora: '2026-07-30T20:00:00',
    modalidad: 'Presencial',
    cupo: 30,
    estado: 'Programado',
  },
  {
    id: '2',
    codigo: '0000012',
    nivel: 'R1',
    sesion: 'Introducción primeros pasos - #02',
    fechaHora: '2026-07-31T18:00:00',
    modalidad: 'Virtual',
    cupo: 40,
    estado: 'Programado',
  },
  {
    id: '3',
    codigo: '0000021',
    nivel: 'R2',
    sesion: 'Validación de idea de negocio - #01',
    fechaHora: '2026-08-02T19:00:00',
    modalidad: 'Presencial',
    cupo: 25,
    estado: 'En curso',
  },
  {
    id: '4',
    codigo: '0000031',
    nivel: 'R3',
    sesion: 'Pitch final - #01',
    fechaHora: '2026-08-10T16:00:00',
    modalidad: 'Presencial',
    cupo: 20,
    estado: 'Finalizado',
  },
]