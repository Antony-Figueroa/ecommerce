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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { AdminTopNav } from "./admin-top-nav"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { PageLoader } from "@/components/shared/page-loader"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
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

const menuGroups: MenuGroup[] = [
  {
    title: "Principal",
    items: [
      { path: "/admin", label: "Inicio", icon: LayoutDashboard },
      { path: "/admin/financial", label: "Financiero", icon: DollarSign },
      { path: "/admin/orders", label: "Pedidos", icon: ShoppingCart, badge: 5 },
    ]
  },
  {
    title: "Catálogo",
    items: [
      { path: "/admin/products", label: "Productos", icon: Package },
      { path: "/admin/categories", label: "Categorías", icon: Tag },
      { path: "/admin/providers", label: "Proveedores", icon: Truck },
      { path: "/admin/inventory", label: "Inventario", icon: Box, alert: true },
    ]
  },
  {
    title: "Gestión",
    items: [
      { path: "/admin/customers", label: "Clientes", icon: Users },
      { path: "/admin/analytics", label: "Reportes", icon: BarChart3 },
      { path: "/admin/notifications", label: "Notificaciones", icon: Bell },
    ]
  },
  {
    title: "Sistema",
    items: [
      { path: "/admin/settings", label: "Configuración", icon: Settings },
    ]
  }
]

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const { user, logout } = useAuth()

  useEffect(() => {
    if (title) {
      document.title = `${title} | Ana's Supplements Admin`
    }
  }, [title])

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full bg-card select-none">
      {/* Logo Section */}
      <div className={cn(
        "flex h-16 items-center px-4 transition-all duration-300 border-b border-border/40",
        sidebarOpen || isMobile ? "justify-between" : "justify-center"
      )}>
        {(sidebarOpen || isMobile) ? (
          <Link to="/admin" className="flex items-center gap-2 group">
            <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 active:scale-95">
              <Leaf className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm leading-none tracking-tight text-foreground uppercase">Ana's Admin</span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Supplements</span>
            </div>
          </Link>
        ) : (
          <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
            <Leaf className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-4 px-3 space-y-6">
        {menuGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {(sidebarOpen || isMobile) && (
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60 mb-2">
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
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                      isActive 
                        ? "bg-primary/10 text-primary font-bold shadow-sm" 
                        : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground font-medium"
                    )}
                  >
                    <div className={cn(
                      "flex items-center justify-center transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}>
                      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    
                    {(sidebarOpen || isMobile) && (
                      <span className="flex-1 text-sm truncate">{item.label}</span>
                    )}

                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
                    )}

                    {(item.badge || item.alert) && (sidebarOpen || isMobile) && (
                      <div className={cn(
                        "h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold",
                        item.alert ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
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
                        <TooltipContent side="right" sideOffset={10} className="font-bold">
                          {item.label}
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
      <div className="p-3 border-t border-border/40 bg-card/50 backdrop-blur-sm">
        <div className={cn(
          "flex items-center gap-3 p-2 rounded-xl transition-all duration-200",
          sidebarOpen || isMobile ? "hover:bg-secondary/50" : "justify-center"
        )}>
          <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-xs shrink-0 ring-1 ring-border/50">
            {user?.name?.charAt(0) || 'A'}
          </div>
          
          {(sidebarOpen || isMobile) && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate uppercase tracking-tight">
                {user?.name || 'Admin User'}
              </p>
              <p className="text-[10px] text-muted-foreground truncate font-medium">
                {user?.email}
              </p>
            </div>
          )}
          
          {(sidebarOpen || isMobile) && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={logout}
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
            >
              <LogOut size={14} />
            </Button>
          )}
        </div>
        
        {!isMobile && (
          <div className="mt-2 flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-8 w-full flex items-center justify-center text-muted-foreground hover:bg-secondary/80 rounded-lg group"
            >
              {sidebarOpen ? (
                <div className="flex items-center gap-2">
                  <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Colapsar</span>
                </div>
              ) : (
                <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
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
          "fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out hidden md:block border-r border-border/40 shadow-sm",
          sidebarOpen ? "w-64" : "w-[72px]"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-[280px] border-none shadow-2xl">
          <SidebarContent isMobile />
        </SheetContent>
      </Sheet>

      <div className={cn(
        "transition-all duration-300 ease-in-out min-h-screen flex flex-col",
        sidebarOpen ? "md:ml-64" : "md:ml-[72px]"
      )}>
        <AdminTopNav onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="p-4 md:p-8 flex-1">
          <div className="max-w-7xl mx-auto w-full">
            <Suspense fallback={<PageLoader />}>
              {children || <Outlet />}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
