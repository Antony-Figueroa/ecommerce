import { useState, useEffect } from "react"
import { 
  Bell, 
  Sun, 
  Moon, 
  Search, 
  User, 
  LogOut, 
  RefreshCw,
  TrendingUp,
  Settings,
  HelpCircle,
  ChevronRight,
  Home,
  Plus,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { Separator } from "@/components/ui/separator"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export function AdminTopNav() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [bcvRate, setBcvRate] = useState<number | null>(null)
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark") || 
             localStorage.getItem("theme") === "dark"
    }
    return false
  })
  const [updatingBcv, setUpdatingBcv] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)

  useEffect(() => {
    fetchBCVRate()
    fetchNotifications()
    
    // Refresh notifications every 2 minutes
    const interval = setInterval(fetchNotifications, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const root = window.document.documentElement
    if (isDark) {
      root.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      root.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }, [isDark])

  const fetchBCVRate = async () => {
    try {
      const status = await api.getBCVStatus()
      if (status && status.currentRate) {
        const rate = typeof status.currentRate === 'object' ? status.currentRate.rate : status.currentRate
        setBcvRate(typeof rate === 'number' ? rate : Number(rate))
      }
    } catch (error) {
      console.error("Error fetching BCV rate:", error)
    }
  }

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true)
      const data = await api.getAdminUnreadNotifications()
      setNotifications(data)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoadingNotifications(false)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markAdminNotificationRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await api.markAllAdminNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: es })
    } catch (e) {
      return "Recientemente"
    }
  }

  const handleUpdateBcv = async () => {
    setUpdatingBcv(true)
    try {
      const result = await api.forceBCVUpdate()
      const rate = typeof result.rate === 'object' ? (result.rate as any).rate : result.rate
      setBcvRate(Number(rate))
    } catch (error) {
      console.error("Error updating BCV rate:", error)
    } finally {
      setUpdatingBcv(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  // Breadcrumb logic
  const pathnames = location.pathname.split("/").filter((x) => x)
  const breadcrumbs = pathnames.map((name, index) => {
    const routeTo = `/${pathnames.slice(0, index + 1).join("/")}`
    const isLast = index === pathnames.length - 1
    
    // Format label
    let label = name.charAt(0).toUpperCase() + name.slice(1)
    if (name === "admin") label = "Inicio"
    if (name === "financial") label = "Financiero"
    if (name === "orders") label = "Órdenes"
    if (name === "products") label = "Productos"
    if (name === "categories") label = "Categorías"
    if (name === "customers") label = "Clientes"
    if (name === "inventory") label = "Inventario"
    if (name === "analytics") label = "Reportes"
    if (name === "settings") label = "Configuración"

    return { label, routeTo, isLast }
  })

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/50 bg-card/80 px-6 backdrop-blur-md">
      {/* Left side: Breadcrumbs & Search */}
      <div className="flex flex-1 items-center gap-6">
        <nav className="hidden md:flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Link to="/admin" className="hover:text-primary transition-colors">
            <Home className="h-4 w-4" />
          </Link>
          {breadcrumbs.map((breadcrumb) => (
            breadcrumb.routeTo !== "/admin" && (
              <div key={breadcrumb.routeTo} className="flex items-center gap-2">
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                {breadcrumb.isLast ? (
                  <span className="text-foreground font-bold">{breadcrumb.label}</span>
                ) : (
                  <Link to={breadcrumb.routeTo} className="hover:text-primary transition-colors">
                    {breadcrumb.label}
                  </Link>
                )}
              </div>
            )
          ))}
        </nav>

        <div className="relative w-full max-w-xs hidden lg:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Buscar productos, órdenes, clientes..." 
            className="pl-10 bg-secondary/50 border-none focus-visible:ring-primary/20"
          />
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* View Shop */}
        <Button
          variant="ghost"
          size="sm"
          className="hidden lg:flex gap-2 text-muted-foreground hover:text-primary transition-colors font-bold"
          asChild
        >
          <Link to="/">
            <ExternalLink className="h-4 w-4" />
            <span>Ver Tienda</span>
          </Link>
        </Button>

        {/* Quick Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" size="sm" className="hidden sm:flex gap-2 font-bold shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" />
              <span>Acción Rápida</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Crear Nuevo</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate("/admin/products?action=new")}>
              <Plus className="h-4 w-4 text-muted-foreground" />
              <span>Producto</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate("/admin/categories?action=new")}>
              <Plus className="h-4 w-4 text-muted-foreground" />
              <span>Categoría</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate("/admin/orders?action=new")}>
              <Plus className="h-4 w-4 text-muted-foreground" />
              <span>Orden</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* BCV Rate */}
        <div className="hidden items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold  lg:flex">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Tasa BCV: {typeof bcvRate === 'number' && !isNaN(bcvRate) ? `${bcvRate.toFixed(2)} Bs/$` : "Cargando..."}</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full hover:bg-primary/20 hover:text-primary"
            onClick={handleUpdateBcv}
            disabled={updatingBcv}
          >
            <RefreshCw className={`h-3 w-3 ${updatingBcv ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsDark(!isDark)}
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary transition-colors">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge className="absolute -right-1 -top-1 h-4 w-4 justify-center bg-destructive p-0 text-[10px] text-destructive-foreground hover:bg-destructive">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notificaciones
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-auto px-2 py-1 text-xs text-primary font-bold"
                  onClick={handleMarkAllRead}
                >
                  Marcar todas como leídas
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {loadingNotifications && notifications.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">Cargando...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No hay notificaciones nuevas
                </div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem 
                    key={notification.id} 
                    className={cn(
                      "flex flex-col items-start gap-1 p-3 cursor-pointer transition-colors",
                      notification.isRead ? "opacity-60 bg-transparent" : "bg-primary/5 hover:bg-primary/10"
                    )}
                    onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className={cn("text-sm text-foreground", !notification.isRead && "font-bold")}>
                        {notification.title}
                      </span>
                      {!notification.isRead && <div className="h-2 w-2 rounded-full bg-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                    <span className="text-[10px] text-muted-foreground/60">
                      {formatTime(notification.createdAt)}
                    </span>
                  </DropdownMenuItem>
                ))
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="justify-center text-xs font-bold text-primary cursor-pointer"
              onClick={() => navigate("/admin/notifications")}
            >
              Ver todas las notificaciones
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6 mx-1 hidden md:block" />

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2 hover:bg-secondary/50 transition-all rounded-xl">
              <div className="h-8 w-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden">
                {user?.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    alt={user.name || ''} 
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=random`
                    }}
                  />
                ) : (
                  user?.name?.charAt(0) || <User className="h-4 w-4" />
                )}
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-xs font-bold leading-tight">{user?.name || "Admin"}</span>
                <span className="text-[10px] text-muted-foreground leading-tight">Administrador</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate("/admin/settings")}>
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span>Configuración</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 cursor-pointer">
              <HelpCircle className="h-4 w-4 text-muted-foreground" />
              <span>Ayuda</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-destructive cursor-pointer focus:text-destructive focus:bg-destructive/10" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
