import type { Pitch } from "../types/pitch";

export const MOCK_PITCH: Pitch[] = [
  {
    id: '1',
    etapa: 'R5',
    nombre: 'Preparación Pitch - Taller N°1',
    fechayhora: '2026-02-18 / 10:00 AM',
    modalidad: 'Virtual',
    lugarylink: 'https://meet.google.com/abc-defg-hij',
    estado: 'Programado'
  },
  {
    id: '2',
    etapa: 'R5',
    nombre: 'Preparación Pitch - Taller N°2',
    fechayhora: '2026-02-19 / 02:00 PM',
    modalidad: 'Presencial',
    lugarylink: 'Auditorio Principal SENA',
    estado: 'Programado'
  },
  {
    id: '3',
    etapa: 'R6',
    nombre: 'Jornada de Pitch Final N°1',
    fechayhora: '2026-02-25 / 08:00 AM',
    modalidad: 'Presencial',
    lugarylink: 'Sede Coquimbo - Aula 102',
    estado: 'Programado'
  },
  {
    id: '4',
    etapa: 'R6',
    nombre: 'Jornada de Pitch Final N°2',
    fechayhora: '2026-02-26 / 08:00 AM',
    modalidad: 'Virtual',
    lugarylink: 'https://meet.google.com/xyz-uvwx-rst',
    estado: 'Programado'
  }
]