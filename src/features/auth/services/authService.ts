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