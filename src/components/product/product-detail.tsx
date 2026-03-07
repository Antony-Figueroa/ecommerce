import { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Heart, Share2, Truck, Shield, RefreshCcw, ChevronLeft, Minus, Plus, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { ProductCard } from "@/components/shop/product-card"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { useFavorites } from "@/contexts/favorites-context"
import { useSettings } from "@/contexts/settings-context"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { cn, formatUSD, formatBS } from "@/lib/utils"
import type { Product } from "@/types"

interface ProductDetailProps {
  product: Product
  relatedProducts?: Product[]
}

export function ProductDetail({ product, relatedProducts = [] }: ProductDetailProps) {
  const { addItem } = useCart()
  const { user } = useAuth()
  const { toggleFavorite, isFavorite } = useFavorites()
  const { settings: _settings } = useSettings()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState("description")
  const [bcvRate, setBcvRate] = useState(42.50)
  const [activeImage, setActiveImage] = useState(
    product.images?.find(img => img.isMain)?.url || product.image || "/placeholder.jpg"
  )

  useEffect(() => {
    api.getBCVRate().then((res: { rate: number }) => setBcvRate(res.rate)).catch(() => {})
  }, [])

  useEffect(() => {
    setActiveImage(product.images?.find(img => img.isMain)?.url || product.image || "/placeholder.jpg")
  }, [product])

  const priceBS = Number(product.price) * bcvRate

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(product.stock, prev + delta)))
  }

  const handleAddToCart = () => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para agregar productos al carrito",
        variant: "destructive",
      })
      navigate("/login")
      return
    }
    addItem(product, quantity)
    setQuantity(1)
  }

  const handleToggleFavorite = async () => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para guardar favoritos",
        variant: "destructive",
      })
      navigate("/login")
      return
    }
    await toggleFavorite(product)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/productos" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
          <ChevronLeft className="h-4 w-4" />
          Volver a productos
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-muted p-4 border border-border/50">
            <img 
              src={activeImage} 
              alt={product.name} 
              className="h-full w-full object-contain transition-all duration-300" 
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://placehold.co/800x800/f8fafc/6366f1?text=Imagen+No+Disponible";
                target.onerror = null;
              }}
            />
            {!product.inStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="text-white font-black uppercase tracking-widest">Agotado</span>
              </div>
            )}
          </div>
          
          {product.images && product.images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img.url)}
                  className={cn(
                    "aspect-square rounded-lg overflow-hidden border-2 transition-all p-1 bg-white",
                    activeImage === img.url ? "border-primary" : "border-border/50 hover:border-primary/30"
                  )}
                >
                  <img 
                    src={img.thumbnail || img.url} 
                    alt="" 
                    className="w-full h-full object-contain" 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://placehold.co/200x200/f8fafc/6366f1?text=X";
                      target.onerror = null;
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">{product.brand}</p>
            <h1 className="text-2xl font-bold lg:text-3xl">{product.name}</h1>
          </div>

          <div className="flex flex-col">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-primary">${formatUSD(product.price)}</span>
              {product.isOffer && product.originalPrice && (
                <span className="text-xl text-muted-foreground line-through">
                  ${formatUSD(product.originalPrice)}
                </span>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              Bs {formatBS(priceBS)}
            </span>
          </div>

          <p className="text-muted-foreground">{product.description}</p>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="font-medium">Cantidad:</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-16 text-center"
                  min={1}
                  max={product.stock}
                />
                <Button variant="outline" size="icon" onClick={() => handleQuantityChange(1)} disabled={quantity >= product.stock}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button size="lg" className="flex-1" disabled={!product.inStock} onClick={handleAddToCart}>
                <ShoppingCart className="mr-2 h-5 w-5" />
                {product.inStock ? "Agregar al carrito" : "Agotado"}
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={handleToggleFavorite}
                className={cn(isFavorite(product.id) && "text-red-500 hover:text-red-600")}
              >
                <Heart className={cn("h-5 w-5", isFavorite(product.id) && "fill-current")} />
              </Button>
              <Button variant="outline" size="lg"><Share2 className="h-5 w-5" /></Button>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Truck className="h-4 w-4 text-primary" />
                <span>Envío 24-48 horas</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Shield className="h-4 w-4 text-primary" />
                <span>Garantía de calidad</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <RefreshCcw className="h-4 w-4 text-primary" />
                <span>Devolución 30 días</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="rounded-lg bg-muted p-3">
              <p className="font-medium text-sm">Información</p>
              <p className="text-muted-foreground text-sm">
                {product.format}{product.weight && ` • ${product.weight}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start gap-1 border-b border-border/40 pb-px">
            <TabsTrigger value="description">
              Descripción
            </TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="py-6">
            <div className="prose max-w-none">
              <p>{product.description}</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Productos relacionados</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} bcvRate={bcvRate} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
