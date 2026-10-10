import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import type { ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
)

export function AuthProvider({
  children,
}: {
  children: ReactNode
}) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let activo = true

    supabase.auth.getSession().then(({ data, error }) => {
      if (!activo) return

      if (error) {
        console.error('SIGRE - Error de sesión:', error.message)
      }

      setSession(data.session)
      setIsLoading(false)
    }).catch((error) => {
      if (!activo) return

      console.error('SIGRE - Error al obtener sesión:', error)
      setIsLoading(false)
    })

    const { data: listener } =
      supabase.auth.onAuthStateChange((_event, nuevaSession) => {
        if (!activo) return

        setSession(nuevaSession)
        setIsLoading(false)
      })

    return () => {
      activo = false
      listener.subscription.unsubscribe()
    }
  }, [])

  async function logout() {
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        isLoading,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }

  return context
}