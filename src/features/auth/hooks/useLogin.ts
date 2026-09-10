import { useState } from "react";
import {useNavigate} from 'react-router-dom'
import { loginWithEmail } from "../services/authService";
import type { LoginFormData } from "../schemas/loginSchema";

export function useLogin() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()

    async function login(data: LoginFormData) {
        setIsLoading(true)
        setError(null)
        try {
            await loginWithEmail(data)
            navigate('/dashboard')
        } catch (err) {
            setError(err instanceof Error ? err.message: 'Error al iniciar sesión')
        } finally {
            setIsLoading(false)
        }
    }
    return {login, isLoading, error}
}
