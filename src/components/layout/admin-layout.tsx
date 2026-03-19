import { useState, useEffect, Suspense } from "react"
import { Link, useLocation, Outlet } from "react-router-dom"
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Tag,
  BarChart3,
  Settings,
  Box,
  DollarSign,
  Truck,
  Bell,
  LogOut,
  Shield,
  Kanban,
  BookOpen,
} from "lucide-react"
import { AdminTopNav } from "./admin-top-nav"
import { CommandPalette } from "@/components/admin/command-palette"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { PageLoader } from "@/components/shared/page-loader"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface AdminLayoutProps {
  children?: React.ReactNode
  title?: string
}

interface MenuItem {
  path: string
  label: string
  icon: any
  badge?: number
  alert?: boolean
}

interface MenuGroup {
  title: string
  items: MenuItem[]
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("adminSidebarOpen")
      return saved === null ? true : saved === "true"
    }
    return true
  })
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  
  const [pendingOrders, setPendingOrders] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)
  const location = useLocation()
  const { logout } = useAuth()

  useEffect(() => {
    if (title) {
      document.title = `${title} | Ana's Supplements Admin`
    }
  }, [title])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await api.getAdminStats()
        if (stats) {
          // Asegurarse de que el conteo sea un número real
          setPendingOrders(Number(stats.pendingOrders) || 0)
          setLowStockCount(Number(stats.lowStockProducts) || 0)
        }
      } catch (error) {
        console.error("Error fetching admin stats for sidebar:", error)
      }
    }

    fetchStats()
    // Refrescar cada 1 minuto para mayor reactividad
    const interval = setInterval(fetchStats, 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const menuGroups: MenuGroup[] = [
    {
      title: "Principal",
      items: [
        { path: "/admin", label: "Inicio", icon: LayoutDashboard },
        { path: "/admin/financial", label: "Caja", icon: DollarSign },
        { path: "/admin/orders", label: "Pedidos", icon: ShoppingCart, badge: pendingOrders > 0 ? pendingOrders : undefined },
        { path: "/admin/kanban", label: "Tablero", icon: Kanban },
      ]
    },
    {
      title: "Catálogo",
      items: [
        { path: "/admin/products", label: "Productos", icon: Package },
        { path: "/admin/categories", label: "Categorías", icon: Tag },
        { path: "/admin/providers", label: "Proveedores", icon: Truck },
        { path: "/admin/inventory", label: "Inventario", icon: Box, alert: lowStockCount > 0 },
        { path: "/admin/catalog", label: "Catálogo", icon: BookOpen },
      ]
    },
    {
      title: "Gestión",
      items: [
        { path: "/admin/customers", label: "Clientes", icon: Users },
        { path: "/admin/analytics", label: "Análisis", icon: BarChart3 },
        { path: "/admin/notifications", label: "Alertas", icon: Bell },
      ]
    },
    {
      title: "Sistema",
      items: [
        { path: "/admin/audit", label: "Auditoría", icon: Shield },
        { path: "/admin/settings", label: "Configuración", icon: Settings },
      ]
    }
  ]

  const SidebarContent = ({ isMobile = false }) => {
    const isCollapsed = !sidebarOpen && !isMobile

    return (
      <div className="flex flex-col h-full bg-white dark:bg-background select-none border-r border-neutral-100 dark:border-white/5 transition-colors">
        {/* Header: Logo & Branding */}
        <div className={cn(
          "flex h-20 items-center px-6 shrink-0",
          isCollapsed ? "justify-center px-0" : "justify-start"
        )}>
          <Link to="/admin" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black text-lg shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-200">
              A
            </div>
          </Link>
        </div>

        {/* Navigation */}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-3 space-y-6">
          {menuGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1">
              {!isCollapsed && (
                <h3 className="px-3 text-[10px] font-black uppercase tracking-[0.15em] text-neutral-400/70 dark:text-neutral-500/60 mb-3">
                  {group.title}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.path || (item.path !== "/admin" && location.pathname.startsWith(item.path))
                  const Icon = item.icon

                  const navLink = (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => isMobile && setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 py-2.5 rounded-xl transition-all duration-200 ease-in-out group relative",
                        isCollapsed ? "justify-center px-0 w-12 mx-auto" : "px-4",
                        isActive
                          ? "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary font-black shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                          : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/60 dark:hover:text-neutral-100 font-bold text-sm"
                      )}
                    >
                      {/* Active State Accent Rail (Reference Image 1) */}
                      {isActive && !isCollapsed && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                      )}

                      <div className={cn(
                        "flex items-center justify-center transition-colors duration-200 shrink-0",
                        isActive ? "text-primary" : "text-neutral-400 group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-300"
                      )}>
                        <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                      </div>

                      {(item.badge || item.alert) && isCollapsed && (
                        <div className={cn(
                          "absolute top-1 right-1 h-2 w-2 rounded-full shadow-sm",
                          item.alert ? "bg-destructive animate-pulse" : "bg-primary"
                        )} />
                      )}

                      {!isCollapsed && (
                        <span className="flex-1 text-xs truncate transition-all duration-200">{item.label}</span>
                      )}

                      {(item.badge || item.alert) && !isCollapsed && (
                        <div className={cn(
                          "h-5 min-w-[20px] px-1.5 flex items-center justify-center rounded-lg text-[10px] font-black shadow-sm",
                          item.alert
                            ? "bg-destructive/10 text-destructive border border-destructive/20 animate-pulse"
                            : "bg-primary text-primary-foreground"
                        )}>
                          {item.badge || "!"}
                        </div>
                      )}
                    </Link>
                  )

                  if (isCollapsed) {
                    return (
                      <TooltipProvider key={item.path} delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {navLink}
                          </TooltipTrigger>
                          <TooltipContent side="right" sideOffset={15} className="font-black text-[10px] uppercase tracking-wider bg-neutral-900 text-white border-neutral-800">
                            {item.label}
                            {item.badge && <span className="ml-2 font-mono text-primary">{item.badge}</span>}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  }

                  return navLink
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Area */}
        <div className="p-3 border-t border-neutral-100 dark:border-white/5 bg-transparent shrink-0">
          <button
            onClick={logout}
            className={cn(
              "w-full flex items-center gap-3 py-2.5 px-4 rounded-xl text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-all font-bold text-sm",
              isCollapsed && "justify-center px-0"
            )}
          >
            <LogOut size={18} className="shrink-0" />
            {!isCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="min-h-screen bg-slate-50 dark:bg-background">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "fixed left-0 top-0 z-40 h-screen transition-all duration-200 ease-out hidden md:block border-r border-border/30",
            sidebarOpen ? "w-56" : "w-20"
          )}
        >
          <SidebarContent />
        </aside>

        {/* Mobile Sidebar (Sheet) */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-[280px] border-none shadow-2xl [&>button]:opacity-0">
            <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
            <SheetDescription className="sr-only">Panel de navegación del administrador</SheetDescription>
            <div className="animate-in slide-in-from-left duration-200">
              <SidebarContent isMobile />
            </div>
          </SheetContent>
        </Sheet>

        <div className={cn(
          "transition-all duration-200 ease-out min-h-screen flex flex-col",
          sidebarOpen ? "md:ml-56" : "md:ml-20"
        )}>
          <AdminTopNav
            onMenuClick={() => setIsMobileMenuOpen(true)}
            onSearchClick={() => setIsSearchOpen(true)}
          />
          <main className="p-4 md:p-6 flex-1">
            <div className="max-w-7xl mx-auto w-full animate-in fade-in duration-200">
              <Suspense fallback={<PageLoader />}>
                {children || <Outlet />}
              </Suspense>
            </div>
          </main>
        </div>

        <CommandPalette open={isSearchOpen} onOpenChange={setIsSearchOpen} />
      </div>
    </TooltipProvider>
  )
}
