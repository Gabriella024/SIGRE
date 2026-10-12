import { Navigate } from "react-router-dom";

import { LoginForm } from "@/features/auth/components/LoginForm";
import { useAuth } from "@/features/auth/context/AuthContext";

export function LoginPage() {
  const { user, isLoading } = useAuth()

  if (!isLoading && user) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <LoginForm />
    </div>
  )
}
