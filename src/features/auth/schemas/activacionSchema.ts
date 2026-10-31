import { z } from 'zod'

export const activacionSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .max(72, 'Máximo 72 caracteres')
      .regex(/[A-Za-zÁÉÍÓÚÑáéíóúñ]/, 'Incluye al menos una letra')
      .regex(/\d/, 'Incluye al menos un número'),
    confirmacion: z.string(),
  })
  .refine((data) => data.password === data.confirmacion, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmacion'],
  })

export type ActivacionFormData = z.infer<typeof activacionSchema>
