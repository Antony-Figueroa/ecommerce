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
  ExternalLink,
  Menu
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { Separator } from "@/components/ui/separator"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { useSocket } from "@/hooks/use-socket"
import { toast } from "@/hooks/use-toast"

interface AdminTopNavProps {
  onMenuClick?: () => void
}

export function AdminTopNav({ onMenuClick }: AdminTopNavProps) {
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
  const { on, off } = useSocket()

  // Breadcrumb mapping
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

  useEffect(() => {
    fetchBCVRate()
    fetchNotifications()
    
    // Refresh notifications every 2 minutes
    const interval = setInterval(fetchNotifications, 2 * 60 * 1000)

    // Listen for real-time notifications
    const handleNewNotification = (notification: any) => {
      console.log("New real-time notification received:", notification)
      setNotifications(prev => [notification, ...prev])
      
      // Show toast for urgent notifications
      if (notification.priority === 'URGENT') {
        toast({
          title: notification.title,
          description: notification.message,
          variant: "default",
        })
      }
    }

    on('notification', handleNewNotification)

    return () => {
      clearInterval(interval)
      off('notification', handleNewNotification)
    }
  }, [on, off])

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

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border/40 bg-card/60 px-3 md:px-5 backdrop-blur-xl">
      <TooltipProvider>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden text-muted-foreground hover:text-primary h-9 w-9 rounded-lg hover:bg-primary/5 shrink-0"
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Breadcrumbs */}
          <nav className="hidden sm:flex items-center gap-2 text-xs font-semibold text-muted-foreground/60 min-w-0">
            <Link to="/admin" className="hover:text-primary transition-colors p-1 rounded-md hover:bg-primary/5 shrink-0">
              <Home className="h-3.5 w-3.5" />
            </Link>
            {breadcrumbs.map((breadcrumb) => (
              breadcrumb.routeTo !== "/admin" && (
                <div key={breadcrumb.routeTo} className="flex items-center gap-1.5 min-w-0">
                  <ChevronRight size={10} className="text-muted-foreground/30 shrink-0" strokeWidth={3} />
                  <Link 
                    to={breadcrumb.routeTo} 
                    className={cn(
                      "transition-colors hover:text-primary px-1.5 py-0.5 rounded-md hover:bg-primary/5 truncate max-w-[120px]",
                      breadcrumb.isLast && "text-foreground font-bold"
                    )}
                  >
                    {breadcrumb.label}
                  </Link>
                </div>
              )
            ))}
          </nav>
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {/* Search - hidden on small screens */}
          <div className="hidden xl:flex items-center gap-2 mr-1">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
              <Input 
                placeholder="Buscar..." 
                className="w-48 pl-8 h-8 bg-secondary/30 border-none focus-visible:ring-primary/20 rounded-lg text-xs font-medium transition-all focus:w-56"
              />
            </div>
          </div>
          
          {/* View Shop */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-primary transition-colors font-semibold text-xs px-2 h-8"
                asChild
              >
                <Link to="/">
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="hidden lg:inline ml-1.5">Ver Tienda</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ver Tienda</TooltipContent>
          </Tooltip>

          {/* Quick Actions */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm" className="flex gap-1.5 font-semibold text-xs shadow-sm h-8 px-2.5">
                    <Plus className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Nueva</span>
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Nueva Acción Rápida</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">Crear Nuevo</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 cursor-pointer text-xs" onClick={() => navigate("/admin/products?action=new")}>
                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Producto</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer text-xs" onClick={() => navigate("/admin/categories?action=new")}>
                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Categoría</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer text-xs" onClick={() => navigate("/admin/orders?action=new")}>
                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Orden</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* BCV Rate - hidden on smaller screens */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden 2xl:flex items-center gap-2 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold">
                <TrendingUp className="h-3 w-3" />
                <span>BCV: {typeof bcvRate === 'number' && !isNaN(bcvRate) ? `${bcvRate.toFixed(2)} Bs/$` : "..."}</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5 rounded-full hover:bg-primary/20 hover:text-primary"
                  onClick={handleUpdateBcv}
                  disabled={updatingBcv}
                >
                  <RefreshCw className={`h-2.5 w-2.5 ${updatingBcv ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>Actualizar Tasa BCV</TooltipContent>
          </Tooltip>

          {/* Theme Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDark(!isDark)}
                className="text-muted-foreground hover:text-primary transition-colors h-9 w-9 rounded-lg hover:bg-primary/5"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Modo {isDark ? "claro" : "oscuro"}</TooltipContent>
          </Tooltip>

          {/* Notifications */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary transition-colors h-9 w-9 rounded-lg hover:bg-primary/5">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive animate-pulse" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Notificaciones</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel className="flex items-center justify-between text-xs">
                Notificaciones
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-auto px-1.5 py-0.5 text-[10px] text-primary font-semibold"
                    onClick={handleMarkAllRead}
                  >
                    Marcar leídas
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-64 overflow-y-auto">
                {loadingNotifications && notifications.length === 0 ? (
                  <div className="p-3 text-center text-[10px] text-muted-foreground">Cargando...</div>
                ) : notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    No hay notificaciones nuevas
                  </div>
                ) : (
                  notifications.slice(0, 5).map((notification) => (
                    <DropdownMenuItem 
                      key={notification.id} 
                      className={cn(
                        "flex flex-col items-start gap-1 p-2.5 cursor-pointer transition-colors",
                        notification.isRead ? "opacity-60 bg-transparent" : "bg-primary/5 hover:bg-primary/10"
                      )}
                      onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className={cn("text-xs text-foreground", !notification.isRead && "font-semibold")}>
                          {notification.title}
                        </span>
                        {!notification.isRead && <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 ml-1" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="justify-center text-[10px] font-semibold text-primary cursor-pointer"
                onClick={() => navigate("/admin/notifications")}
              >
                Ver todas
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-5 mx-0.5 hidden md:block" />

          {/* User Profile */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-1.5 hover:bg-secondary/50 transition-all rounded-lg h-9">
                    <div className="h-7 w-7 rounded-md bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] shadow-sm overflow-hidden">
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
                        user?.name?.charAt(0) || <User className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-[11px] font-semibold leading-tight">{user?.name || "Admin"}</span>
                      <span className="text-[9px] text-muted-foreground leading-tight">Admin</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Perfil</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 cursor-pointer text-xs" onClick={() => navigate("/admin/settings")}>
                <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 cursor-pointer text-xs">
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Ayuda</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-destructive cursor-pointer focus:text-destructive focus:bg-destructive/10 text-xs" onClick={handleLogout}>
                <LogOut className="h-3.5 w-3.5" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TooltipProvider>
    </header>
  )
}
