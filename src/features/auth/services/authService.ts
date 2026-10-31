import { supabase } from "@/lib/supabase";
import type { LoginFormData } from "../schemas/loginSchema";

export async function loginWithEmail({ email, password}: LoginFormData) {
    const {data, error} = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
    console.error('Error detallado de Supabase:', error.message, error.status)
    throw new Error(error.message)
  }

  return data
}

const ERRORES_CONTRASENA: Readonly<Record<string, string>> = {
  same_password: 'La nueva contraseña debe ser distinta de la anterior.',
  weak_password: 'La contraseña no cumple la política de seguridad. Usa una más larga o compleja.',
  session_not_found: 'La sesión del enlace expiró. Solicita una nueva invitación.',
  reauthentication_needed: 'Por seguridad debes volver a autenticarte. Solicita una nueva invitación.',
}

export async function establecerContrasena(password: string) {
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    throw new Error((error.code && ERRORES_CONTRASENA[error.code]) ?? 'No fue posible guardar la contraseña. Inténtalo nuevamente.')
  }
}