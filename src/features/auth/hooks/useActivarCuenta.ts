import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { redireccionAuthInicial } from "@/lib/supabase";

import { useAuth } from "../context/AuthContext";
import { establecerContrasena } from "../services/authService";
import type { ActivacionFormData } from "../schemas/activacionSchema";

export type EstadoActivacion = "verificando" | "listo" | "invalido";

export function useActivarCuenta() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { tipo, error: errorEnlace } = redireccionAuthInicial;
  const estado: EstadoActivacion = isLoading ? "verificando" : tipo && user ? "listo" : "invalido";
  const motivo = errorEnlace
    ?? (tipo ? "El enlace no es válido o expiró. Solicita a un administrador una nueva invitación." : "Abre esta página desde el enlace que recibiste por correo.");

  async function activar({ password }: ActivacionFormData) {
    setGuardando(true);
    setError(null);
    try {
      await establecerContrasena(password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible guardar la contraseña.");
    } finally {
      setGuardando(false);
    }
  }

  return { estado, motivo, tipo, correo: user?.email ?? null, activar, guardando, error };
}
