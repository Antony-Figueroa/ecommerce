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
  Plus,
  ExternalLink,
  Menu,
  ChevronLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { NotificationTray } from "./notification-tray"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { useSocket } from "@/hooks/use-socket"
import { toast } from "@/hooks/use-toast"

interface AdminTopNavProps {
  onMenuClick?: () => void
  onSearchClick?: () => void
  onToggleSidebar?: () => void
}

export function AdminTopNav({ onMenuClick, onSearchClick, onToggleSidebar }: AdminTopNavProps) {
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

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

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
      const data = await api.getAdminUnreadNotifications()
      setNotifications(data)
    } catch (error) {
      console.error("Error fetching notifications:", error)
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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between bg-white dark:bg-background border-b border-neutral-100 dark:border-white/5 px-6 md:px-8">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="md:hidden text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white h-9 w-9 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 shrink-0"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Desktop sidebar toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="hidden md:flex text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300 h-8 w-8 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 shrink-0"
        >
          <ChevronLeft className="h-4 w-4 transition-transform duration-200" />
        </Button>

        <h2 className="hidden text-base font-bold text-neutral-900 dark:text-white md:block">
          {breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : 'Dashboard'}
        </h2>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Search Trigger */}
        <button
          onClick={onSearchClick}
          className="hidden md:flex items-center gap-3 px-3 py-2 bg-neutral-50 dark:bg-card border border-neutral-200 dark:border-white/10 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all text-neutral-400 group"
        >
          <Search className="h-4 w-4 group-hover:text-primary transition-colors" />
          <span className="text-sm font-medium pr-8">Buscar en el sistema...</span>
          <div className="flex items-center gap-1 opacity-60">
            <kbd className="h-5 select-none items-center gap-1 rounded bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 px-1.5 font-mono text-[10px] font-bold">⌘</kbd>
            <kbd className="h-5 select-none items-center gap-1 rounded bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-white/10 px-1.5 font-mono text-[10px] font-bold">K</kbd>
          </div>
        </button>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-neutral-500 hover:text-primary transition-colors font-semibold text-xs px-2 h-9 rounded-lg"
              asChild
            >
              <Link to="/">
                <ExternalLink className="h-4 w-4" />
                <span className="hidden lg:inline ml-2">Ver Tienda</span>
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent className="text-[10px] font-bold">Ver Tienda</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm" className="flex gap-2 font-bold text-xs shadow-sm h-9 px-3 rounded-lg bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nueva</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent className="text-[10px] font-bold">Nueva Acción</TooltipContent>
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

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDark(!isDark)}
              className="text-neutral-500 hover:text-primary transition-colors h-9 w-9 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="text-[10px] font-bold">Modo {isDark ? "claro" : "oscuro"}</TooltipContent>
        </Tooltip>

        {/* Notifications */}
        <Popover open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 rounded-full text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 border-2 border-white dark:border-neutral-900" />}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="p-0 w-[380px] sm:w-[420px] border-none shadow-2xl bg-transparent">
            <NotificationTray variant="admin" onClose={() => setIsNotificationsOpen(false)} />
          </PopoverContent>
        </Popover>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full overflow-hidden border border-neutral-200 dark:border-neutral-700">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="User" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-500 dark:text-neutral-300 font-bold">
                  {user?.name?.charAt(0) || <User className="h-5 w-5" />}
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg border-neutral-200 dark:border-neutral-700 bg-white dark:bg-card p-2">
            <DropdownMenuItem className="gap-2 cursor-pointer rounded-lg dark:hover:bg-neutral-800" onClick={() => navigate("/admin/settings")}>
              <Settings className="h-4 w-4" /> Configuración
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-red-600 cursor-pointer rounded-lg focus:bg-red-50 dark:focus:bg-red-950/30 focus:text-red-700" onClick={handleLogout}>
              <LogOut className="h-4 w-4" /> Salir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
