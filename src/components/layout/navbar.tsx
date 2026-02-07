import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { Search, ShoppingCart, Menu, ChevronDown, Leaf, Sun, Moon, User, LayoutDashboard, LogOut, Star, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
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
  { name: "Ofertas", href: "/ofertas" },
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
    }).catch(() => {})
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex h-16 items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-8 min-w-0">
            <Link to="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
                <Leaf className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <span className="hidden text-base sm:text-xl font-extrabold tracking-tight text-foreground xs:block truncate">
                Ana's Supplements
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-4 lg:gap-6">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.href
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={cn(
                      "text-sm font-semibold transition-colors relative py-1 whitespace-nowrap",
                      isActive 
                        ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full" 
                        : "text-muted-foreground hover:text-primary"
                    )}
                  >
                    {link.name}
                  </Link>
                )
              })}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-1 font-semibold text-muted-foreground hover:text-primary px-2">
                    Categorías
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Todas las categorías</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {categories.map((category) => (
                    <DropdownMenuItem key={category.id} asChild>
                            <Link to={`/productos/${category.slug}`}>
                              {category.name}
                            </Link>
                          </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="hidden lg:block relative">
              <Input
                type="search"
                placeholder="Buscar productos..."
                className="w-48 xl:w-64 pl-9 bg-secondary/50 border-none focus-visible:ring-primary"
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-muted-foreground hover:text-primary h-11 w-11 sm:h-10 sm:w-10"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-primary bg-secondary/50 rounded-lg h-11 w-11 sm:h-10 sm:w-10"
              onClick={() => setIsDark(!isDark)}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span className="sr-only">Cambiar tema</span>
            </Button>

            {user && (
              <Link to="/carrito">
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary bg-secondary/50 rounded-lg h-11 w-11 sm:h-10 sm:w-10">
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <Badge
                      className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground font-black"
                    >
                      {totalItems}
                    </Badge>
                  )}
                  <span className="sr-only">Carrito</span>
                </Button>
              </Link>
            )}
            
            {user && <NotificationBell />}

            <Separator orientation="vertical" className="h-6 hidden lg:block" />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-1 sm:px-2 hover:bg-secondary/50 rounded-lg h-11 sm:h-10">
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-primary/10 text-primary overflow-hidden flex-shrink-0">
                      {user.avatarUrl ? (
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
                        <User className="h-4 w-4" />
                      )}
                    </div>
                    <div className="hidden xl:flex flex-col items-start text-left">
                      <span className="text-xs font-bold leading-none">{user.name}</span>
                      <span className="text-[10px] text-muted-foreground leading-none mt-1">Mi cuenta</span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
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
                        <Link to="/admin">Panel de Administración</Link>
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
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="font-bold h-10 px-4">Iniciar Sesión</Button>
                </Link>
                <Link to="/registro">
                  <Button size="sm" className="font-bold h-10 px-4">Regístrate</Button>
                </Link>
              </div>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-11 w-11">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[350px] pr-0">
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-2 px-6 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                      <Leaf className="h-6 w-6" />
                    </div>
                    <span className="text-xl font-black tracking-tight text-primary">
                      Ana's Supplements
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <ScrollArea className="flex-1 px-6 py-4">
                    <div className="space-y-6">
                      <nav className="flex flex-col gap-2">
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Navegación</div>
                        {navLinks.map((link) => (
                          <Link
                            key={link.name}
                            to={link.href}
                            className="px-2 py-2.5 text-base font-bold hover:text-primary transition-colors flex items-center justify-between group"
                          >
                            {link.name}
                            <ChevronDown className="h-4 w-4 -rotate-90 opacity-0 group-hover:opacity-100 transition-all" />
                          </Link>
                        ))}
                      </nav>

                      <Separator />

                      <div className="space-y-4">
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Categorías</div>
                        <div className="grid grid-cols-1 gap-1">
                          {categories.map((category) => (
                            <Link
                              key={category.id}
                              to={`/productos/${category.slug}`}
                              className="px-2 py-2 text-sm font-medium hover:text-primary transition-colors"
                            >
                              {category.name}
                            </Link>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {user ? (
                        <div className="space-y-4">
                          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Mi Cuenta</div>
                          <div className="flex items-center gap-3 p-2 bg-secondary/30 rounded-xl">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary overflow-hidden">
                              {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.name || ''} className="h-full w-full object-cover" />
                              ) : (
                                <User className="h-5 w-5" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold truncate max-w-[150px]">{user.name}</span>
                              <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{user.email}</span>
                            </div>
                          </div>
                          <nav className="flex flex-col gap-1">
                            {user.role === 'ADMIN' && (
                              <Link to="/admin" className="px-2 py-2 text-sm font-bold hover:text-primary flex items-center gap-2">
                                <LayoutDashboard className="h-4 w-4" /> Panel Admin
                              </Link>
                            )}
                            <Link to="/perfil" className="px-2 py-2 text-sm font-bold hover:text-primary flex items-center gap-2">
                              <User className="h-4 w-4" /> Mi Perfil
                            </Link>
                            <Link to="/pedidos" className="px-2 py-2 text-sm font-bold hover:text-primary flex items-center gap-2">
                              <ShoppingCart className="h-4 w-4" /> Mis Pedidos
                            </Link>
                            <Link to="/favoritos" className="px-2 py-2 text-sm font-bold hover:text-primary flex items-center gap-2">
                              <Star className="h-4 w-4" /> Mis Favoritos
                            </Link>
                            <button 
                              onClick={logout}
                              className="px-2 py-2 text-sm font-bold text-destructive flex items-center gap-2 hover:bg-destructive/5 rounded-lg transition-colors mt-2"
                            >
                              <LogOut className="h-4 w-4" /> Cerrar Sesión
                            </button>
                          </nav>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 pt-2">
                          <Link to="/login" className="w-full">
                            <Button variant="outline" className="w-full font-bold h-11">Iniciar Sesión</Button>
                          </Link>
                          <Link to="/registro" className="w-full">
                            <Button className="w-full font-bold h-11">Regístrate</Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile Search Bar Overlay */}
        {isSearchOpen && (
          <div className="md:hidden py-4 border-t border-border/50 animate-in slide-in-from-top duration-300">
            <div className="relative">
              <Input
                type="search"
                placeholder="Buscar productos..."
                className="w-full pl-10 h-12 bg-secondary/50 border-none focus-visible:ring-primary text-base"
                autoFocus
              />
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={() => setIsSearchOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
