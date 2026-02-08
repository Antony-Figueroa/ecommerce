import { Link, useLocation, Outlet } from "react-router-dom"
import { ChevronRight, User, ShoppingBag, LogOut, Heart, Bell } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { Suspense } from "react"
import { PageLoader } from "@/components/shared/page-loader"

const menuItems = [
  { path: "/pedidos", label: "Mis Pedidos", icon: ShoppingBag },
  { path: "/favoritos", label: "Mis Favoritos", icon: Heart },
  { path: "/notificaciones", label: "Notificaciones", icon: Bell },
  { path: "/perfil", label: "Mi Información", icon: User },
]

export function UserAccountLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()

  if (!user) return null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">Inicio</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-foreground">Mi Cuenta</span>
        </nav>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardContent className="p-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/5 shadow-sm">
                  {user.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt={user.name} 
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="h-8 w-8 text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold truncate text-foreground">{user.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>

              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm ${
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]" 
                          : "text-muted-foreground hover:bg-secondary hover:text-primary"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? "text-primary-foreground" : "text-muted-foreground/70"}`} />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
                <div className="pt-2 mt-2 border-t border-border/50">
                  <button 
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm text-red-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </nav>
            </CardContent>
          </Card>
        </aside>

        <main className="lg:col-span-3">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}
