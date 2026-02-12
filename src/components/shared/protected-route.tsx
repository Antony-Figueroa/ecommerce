import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"

interface ProtectedRouteProps {
  children: React.ReactNode
  adminOnly?: boolean
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const location = useLocation()
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    // Redirigir al login si no hay usuario, guardando la ubicación actual
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (adminOnly && user.role !== "ADMIN") {
    // Si la ruta es solo para admin y el usuario no lo es, redirigir al home de cliente
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
