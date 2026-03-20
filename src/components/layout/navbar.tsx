import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { Search, ShoppingCart, Menu, ChevronDown, Leaf, Sun, Moon, User, LayoutDashboard, LogOut, ArrowRight, Phone, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"
import type { Category } from "@/types"
import { cn } from "@/lib/utils"
import { NotificationBell } from "./notification-bell"

const navLinks = [
  { name: "Inicio", href: "/" },
  { name: "Productos", href: "/productos" },
]

export function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { totalItems } = useCart()
  const { user, logout } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark") ||
        localStorage.getItem("theme") === "dark"
    }
    return false
  })
  const location = useLocation()

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

  useEffect(() => {
    api.getCategories().then(res => {
      setCategories(res.categories || [])
    }).catch(() => { })
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b border-border/50">
      {/* Top Bar - Promotional or Info (Optional) */}
      <div className="bg-primary py-2 px-4 text-center text-[10px] sm:text-xs font-bold text-primary-foreground uppercase tracking-widest">
        Envío rápido y seguro en todos tus productos de salud
      </div>

      <div className="container mx-auto px-4">
        {/* Main Header - Logo, Search, Actions */}
        <div className="flex h-20 items-center justify-between gap-4 sm:gap-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-105">
              <Leaf className="h-6 w-6" />
            </div>
            <span className="hidden sm:block text-2xl font-black tracking-tighter text-foreground italic">
              Ana's <span className="text-primary not-italic">Supplements</span>
            </span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl relative">
            <div className="relative w-full group">
              <Input
                type="search"
                placeholder="Busca por nombre o categoría..."
                className="w-full h-12 pl-12 bg-secondary/50 border-none rounded-2xl focus-visible:ring-primary focus-visible:bg-secondary/80 transition-all text-sm font-medium"
              />
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-muted-foreground hover:text-primary h-10 w-10"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-primary bg-secondary/50 rounded-xl h-10 w-10"
              onClick={() => setIsDark(!isDark)}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span className="sr-only">Cambiar tema</span>
            </Button>

            {user ? (
              <>
                <Link to="/carrito">
                  <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary bg-secondary/50 rounded-xl h-10 w-10">
                    <ShoppingCart className="h-5 w-5" />
                    {totalItems > 0 && (
                      <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground font-black">
                        {totalItems}
                      </Badge>
                    )}
                  </Button>
                </Link>
                <NotificationBell />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 px-1 sm:px-2 hover:bg-secondary/50 rounded-xl h-10">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary overflow-hidden flex-shrink-0 shadow-inner">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.name || ''}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=random`
                            }}
                          />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </div>
                      <div className="hidden lg:flex flex-col items-start text-left">
                        <span className="text-xs font-bold leading-none">{user.name}</span>
                        <span className="text-[10px] text-muted-foreground leading-none mt-1">Mi cuenta</span>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-2 rounded-2xl shadow-xl border-border/50">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="font-bold">{user.name}</span>
                        <span className="text-xs text-muted-foreground font-normal">{user.email}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {user.role === 'ADMIN' && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="flex items-center gap-2"><LayoutDashboard className="h-4 w-4" /> Panel Admin</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/perfil">Mi Perfil</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/pedidos">Mis Pedidos</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/favoritos">Mis Favoritos</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                      onClick={logout}
                    >
                      <LogOut className="h-4 w-4 mr-2" /> Cerrar Sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to="/login" className="hidden sm:block">
                  <Button variant="ghost" size="sm" className="font-bold h-10 px-4 rounded-xl">Iniciar Sesión</Button>
                </Link>
                <Link to="/registro">
                  <Button size="sm" className="font-bold h-10 px-4 rounded-xl shadow-lg shadow-primary/20">Regístrate</Button>
                </Link>
              </>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-10 w-10">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] rounded-r-3xl border-none shadow-2xl">
                <SheetTitle className="sr-only">Menú principal</SheetTitle>
                <SheetDescription className="sr-only">Navegación de la tienda</SheetDescription>
                {/* Mobile Navigation Content */}
                <div className="flex flex-col h-full py-6 px-2">
                  <Link to="/" className="flex items-center gap-3 mb-8 px-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                      <Leaf className="h-5 w-5" />
                    </div>
                    <span className="text-xl font-black tracking-tight text-foreground">Ana's Supplements</span>
                  </Link>
                  <nav className="flex flex-col gap-2 px-4">
                    {navLinks.map((link) => (
                      <Link
                        key={link.name}
                        to={link.href}
                        className="text-lg font-bold py-3 text-muted-foreground hover:text-primary transition-colors"
                      >
                        {link.name}
                      </Link>
                    ))}
                    <Separator className="my-4" />
                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Categorías</span>
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/productos/${cat.slug}`}
                        className="text-base font-medium py-2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </nav>
                  {!user && (
                    <div className="mt-auto pt-4 px-4 space-y-3">
                      <Separator className="mb-4" />
                      <Link to="/login" className="block">
                        <Button variant="outline" className="w-full font-bold rounded-xl">Iniciar Sesión</Button>
                      </Link>
                      <Link to="/registro" className="block">
                        <Button className="w-full font-bold rounded-xl shadow-lg shadow-primary/20">Regístrate</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Bottom Bar - Navigation Links */}
        <div className="hidden md:flex h-14 items-center gap-8 border-t border-border/30">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 font-black text-xs uppercase tracking-widest text-foreground hover:text-primary px-0">
                <Menu className="h-4 w-4" />
                Categorías
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 rounded-2xl shadow-xl border-border/50 p-2">
              <ScrollArea className="h-[400px]">
                {categories.map((category) => (
                  <DropdownMenuItem key={category.id} asChild className="rounded-xl py-3">
                    <Link to={`/productos/${category.slug}`} className="flex items-center justify-between w-full group">
                      <span className="font-bold text-sm">{category.name}</span>
                      <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-primary" />
                    </Link>
                  </DropdownMenuItem>
                ))}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>

          <nav className="flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href
              return (
                <Link
                  key={link.name}
                  to={link.href}
                  className={cn(
                    "text-xs font-black uppercase tracking-widest transition-colors relative py-1",
                    isActive
                      ? "text-primary after:absolute after:bottom-[-4px] after:left-0 after:right-0 after:h-1 after:bg-primary after:rounded-full"
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  {link.name}
                </Link>
              )
            })}
          </nav>

          <div className="ml-auto flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <div className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-primary" /> Atención 24/7</div>
            <div className="flex items-center gap-1.5"><Shield className="h-3 w-3 text-primary" /> Calidad Garantizada</div>
          </div>
        </div>
      </div>
    </header>
  )
}
