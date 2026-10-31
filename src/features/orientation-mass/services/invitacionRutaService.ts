import { z } from 'zod';

import { supabase } from '@/lib/supabase';

const invitacionSchema = z.object({
  nombres: z.string(),
  estado: z.enum(['pendiente', 'enviada', 'aceptada', 'rechazada', 'error']),
  jornada: z.string().nullable(),
  fecha: z.string().nullable(),
});

export type InvitacionRuta = z.infer<typeof invitacionSchema>;

export async function consultarInvitacionRuta(token: string): Promise<InvitacionRuta | null> {
  const { data, error } = await supabase.rpc('sigre_consultar_invitacion_ruta', { p_token: token });
  if (error) throw new Error('No fue posible consultar la invitación. Verifica el enlace e inténtalo nuevamente.');
  if (data === null) return null;
  const parsed = invitacionSchema.safeParse(data);
  if (!parsed.success) throw new Error('La respuesta de la invitación no tiene el formato esperado.');
  return parsed.data;
}

export async function responderInvitacionRuta(token: string, acepta: boolean): Promise<void> {
  const { error } = await supabase.rpc('sigre_responder_invitacion_ruta', { p_token: token, p_acepta: acepta });
  if (!error) return;
  if (error.code === '22023') throw new Error('Esta invitación ya fue respondida.');
  if (error.code === 'P0002') throw new Error('La invitación no existe o el enlace no es válido.');
  throw new Error('No fue posible registrar tu respuesta. Inténtalo nuevamente más tarde.');
}
