import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { ArrowRight, Star, Truck, Shield, Phone, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ProductCard } from "@/components/shop/product-card"
import { CategoryIconCard } from "@/components/shop/category-card"
import { Hero, FeatureBanner } from "@/components/shared/hero"
import { Newsletter } from "@/components/shared/newsletter"
import { api } from "@/lib/api"
import type { Product, Category } from "@/types"

export function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [offerProducts, setOfferProducts] = useState<Product[]>([])
  const [bcvRate, setBcvRate] = useState(42.50)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [categoriesRes, productsRes, bcvRes] = await Promise.all([
          api.getCategories(),
          api.getPublicProducts(),
          api.getBCVRate().catch((err) => {
            console.warn("Error fetching BCV rate, using fallback:", err)
            return { rate: 42.50 }
          }),
        ])
        setCategories(categoriesRes.categories || [])
        const allProducts = productsRes.products || []
        setFeaturedProducts(allProducts.filter((p: Product) => p.isFeatured).slice(0, 4))
        setOfferProducts(allProducts.filter((p: Product) => p.isOffer).slice(0, 4))
        setBcvRate(bcvRes.rate || 42.50)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleCategoryClick = () => {
    window.scrollTo(0, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Hero />

      <FeatureBanner />

      <section className="container mx-auto px-4 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">Categorías</h2>
            <p className="text-muted-foreground font-semibold">
              Explora nuestra selección especializada por categoría.
            </p>
          </div>
          <Button variant="ghost" className="rounded-full font-bold text-primary hover:bg-primary/10 w-fit" asChild>
            <Link to="/productos">
              Ver Catálogo Completo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {categories.slice(0, 6).map((category) => (
            <div key={category.id} onClick={handleCategoryClick}>
              <CategoryIconCard category={category} />
            </div>
          ))}
        </div>
      </section>

      {offerProducts.length > 0 && (
        <section className="bg-secondary/30 py-20">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="destructive" className="rounded-lg font-black text-[10px] tracking-widest px-2 py-0.5 animate-pulse">OFERTAS DEL DÍA</Badge>
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
                  Aprovecha los <span className="text-primary">Mejores Descuentos</span>
                </h2>
                <p className="text-muted-foreground font-semibold">
                  Promociones exclusivas por tiempo limitado en productos seleccionados.
                </p>
              </div>
              <Button variant="secondary" className="rounded-xl font-bold px-6 bg-card hover:bg-primary hover:text-primary-foreground shadow-sm transition-all" asChild>
                <Link to="/ofertas">
                  Ver Todas las Ofertas
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {offerProducts.map((product) => (
                <ProductCard key={product.id} product={product} bcvRate={bcvRate} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="container mx-auto px-4 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div className="space-y-1">
            <h2 className="text-4xl font-black tracking-tight text-foreground uppercase italic">Productos <span className="text-primary">Destacados</span></h2>
            <p className="text-muted-foreground font-semibold text-lg">
              Nuestros productos más recomendados por profesionales de la salud.
            </p>
          </div>
          <Button variant="ghost" className="rounded-full font-bold text-primary hover:bg-primary/10 w-fit h-12 px-6 border-2 border-primary/20" asChild>
            <Link to="/productos">
              Ver Todo el Catálogo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} bcvRate={bcvRate} />
          ))}
        </div>
      </section>

      <section className="bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">¿Por qué elegirnos?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ana's Supplements ofrece la mejor experiencia de compra online para tus
              necesidades de salud y bienestar
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Shield className="h-7 w-7" />
                </div>
                <h3 className="font-semibold mb-2">Productos 100% Originales</h3>
                <p className="text-sm text-muted-foreground">
                  Todos nuestros productos están certificados y provienen de
                  laboratorios autorizados
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Truck className="h-7 w-7" />
                </div>
                <h3 className="font-semibold mb-2">Envío Express</h3>
                <p className="text-sm text-muted-foreground">
                  Recibe tus productos en 24-48 horas en la puerta de tu casa
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Star className="h-7 w-7" />
                </div>
                <h3 className="font-semibold mb-2">Atención Personalizada</h3>
                <p className="text-sm text-muted-foreground">
                  Nuestro equipo de farmacéuticos está disponible para
                  asesorarte
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="bg-primary py-12 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 shadow-inner">
                <Phone className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-wider opacity-80">Contacto Directo</p>
                <p className="text-3xl font-black tracking-tighter">800-FARMACIA</p>
              </div>
            </div>
            <div className="h-px w-12 bg-white/20 hidden md:block" />
            <p className="text-center md:text-left text-xl font-bold italic opacity-90 max-w-md">
              "Tu bienestar, nuestra prioridad. Estamos aquí para ti."
            </p>
          </div>
        </div>
      </section>

      <Newsletter />
    </div>
  )
}
