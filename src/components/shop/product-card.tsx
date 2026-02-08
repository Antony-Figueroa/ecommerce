import { useState, memo } from "react"
import { Heart, ShoppingCart, Star, Plus, Minus, Eye, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { formatUSD, formatBS, cn } from "@/lib/utils"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/contexts/auth-context"
import { useCart } from "@/contexts/cart-context"
import { useFavorites } from "@/contexts/favorites-context"
import { ProductQuickView } from "./product-quick-view"
import type { Product } from "@/types"

interface ProductCardProps {
  product: Product
  bcvRate: number
  variant?: "default" | "list"
}

// Optimizando re-renders con memo (rerender-memo)
export const ProductCard = memo(function ProductCard({ product, bcvRate, variant = "default" }: ProductCardProps) {
  const { items, addItem, updateQuantity, removeItem } = useCart()
  const { user } = useAuth()
  const { toggleFavorite, isFavorite } = useFavorites()
  const navigate = useNavigate()
  const location = useLocation()
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false)

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) {
      navigate("/login", { state: { from: location } })
      return
    }
    toggleFavorite(product)
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) {
      navigate("/login", { state: { from: location } })
      return
    }
    addItem(product, 1)
  }

  const handleUpdateQuantity = (productId: string, quantity: number, e: React.MouseEvent) => {
    e.stopPropagation()
    updateQuantity(productId, quantity)
  }

  const handleRemoveItem = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    removeItem(productId)
  }

  const cartItem = items.find((item: any) => item.product.id === product.id)
  const isInCart = !!cartItem
  const priceBS = Number(product.price) * bcvRate
  const mainImage = product.images?.find(img => img.isMain)?.url || product.image

  if (variant === "list") {
    return (
      <>
        <Card className={cn(
          "group overflow-hidden transition-all duration-300 hover:shadow-xl border-border/50 bg-card",
          isInCart && "border-primary/30 ring-1 ring-primary/10"
        )}>
          <div className="flex">
            <div 
          className="relative w-48 h-48 flex-shrink-0 bg-secondary/20 dark:bg-white/5 p-4 cursor-pointer group/image"
          onClick={() => setIsQuickViewOpen(true)}
        >
          {mainImage ? (
            <img
              src={mainImage}
              alt={product.name}
              className="h-full w-full object-contain transition-transform duration-500 group-hover/image:scale-110"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://placehold.co/400x400/f8fafc/6366f1?text=Suplemento";
                target.onerror = null; // Prevent infinite loop if placeholder also fails
              }}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-muted/50 rounded-lg">
              <span className="text-muted-foreground font-medium text-xs">Sin imagen</span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/5 transition-colors flex items-center justify-center">
            <Badge variant="secondary" className="opacity-0 group-hover/image:opacity-100 transition-opacity shadow-sm">
              Vista rápida
            </Badge>
          </div>
              
              {isInCart && (
                <div className="absolute inset-0 bg-primary/5 flex items-center justify-center z-10 pointer-events-none">
                  <Badge className="bg-primary text-white font-bold px-3 py-1 shadow-lg animate-in zoom-in-50">
                    <Check className="h-3 w-3 mr-1" /> EN CARRITO
                  </Badge>
                </div>
              )}

              <div className="absolute left-2 top-2 flex flex-col gap-1 z-20">
                {product.isFeatured && (
                  <Badge className="bg-amber-500 text-white border-none text-[10px] font-bold px-2 py-0.5">
                    DESTACADO
                  </Badge>
                )}
                {product.isOffer && (
                  <Badge variant="destructive" className="border-none text-[10px] font-bold px-2 py-0.5">
                    OFERTA
                  </Badge>
                )}
              </div>
              {!product.inStock && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60 dark:bg-black/40 backdrop-blur-[2px] z-20">
                  <Badge variant="outline" className="bg-background dark:bg-card text-foreground border-border font-bold">
                    AGOTADO
                  </Badge>
                </div>
              )}
            </div>
            <CardContent className="p-6 flex-1 flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary/80">{product.brand}</span>
                <div className="flex items-start justify-between">
                  <div 
                    className="cursor-pointer"
                    onClick={() => setIsQuickViewOpen(true)}
                  >
                    <h3 className="text-xl font-bold text-foreground leading-tight hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full size-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setIsQuickViewOpen(true)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  {product.format} • {product.weight}
                </p>
                <div className="flex items-center gap-0.5 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className={`h-3.5 w-3.5 ${star <= 4 ? "fill-primary text-primary" : "fill-muted text-muted"}`} />
                  ))}
                  <span className="text-xs font-bold text-muted-foreground ml-1">(4.0)</span>
                </div>
              </div>
              <div className="flex items-end justify-between mt-6">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-primary">
                      ${formatUSD(product.price)}
                    </span>
                    {product.isOffer && product.originalPrice && (
                      <span className="text-sm font-bold text-muted-foreground line-through decoration-destructive/50">
                        ${formatUSD(product.originalPrice)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-muted-foreground/60">
                    Bs {formatBS(priceBS)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isInCart ? (
                    <div className="flex items-center bg-primary/10 rounded-xl overflow-hidden p-1 border border-primary/20">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg hover:bg-primary hover:text-white transition-colors"
                        onClick={(e) => handleUpdateQuantity(product.id, cartItem.quantity - 1, e)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-10 text-center font-black text-primary">{cartItem.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg hover:bg-primary hover:text-white transition-colors"
                        onClick={(e) => handleUpdateQuantity(product.id, cartItem.quantity + 1, e)}
                        disabled={cartItem.quantity >= product.stock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-xl size-10 bg-secondary/80 hover:bg-secondary transition-colors"
                        onClick={handleToggleFavorite}
                      >
                        <Heart 
                          className={cn(
                            "h-5 w-5 transition-colors",
                            isFavorite(product.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"
                          )} 
                        />
                      </Button>
                      <Button
                        className="rounded-xl px-6 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95"
                        disabled={!product.inStock}
                        onClick={handleAddToCart}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Agregar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
        <ProductQuickView 
          product={product} 
          isOpen={isQuickViewOpen} 
          onClose={() => setIsQuickViewOpen(false)} 
          bcvRate={bcvRate} 
        />
      </>
    )
  }

  return (
    <>
      <Card className={cn(
        "group flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-xl border-border/50 bg-card",
        isInCart && "border-primary/30 ring-1 ring-primary/10"
      )}>
        <div 
          className="relative aspect-square flex-shrink-0 bg-secondary/20 dark:bg-white/5 p-6 overflow-hidden cursor-pointer group/image"
          onClick={() => setIsQuickViewOpen(true)}
        >
          {mainImage ? (
            <img
              src={mainImage}
              alt={product.name}
              className="h-full w-full object-contain transition-transform duration-500 group-hover/image:scale-110"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://placehold.co/400x400/f8fafc/6366f1?text=Suplemento";
                target.onerror = null;
              }}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-muted/50 rounded-2xl">
              <span className="text-muted-foreground font-medium text-xs">Sin imagen</span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/5 transition-colors flex items-center justify-center z-10">
            <Badge variant="secondary" className="opacity-0 group-hover/image:opacity-100 transition-opacity shadow-sm">
              Vista rápida
            </Badge>
          </div>
          
          {isInCart && (
            <div className="absolute inset-0 bg-primary/5 flex items-center justify-center z-10 pointer-events-none">
              <Badge className="bg-primary text-white font-bold px-3 py-1 shadow-lg animate-in zoom-in-50">
                <Check className="h-3 w-3 mr-1" /> EN CARRITO
              </Badge>
            </div>
          )}
          
          <div className="absolute left-3 top-3 flex flex-col gap-1.5 z-20">
            {product.isFeatured && (
              <Badge className="bg-amber-500 text-white border-none text-[10px] font-black px-2 py-0.5 tracking-wider">
                DESTACADO
              </Badge>
            )}
            {product.isOffer && (
              <Badge variant="destructive" className="border-none text-[10px] font-black px-2 py-0.5 tracking-wider">
                OFERTA
              </Badge>
            )}
          </div>

          {!product.inStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 dark:bg-black/40 backdrop-blur-[2px] z-20">
              <Badge variant="outline" className="bg-background dark:bg-card text-foreground border-border font-extrabold px-4 py-1">
                AGOTADO
              </Badge>
            </div>
          )}

          <div className="absolute right-3 top-3 translate-x-12 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 flex flex-col gap-2 z-20">
            <Button 
              size="icon" 
              variant="secondary" 
              className="rounded-xl shadow-lg size-10 bg-card hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setIsQuickViewOpen(true);
              }}
            >
              <Eye className="h-5 w-5" />
            </Button>
            <Button 
              size="icon" 
              variant="secondary" 
              className="rounded-xl shadow-lg size-10 bg-card hover:bg-primary hover:text-primary-foreground transition-colors"
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
        </div>

        <CardContent className="p-5 flex flex-col flex-1">
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary/80">{product.brand}</span>
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-primary text-primary" />
                <span className="text-[10px] font-bold text-muted-foreground">4.8</span>
              </div>
            </div>
            
            <div 
              className="cursor-pointer"
              onClick={() => setIsQuickViewOpen(true)}
            >
              <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2 hover:text-primary transition-colors h-[2.5rem]">
                {product.name}
              </h3>
            </div>
            
            <p className="text-xs font-semibold text-muted-foreground">
              {product.format} • {product.weight}
            </p>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-primary">
                  ${formatUSD(product.price)}
                </span>
                {product.isOffer && product.originalPrice && (
                  <span className="text-xs font-bold text-muted-foreground line-through decoration-destructive/50">
                    ${formatUSD(product.originalPrice)}
                  </span>
                )}
              </div>
              <p className="text-[10px] font-bold text-muted-foreground/60">
                Bs {formatBS(priceBS)}
              </p>
            </div>

            {isInCart ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between bg-primary/10 rounded-xl p-1 border border-primary/20">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-lg hover:bg-primary hover:text-white transition-colors"
                    onClick={(e) => handleUpdateQuantity(product.id, cartItem.quantity - 1, e)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="flex flex-col items-center">
                    <span className="text-sm font-black text-primary">{cartItem.quantity}</span>
                    <span className="text-[8px] font-bold text-primary/60 uppercase">En carrito</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-lg hover:bg-primary hover:text-white transition-colors"
                    onClick={(e) => handleUpdateQuantity(product.id, cartItem.quantity + 1, e)}
                    disabled={cartItem.quantity >= product.stock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[10px] text-destructive hover:text-destructive hover:bg-destructive/10 font-bold h-7"
                  onClick={(e) => handleRemoveItem(product.id, e)}
                >
                  Quitar del carrito
                </Button>
              </div>
            ) : (
              <Button
                className="w-full rounded-xl font-extrabold shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all active:scale-[0.98] py-6"
                disabled={!product.inStock}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Agregar al Carrito
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      <ProductQuickView 
        product={product} 
        isOpen={isQuickViewOpen} 
        onClose={() => setIsQuickViewOpen(false)} 
        bcvRate={bcvRate} 
      />
    </>
  )
})

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden dark:bg-card dark:border-border">
      <div className="aspect-square bg-muted dark:bg-muted/10 animate-pulse" />
      <CardContent className="p-4 space-y-3">
        <div className="h-3 bg-muted dark:bg-muted/10 rounded animate-pulse w-1/3" />
        <div className="h-4 bg-muted dark:bg-muted/10 rounded animate-pulse" />
        <div className="h-3 bg-muted dark:bg-muted/10 rounded animate-pulse w-1/4" />
        <div className="h-5 bg-muted dark:bg-muted/10 rounded animate-pulse w-1/2" />
        <div className="h-8 bg-muted dark:bg-muted/10 rounded animate-pulse" />
      </CardContent>
    </Card>
  )
}
