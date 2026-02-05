import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { Search, ShoppingCart, Menu, ChevronDown, Leaf, Sun, Moon, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"
import type { Category } from "@/types"
import { cn } from "@/lib/utils"

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
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
                <Leaf className="h-6 w-6" />
              </div>
              <span className="hidden text-xl font-extrabold tracking-tight text-foreground sm:block">
                Ana's Supplements
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.href
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={cn(
                      "text-sm font-semibold transition-colors relative py-1",
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
                  <Button variant="ghost" size="sm" className="gap-1 font-semibold text-muted-foreground hover:text-primary">
                    Categorías
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Todas las categorías</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {categories.map((category) => (
                    <DropdownMenuItem key={category.id} asChild>
                      <Link to={`/productos?category=${category.slug}`}>
                        {category.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block relative">
              <Input
                type="search"
                placeholder="Buscar productos..."
                className="w-64 pl-9 bg-secondary/50 border-none focus-visible:ring-primary"
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden text-muted-foreground hover:text-primary"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-primary bg-secondary/50 rounded-lg size-10"
              onClick={() => setIsDark(!isDark)}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span className="sr-only">Cambiar tema</span>
            </Button>

            <Link to="/carrito">
              <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-primary bg-secondary/50 rounded-lg size-10">
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

            <Separator orientation="vertical" className="h-6 hidden sm:block" />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2 hover:bg-secondary/50 rounded-lg">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary overflow-hidden">
                      {user.avatarUrl ? (
                        <img 
                          src={user.avatarUrl} 
                          alt={user.name || ''} 
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
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
                  <Button variant="ghost" size="sm" className="font-bold">Iniciar Sesión</Button>
                </Link>
                <Link to="/registro">
                  <Button size="sm" className="font-bold">Regístrate</Button>
                </Link>
              </div>
            )}

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="flex flex-col gap-4 pt-6">
                  <Link to="/" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                      <span className="text-lg font-bold text-white">+</span>
                    </div>
                    <span className="text-lg font-bold text-primary">
                      Ana's Supplements
                    </span>
                  </Link>
                  <Separator />
                  <nav className="flex flex-col gap-2">
                    {navLinks.map((link) => (
                      <Link
                        key={link.name}
                        to={link.href}
                        className="px-2 py-1.5 text-sm font-medium hover:text-primary"
                      >
                        {link.name}
                      </Link>
                    ))}
                  </nav>
                  <Separator />
                  {user ? (
                    <>
                      <div className="font-medium text-sm px-2">Mi Cuenta</div>
                      <div className="flex flex-col gap-2 px-2">
                        <div className="flex items-center gap-2 py-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary overflow-hidden">
                            {user.avatarUrl ? (
                              <img 
                                src={user.avatarUrl} 
                                alt={user.name || ''} 
                                className="h-full w-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <User className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold">{user.name}</span>
                            <span className="text-[10px] text-muted-foreground">{user.email}</span>
                          </div>
                        </div>
                        {user.role === 'ADMIN' && (
                          <Link to="/admin" className="text-sm hover:text-primary">Panel de Administración</Link>
                        )}
                        <Link to="/perfil" className="text-sm hover:text-primary">Mi Perfil</Link>
                        <Link to="/pedidos" className="text-sm hover:text-primary">Mis Pedidos</Link>
                        <Link to="/favoritos" className="text-sm hover:text-primary">Mis Favoritos</Link>
                        <button 
                          onClick={logout}
                          className="text-sm text-destructive text-left hover:opacity-80"
                        >
                          Cerrar Sesión
                        </button>
                      </div>
                      <Separator />
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col gap-2 px-2">
                        <Link to="/login">
                          <Button variant="outline" className="w-full font-bold">Iniciar Sesión</Button>
                        </Link>
                        <Link to="/registro">
                          <Button className="w-full font-bold">Regístrate</Button>
                        </Link>
                      </div>
                      <Separator />
                    </>
                  )}
                  <div className="font-medium text-sm px-2">Categorías</div>
                  <nav className="flex flex-col gap-2">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        to={`/productos?category=${category.slug}`}
                        className="px-2 py-1.5 text-sm text-muted-foreground hover:text-primary"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {isSearchOpen && (
          <div className="pb-4 sm:hidden">
            <div className="relative">
              <Input
                type="search"
                placeholder="Buscar productos..."
                className="w-full pl-9"
                autoFocus
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
