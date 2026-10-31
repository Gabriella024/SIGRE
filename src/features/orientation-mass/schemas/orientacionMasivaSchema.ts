import { z } from 'zod';

import type { AsistenteField } from '../types/cargaMasiva';

export const MAX_FILAS_CARGA = 2000;

export const ASISTENTE_COLUMNS: readonly {
  field: AsistenteField;
  header: string;
  aliases: readonly string[];
  required: boolean;
}[] = [
  { field: 'nombres', header: 'Nombres', aliases: ['nombre'], required: true },
  { field: 'apellidos', header: 'Apellidos', aliases: ['apellido'], required: true },
  { field: 'departamento', header: 'Departamento', aliases: [], required: false },
  { field: 'municipio', header: 'Municipio', aliases: ['ciudad'], required: false },
  { field: 'tipo_documento', header: 'Tipo de identificación', aliases: ['tipo de documento', 'tipo documento', 'tipo doc', 'tipo'], required: true },
  { field: 'numero_documento', header: 'Número de identificación', aliases: ['numero de documento', 'numero documento', 'documento', 'cedula', 'identificacion'], required: true },
  { field: 'fecha_nacimiento', header: 'Fecha de nacimiento', aliases: ['fecha nacimiento'], required: false },
  { field: 'edad', header: 'Edad', aliases: [], required: false },
  { field: 'genero', header: 'Género', aliases: ['sexo'], required: false },
  { field: 'nacionalidad', header: 'Nacionalidad', aliases: [], required: false },
  { field: 'correo', header: 'Correo electrónico', aliases: ['correo', 'email', 'e-mail'], required: false },
  { field: 'clasificacion_poblacional', header: 'Clasificación poblacional', aliases: ['poblacion', 'clasificacion'], required: false },
  { field: 'tipo_emprendedor', header: 'Tipo de emprendedor', aliases: ['tipo emprendedor'], required: false },
  { field: 'nivel_formacion', header: 'Nivel de formación', aliases: ['nivel formacion'], required: false },
  { field: 'celular', header: 'Celular', aliases: ['telefono', 'numero telefono', 'telefono celular'], required: false },
  { field: 'segmentacion', header: 'Segmentación', aliases: [], required: false },
];

const requiredText = (label: string, max: number) =>
  z.string().trim().min(1, `${label} es obligatorio.`).max(max, `${label} admite máximo ${max} caracteres.`);

const optionalText = (label: string, max: number) =>
  z.string().trim().max(max, `${label} admite máximo ${max} caracteres.`);

const DMY = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

export function toIsoDate(value: string): string | null {
  const trimmed = value.trim();
  const dmy = DMY.exec(trimmed);
  const iso = dmy ? `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}` : trimmed;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const date = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso ? null : iso;
}

export const asistenteRowSchema = z.object({
  nombres: requiredText('Los nombres', 80),
  apellidos: requiredText('Los apellidos', 80),
  departamento: optionalText('El departamento', 80),
  municipio: optionalText('El municipio', 80),
  tipo_documento: requiredText('El tipo de identificación', 5).regex(/^[A-Za-z]{1,5}$/, 'El tipo de identificación no es válido.'),
  numero_documento: requiredText('El número de identificación', 20).regex(
    /^[A-Za-z0-9-]{4,20}$/,
    'La identificación debe tener entre 4 y 20 caracteres alfanuméricos, sin puntos ni espacios.'
  ),
  fecha_nacimiento: z
    .string()
    .trim()
    .refine((value) => value === '' || toIsoDate(value) !== null, 'La fecha de nacimiento debe tener formato AAAA-MM-DD o DD/MM/AAAA.'),
  edad: z
    .string()
    .trim()
    .refine((value) => value === '' || (/^\d{1,3}$/.test(value) && Number(value) <= 120), 'La edad no es válida.'),
  genero: optionalText('El género', 40),
  nacionalidad: optionalText('La nacionalidad', 60),
  correo: z
    .string()
    .trim()
    .max(254, 'El correo admite máximo 254 caracteres.')
    .refine((value) => value === '' || z.email().safeParse(value).success, 'El correo no es válido.'),
  clasificacion_poblacional: optionalText('La clasificación poblacional', 80),
  tipo_emprendedor: optionalText('El tipo de emprendedor', 80),
  nivel_formacion: optionalText('El nivel de formación', 80),
  celular: z
    .string()
    .trim()
    .refine((value) => value === '' || /^[0-9+()\s-]{7,20}$/.test(value), 'El celular no es válido.'),
  segmentacion: optionalText('La segmentación', 80),
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
  resumen: z
    .object({
      validas: z.number().int(),
      errores: z.number().int(),
      duplicadas: z.number().int(),
      existentes: z.number().int(),
      inscritos: z.number().int(),
      prospectos: z.number().int(),
      invitaciones: z.number().int(),
    })
    .nullish(),
});
