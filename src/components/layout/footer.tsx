import { Link, useNavigate } from "react-router-dom"
import { Phone, LogOut, Leaf } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { api } from "@/lib/api"
import type { Category } from "@/types"
import { useState, useEffect } from "react"

const footerLinks = {
  "Compras": [
    { name: "Envíos y entregas", href: "/envios" },
    { name: "Devoluciones", href: "/devoluciones" },
    { name: "Formas de pago", href: "/pago" },
    { name: "Seguimiento de pedido", href: "/seguimiento" },
  ],
}

export function Footer() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    api.getCategories()
      .then(res => setCategories(res.categories || []))
      .catch(() => {})
    
    // Verificar si hay un token para mostrar el botón de cerrar sesión
    setIsLoggedIn(!!api.getToken())

    // Escuchar cambios en localStorage para actualizar el estado (opcional pero recomendado)
    const handleStorageChange = () => {
      setIsLoggedIn(!!api.getToken())
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const handleLogout = () => {
    api.logout()
    setIsLoggedIn(false)
    navigate("/login")
  }

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-105">
                <Leaf className="h-6 w-6" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-foreground italic">
                Ana's <span className="text-primary not-italic">Supplements</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Tu salud en primer lugar. Encuentra los mejores productos
              farmacéuticos, vitaminas y suplementos al mejor precio.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Categorías</h3>
            <ul className="space-y-2">
              {categories.slice(0, 5).map((category) => (
                <li key={category.id}>
                  <Link
                    to={`/productos?category=${category.slug}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="font-semibold mb-4">{title}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="font-semibold mb-4">Contáctanos</h3>
            <p className="text-sm text-muted-foreground mb-4 italic">
              "Tu bienestar, nuestra prioridad. Estamos aquí para ti."
            </p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground font-bold">800-FARMACIA</span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © 2026 Ana's Supplements. Todos los derechos reservados.
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <Link to="/privacidad" className="hover:text-primary">
              Privacidad
            </Link>
            <Link to="/terminos" className="hover:text-primary">
              Términos
            </Link>
            {isLoggedIn && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="h-auto p-0 text-muted-foreground hover:text-red-600 font-normal"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Cerrar sesión
              </Button>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
