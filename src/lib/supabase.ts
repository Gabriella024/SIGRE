import { createClient } from '@supabase/supabase-js'

import { parseAuthRedirect } from './authRedirect'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Se lee antes de crear el cliente: supabase-js limpia el hash al procesar el enlace de invitación.
export const redireccionAuthInicial = parseAuthRedirect(window.location.hash, window.location.search)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)