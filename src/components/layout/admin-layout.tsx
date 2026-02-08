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
  Menu,
  X,
  DollarSign,
  Leaf,
  Bell,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { AdminTopNav } from "./admin-top-nav"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { PageLoader } from "@/components/shared/page-loader"

interface AdminLayoutProps {
  children?: React.ReactNode
  title?: string
}

const menuItems = [
  { path: "/admin", label: "Inicio", icon: LayoutDashboard },
  { path: "/admin/financial", label: "Financiero", icon: DollarSign },
  { path: "/admin/orders", label: "Pedidos", icon: ShoppingCart, badge: 5 },
  { path: "/admin/products", label: "Productos", icon: Package },
  { path: "/admin/categories", label: "Categorías", icon: Tag },
  { path: "/admin/customers", label: "Clientes", icon: Users },
  { path: "/admin/inventory", label: "Inventario", icon: Box, alert: true },
  { path: "/admin/analytics", label: "Reportes", icon: BarChart3 },
  { path: "/admin/notifications", label: "Notificaciones", icon: Bell },
  { path: "/admin/settings", label: "Configuración", icon: Settings },
]

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    if (title) {
      document.title = `${title} | Ana's Supplements Admin`
    }
  }, [title])

  const SidebarContent = ({ isMobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border/50 bg-card">
        {(sidebarOpen || isMobile) && (
          <Link to="/admin" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
              <Leaf className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-foreground">Admin</span>
          </Link>
        )}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3 space-y-1 flex-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== "/admin" && location.pathname.startsWith(item.path))
          const Icon = item.icon
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => isMobile && setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-[1.02]"
                  : "text-muted-foreground hover:bg-secondary hover:text-primary hover:pl-5"
              }`}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-primary-foreground" : "text-muted-foreground/70"}`} />
              {(sidebarOpen || isMobile) && (
                <span className="flex-1">{item.label}</span>
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Desktop Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen transition-all duration-300 hidden md:block ${
          sidebarOpen ? "w-64" : "w-20"
        } bg-card border-r border-border/50`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64 border-none">
          <SidebarContent isMobile />
        </SheetContent>
      </Sheet>

      <div className={`transition-all duration-300 ${sidebarOpen ? "md:ml-64" : "md:ml-20"}`}>
        <AdminTopNav onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="p-4 md:p-6">
          <div className="w-full overflow-hidden">
            <Suspense fallback={<PageLoader />}>
              {children || <Outlet />}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
