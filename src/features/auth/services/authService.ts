import { supabase } from "@/lib/supabase";
import type { LoginFormData } from "../schemas/loginSchema";

export async function loginWithEmail({ email, password}: LoginFormData) {
    const {data, error} = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if(error) throw new Error(error.message)
        return data
}