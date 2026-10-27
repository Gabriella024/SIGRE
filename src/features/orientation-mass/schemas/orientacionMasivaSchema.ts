import { z } from 'zod';

import type { AsistenteField } from '../types/cargaMasiva';

export const MAX_FILAS_CARGA = 2000;

export const ASISTENTE_COLUMNS: readonly { field: AsistenteField; header: string; aliases: readonly string[] }[] = [
  { field: 'tipo_documento', header: 'Tipo de documento', aliases: ['tipo documento', 'tipo doc', 'tipo'] },
  { field: 'numero_documento', header: 'Número de documento', aliases: ['numero documento', 'documento', 'cedula'] },
  { field: 'nombres', header: 'Nombres', aliases: ['nombre'] },
  { field: 'apellidos', header: 'Apellidos', aliases: ['apellido'] },
  { field: 'correo', header: 'Correo', aliases: ['correo electronico', 'email', 'e-mail'] },
  { field: 'telefono', header: 'Teléfono', aliases: ['celular', 'numero telefono', 'telefono celular'] },
];

const requiredText = (label: string, max: number) =>
  z.string().trim().min(1, `${label} es obligatorio.`).max(max, `${label} admite máximo ${max} caracteres.`);

export const asistenteRowSchema = z.object({
  tipo_documento: requiredText('El tipo de documento', 5).regex(/^[A-Za-z]{1,5}$/, 'El tipo de documento no es válido.'),
  numero_documento: requiredText('El número de documento', 20).regex(
    /^[A-Za-z0-9-]{4,20}$/,
    'El documento debe tener entre 4 y 20 caracteres alfanuméricos, sin puntos ni espacios.'
  ),
  nombres: requiredText('Los nombres', 80),
  apellidos: requiredText('Los apellidos', 80),
  correo: requiredText('El correo', 254).pipe(z.email('El correo no es válido.')),
  telefono: z
    .string()
    .trim()
    .refine((value) => value === '' || /^[0-9+()\s-]{7,20}$/.test(value), 'El teléfono no es válido.'),
});

export const resultadoCargaSchema = z.object({
  id_carga: z.guid(),
  resultados: z.array(
    z.object({
      fila: z.number().int(),
      estado: z.enum(['registrada', 'existente', 'rechazada']),
      mensaje: z.string().nullable(),
    })
  ),
});
