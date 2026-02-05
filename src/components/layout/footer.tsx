import { Link, useNavigate } from "react-router-dom"
import { Facebook, Instagram, Twitter, Phone, Mail, MapPin, Clock, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { api } from "@/lib/api"
import type { Category } from "@/types"
import { useState, useEffect } from "react"

const footerLinks = {
  "Sobre Nosotros": [
    { name: "Quiénes somos", href: "/sobre-nosotros" },
    { name: "Nuestra historia", href: "/historia" },
    { name: "Trabaja con nosotros", href: "/trabajo" },
    { name: "Nuestras tiendas", href: "/tiendas" },
  ],
  "Atención al Cliente": [
    { name: "Contacto", href: "/contacto" },
    { name: "Preguntas frecuentes", href: "/faq" },
    { name: "Política de privacidad", href: "/privacidad" },
    { name: "Términos y condiciones", href: "/terminos" },
  ],
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
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                <span className="text-xl font-bold text-white">+</span>
              </div>
              <span className="text-xl font-bold text-primary">Ana's Supplements</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Tu salud en primer lugar. Encuentra los mejores productos
              farmacéuticos, vitaminas y suplementos al mejor precio.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Facebook className="h-4 w-4" />
                <span className="sr-only">Facebook</span>
              </Button>
              <Button variant="outline" size="icon">
                <Instagram className="h-4 w-4" />
                <span className="sr-only">Instagram</span>
              </Button>
              <Button variant="outline" size="icon">
                <Twitter className="h-4 w-4" />
                <span className="sr-only">Twitter</span>
              </Button>
            </div>
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
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span className="text-muted-foreground">
                  Av. Principal 123, Ciudad
                  <br />
                  México, CP 03100
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">800-FARMACIA</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <span className="text-muted-foreground">info@farmasiaplus.com</span>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span className="text-muted-foreground">
                  Lun-Vie: 8:00 - 21:00
                  <br />
                  Sáb-Dom: 9:00 - 20:00
                </span>
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
