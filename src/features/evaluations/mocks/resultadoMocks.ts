import type { ResultadoEvaluacion } from '../types/resultado'

const evaluadoresBase = [
  { iniciales: 'JR', color: 'bg-blue-500' },
  { iniciales: 'MP', color: 'bg-red-400' },
  { iniciales: 'CG', color: 'bg-teal-500' },
]

export const resultadosMock: ResultadoEvaluacion[] = [
  { id: '1', codigo: 'P-2024-001', proyecto: 'AgroTech Caribe SAS', fechaPitch: '2026-07-15', evaluadores: evaluadoresBase, puntajePromedio: 84, resultado: 'Completado' },
  { id: '2', codigo: 'P-2024-001', proyecto: 'AgroTech Caribe SAS', fechaPitch: '2026-07-15', evaluadores: evaluadoresBase, puntajePromedio: 84, resultado: 'Rechazado' },
  { id: '3', codigo: 'P-2024-001', proyecto: 'AgroTech Caribe SAS', fechaPitch: '2026-07-15', evaluadores: evaluadoresBase, puntajePromedio: 84, resultado: 'Completado' },
  { id: '4', codigo: 'P-2024-001', proyecto: 'AgroTech Caribe SAS', fechaPitch: '2026-07-15', evaluadores: evaluadoresBase, puntajePromedio: 84, resultado: 'Rechazado' },
  { id: '5', codigo: 'P-2024-001', proyecto: 'AgroTech Caribe SAS', fechaPitch: '2026-07-15', evaluadores: evaluadoresBase, puntajePromedio: 84, resultado: 'Completado' },
  { id: '6', codigo: 'P-2024-001', proyecto: 'AgroTech Caribe SAS', fechaPitch: '2026-07-15', evaluadores: evaluadoresBase, puntajePromedio: 84, resultado: 'Rechazado' },
  { id: '7', codigo: 'P-2024-001', proyecto: 'AgroTech Caribe SAS', fechaPitch: '2026-07-15', evaluadores: [evaluadoresBase[0], evaluadoresBase[1]], puntajePromedio: 84, resultado: 'Completado' },
  { id: '8', codigo: 'P-2024-001', proyecto: 'AgroTech Caribe SAS', fechaPitch: '2026-07-15', evaluadores: evaluadoresBase, puntajePromedio: 84, resultado: 'Completado' },
  { id: '9', codigo: 'P-2024-001', proyecto: 'AgroTech Caribe SAS', fechaPitch: '2026-07-15', evaluadores: evaluadoresBase, puntajePromedio: null, resultado: 'En revisión' },
]