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
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Truck,
  Bell,
  LogOut,
  Leaf,
  Shield,
  Kanban,
  BookOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { AdminTopNav } from "./admin-top-nav"
import { Sheet, SheetContent } from "@/components/ui/sheet"
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
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [pendingOrders, setPendingOrders] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)
  const location = useLocation()
  const { user, logout } = useAuth()

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
        { path: "/admin/kanban", label: "Tablero Kanban", icon: Kanban },
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

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full bg-card select-none">
      {/* Logo Section */}
      <div className={cn(
        "flex h-12 items-center px-3 transition-all duration-200 ease-out border-b border-border/40",
        sidebarOpen || isMobile ? "justify-between" : "justify-center"
      )}>
        {(sidebarOpen || isMobile) ? (
          <Link to="/admin" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:shadow-md transition-all duration-200">
              <Leaf className="h-4 w-4" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="font-bold text-xs leading-none tracking-tight text-foreground uppercase whitespace-nowrap">Ana's Admin</span>
              <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider whitespace-nowrap">Supplements</span>
            </div>
          </Link>
        ) : (
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center shadow-sm">
            <Leaf className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-3 px-2 space-y-4">
        {menuGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {(sidebarOpen || isMobile) && (
              <h3 className="px-2 text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground/50 mb-1.5">
                {group.title}
              </h3>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== "/admin" && location.pathname.startsWith(item.path))
                const Icon = item.icon
                const isCollapsed = !sidebarOpen && !isMobile

                const navLink = (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => isMobile && setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2.5 py-2 rounded-lg transition-all duration-150 ease-out group relative",
                      isCollapsed ? "justify-center px-2" : "px-2.5",
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground font-medium text-sm"
                    )}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <div className={cn(
                        "absolute bg-primary rounded-r-full opacity-0 animate-in fade-in duration-200",
                        isCollapsed ? "left-0 top-1/2 -translate-y-1/2 w-0.5 h-3" : "left-0 top-1/2 -translate-y-1/2 w-0.5 h-3"
                      )} />
                    )}

                    <div className={cn(
                      "flex items-center justify-center transition-colors duration-150 shrink-0",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}>
                      <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                    </div>

                    {(item.badge || item.alert) && isCollapsed && (
                      <div className={cn(
                        "absolute -top-0.5 -right-0.5 h-3 min-w-[12px] px-1 flex items-center justify-center rounded-full text-[8px] font-bold",
                        item.alert ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-primary text-primary-foreground"
                      )}>
                        {item.badge}
                      </div>
                    )}

                    {(sidebarOpen || isMobile) && (
                      <span className="flex-1 text-xs truncate opacity-100 transition-opacity duration-150">{item.label}</span>
                    )}

                    {(item.badge || item.alert) && (sidebarOpen || isMobile) && (
                      <div className={cn(
                        "h-4 min-w-[14px] px-1 flex items-center justify-center rounded-full text-[9px] font-bold",
                        item.alert ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-primary text-primary-foreground"
                      )}>
                        {item.badge}
                      </div>
                    )}
                  </Link>
                )

                if (!sidebarOpen && !isMobile) {
                  return (
                    <TooltipProvider key={item.path} delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {navLink}
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={10} className="font-semibold text-xs">
                          {item.label}
                          {item.badge && <span className="ml-1.5 text-primary">{item.badge}</span>}
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

      {/* User Footer */}
      <div className="p-2 border-t border-border/40 bg-card/50 backdrop-blur-sm">
        <div className={cn(
          "flex items-center gap-2 p-1.5 rounded-lg transition-all duration-150 ease-out",
          sidebarOpen || isMobile ? "hover:bg-secondary/50" : "justify-center"
        )}>
          <div className="h-7 w-7 rounded-md bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center text-secondary-foreground font-bold text-[10px] shrink-0 ring-1 ring-border/30 shadow-sm">
            {user?.name?.charAt(0) || 'A'}
          </div>

          {(sidebarOpen || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-foreground truncate uppercase tracking-tight">
                {user?.name || 'Admin User'}
              </p>
              <p className="text-[9px] text-muted-foreground truncate font-medium">
                {user?.email}
              </p>
            </div>
          )}

          {(sidebarOpen || isMobile) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 transition-colors duration-150"
            >
              <LogOut size={12} />
            </Button>
          )}
        </div>

        {!isMobile && (
          <div className="mt-1.5 flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-7 w-full flex items-center justify-center text-muted-foreground hover:bg-secondary/60 rounded-md group transition-colors duration-150"
            >
              {sidebarOpen ? (
                <div className="flex items-center gap-1.5">
                  <ChevronLeft size={12} className="transition-transform duration-150 group-hover:-translate-x-0.5" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Colapsar</span>
                </div>
              ) : (
                <ChevronRight size={12} className="transition-transform duration-150 group-hover:translate-x-0.5" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-secondary/20">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen transition-all duration-200 ease-out hidden md:block border-r border-border/30",
          sidebarOpen ? "w-56" : "w-[60px]"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-[280px] border-none shadow-2xl [&>button]:opacity-0">
          <div className="animate-in slide-in-from-left duration-200">
            <SidebarContent isMobile />
          </div>
        </SheetContent>
      </Sheet>

      <div className={cn(
        "transition-all duration-200 ease-out min-h-screen flex flex-col",
        sidebarOpen ? "md:ml-56" : "md:ml-[60px]"
      )}>
        <AdminTopNav onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="p-4 md:px-5 md:py-6 flex-1 overflow-hidden">
          <div className="max-w-full mx-auto w-full animate-in fade-in duration-200">
            <Suspense fallback={<PageLoader />}>
              {children || <Outlet />}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
