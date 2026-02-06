import { useNavigate, useLocation } from "react-router-dom"
import { ShoppingCart, Plus, Minus, Star, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { formatUSD, formatBS, cn } from "@/lib/utils"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { useFavorites } from "@/contexts/favorites-context"
import type { Product } from "@/types"

interface ProductQuickViewProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  bcvRate: number
}

export function ProductQuickView({ product, isOpen, onClose, bcvRate }: ProductQuickViewProps) {
  const { items, addItem, updateQuantity, removeItem } = useCart()
  const { user } = useAuth()
  const { toggleFavorite, isFavorite } = useFavorites()
  const navigate = useNavigate()
  const location = useLocation()

  if (!product) return null

  const handleToggleFavorite = () => {
    if (!user) {
      navigate("/login", { state: { from: location } })
      return
    }
    toggleFavorite(product)
  }

  const handleAddToCart = () => {
    if (!user) {
      navigate("/login", { state: { from: location } })
      return
    }
    addItem(product, 1)
  }

  const cartItem = items.find((item) => item.product.id === product.id)
  const isInCart = !!cartItem
  const priceBS = Number(product.price) * bcvRate
  const mainImage = product.images?.find((img) => img.isMain)?.url || product.image

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden sm:rounded-3xl border-none shadow-2xl">
        <div className="grid md:grid-cols-2 h-full max-h-[90vh] overflow-y-auto">
          {/* Image Section */}
          <div className="relative bg-secondary/30 p-8 flex items-center justify-center aspect-square md:aspect-auto">
            {mainImage ? (
              <img
                src={mainImage}
                alt={product.name}
                className="max-h-full max-w-full object-contain mix-blend-multiply drop-shadow-xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://placehold.co/400x400/f8fafc/6366f1?text=Suplemento";
                  target.onerror = null;
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted/50 rounded-2xl">
                <span className="text-muted-foreground font-medium">Sin imagen</span>
              </div>
            )}
            <div className="absolute left-6 top-6 flex flex-col gap-2">
              {product.isFeatured && (
                <Badge className="bg-amber-500 text-white border-none font-black tracking-wider">
                  DESTACADO
                </Badge>
              )}
              {product.isOffer && (
                <Badge variant="destructive" className="border-none font-black tracking-wider">
                  OFERTA
                </Badge>
              )}
            </div>
            {!product.inStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-[2px] z-10">
                <Badge variant="outline" className="bg-background text-foreground border-border font-extrabold px-6 py-2 text-lg">
                  AGOTADO
                </Badge>
              </div>
            )}
            <Button
              size="icon"
              variant="secondary"
              className="absolute right-6 top-6 rounded-full shadow-lg size-10 bg-card hover:bg-primary hover:text-primary-foreground transition-colors z-20"
              onClick={handleToggleFavorite}
            >
              <Heart 
                className={cn(
                  "h-5 w-5 transition-colors",
                  isFavorite(product.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"
                )} 
              />
            </Button>
          </div>

          {/* Content Section */}
          <div className="p-8 md:p-10 flex flex-col bg-card">
            <div className="flex-1 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary/80">
                    {product.brand}
                  </span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-full">
                    <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                    <span className="text-xs font-black text-primary">4.8</span>
                  </div>
                </div>
                <DialogTitle className="text-2xl md:text-3xl font-black text-foreground leading-tight">
                  {product.name}
                </DialogTitle>
                <div className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                  <Badge variant="secondary" className="rounded-md font-bold">{product.format}</Badge>
                  <span>•</span>
                  <span>{product.weight}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-black text-primary">
                    ${formatUSD(product.price)}
                  </span>
                  {product.isOffer && product.originalPrice && (
                    <span className="text-lg font-bold text-muted-foreground line-through decoration-destructive/40">
                      ${formatUSD(product.originalPrice)}
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-muted-foreground/60">
                  Aprox. Bs {formatBS(priceBS)}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Descripción</h4>
                <DialogDescription className="text-base text-muted-foreground leading-relaxed line-clamp-4">
                  {product.description}
                </DialogDescription>
              </div>

              <div className="grid grid-cols-1 gap-4 py-4 border-y border-border/50">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Categoría</p>
                  <p className="text-sm font-bold">{product.category?.name || "General"}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {isInCart ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between p-2 bg-primary/5 rounded-2xl border border-primary/10">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl size-12 hover:bg-primary/10 text-primary"
                      onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    <div className="flex flex-col items-center">
                      <span className="text-lg font-black text-primary">{cartItem.quantity}</span>
                      <span className="text-[10px] font-bold text-primary/60 uppercase">En carrito</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-xl size-12 hover:bg-primary/10 text-primary"
                      onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                      disabled={cartItem.quantity >= product.stock}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 font-bold"
                    onClick={() => removeItem(product.id)}
                  >
                    Quitar del carrito
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full rounded-2xl font-black text-lg py-8 shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98]"
                  disabled={!product.inStock}
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="mr-3 h-6 w-6" />
                  Agregar al Carrito
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
