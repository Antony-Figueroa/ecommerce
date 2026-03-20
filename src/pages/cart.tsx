import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ChevronRight, ShoppingCart, Trash2, Plus, Minus, MessageCircle, Heart, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCart } from "@/contexts/cart-context"
import { formatUSD, formatBS } from "@/lib/utils"
import { api } from "@/lib/api"

export function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice, saveForLater, moveToCart, getSavedItems } = useCart()
  const navigate = useNavigate()

  const [bcvRate, setBcvRate] = useState<number>(0)
  const [savedItems, setSavedItems] = useState<typeof items>([])

  useEffect(() => {
    async function loadData() {
      await Promise.all([fetchPublicSettings(), fetchBCVRate()])
      setSavedItems(getSavedItems())
    }
    loadData()
  }, [getSavedItems])

  const fetchBCVRate = async () => {
    try {
      const data = await api.getBCVRate()
      if (data && data.rate) {
        setBcvRate(data.rate)
      }
    } catch (error) {
      console.error("Error fetching BCV rate:", error)
    }
  }

  const fetchPublicSettings = async () => {
    try {
      await api.getPublicSettings()
    } catch (error) {
      console.error("Error fetching public settings:", error)
    }
  }

  const subtotal = totalPrice

  const handleCheckout = () => {
    if (items.length === 0) return
    navigate("/checkout")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Inicio</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-foreground">Carrito</span>
        </nav>
      </div>

      <h1 className="text-2xl font-bold mb-8">Carrito de compras</h1>

      {items.length > 0 || savedItems.length > 0 ? (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {items.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{items.length} productos en tu carrito</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y">
                    {items.map((item) => (
                      <div key={item.product.id} className="py-4 flex gap-4">
                        <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
                          <img
                            src={item.product.image || "/placeholder.png"}
                            alt={item.product.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://placehold.co/200x200/f8fafc/6366f1?text=Error";
                              target.onerror = null;
                            }}
                          />
                        </div>
                        <div className="flex flex-1 flex-col">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="font-medium">{item.product.name}</h3>
                              <p className="text-sm text-muted-foreground">{item.product.brand}</p>
                              <p className="text-sm text-muted-foreground">{item.product.format} • {item.product.weight}</p>
                              <div className="mt-1">
                                <p className="text-sm font-semibold">${formatUSD(item.product.price)}</p>
                                {bcvRate > 0 && (
                                  <p className="text-xs text-muted-foreground">Bs. {formatBS(Number(item.product.price) * bcvRate)}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">${formatUSD(Number(item.product.price) * item.quantity)}</p>
                              {bcvRate > 0 && (
                                <p className="text-xs text-muted-foreground italic">Bs. {formatBS(Number(item.product.price) * item.quantity * bcvRate)}</p>
                              )}
                            </div>
                          </div>
                          <div className="mt-auto flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input type="number" value={item.quantity} className="h-8 w-16 text-center" readOnly />
                              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-pink-600"
                                onClick={() => saveForLater(item.product.id)}
                              >
                                <Heart className="mr-2 h-4 w-4" />
                                Guardar
                              </Button>
                              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.product.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {savedItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-pink-500" />
                    Productos guardados ({savedItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y">
                    {savedItems.map((item) => (
                      <div key={item.product.id} className="py-4 flex gap-4">
                        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
                          <img
                            src={item.product.image || "/placeholder.png"}
                            alt={item.product.name}
                            className="h-full w-full object-cover opacity-70"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://placehold.co/100x100/f8fafc/6366f1?text=Img";
                              target.onerror = null;
                            }}
                          />
                        </div>
                        <div className="flex flex-1 flex-col">
                          <div>
                            <h3 className="font-medium">{item.product.name}</h3>
                            <p className="text-sm text-muted-foreground">Qty: {item.quantity} • ${formatUSD(item.product.price)}</p>
                          </div>
                          <div className="mt-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => moveToCart(item.product.id)}
                            >
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Agregar al carrito
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Resumen del pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <div className="text-right">
                      <div>${formatUSD(subtotal)}</div>
                      {bcvRate > 0 && (
                        <div className="text-xs text-muted-foreground">Bs. {formatBS(subtotal * bcvRate)}</div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <div className="text-right">
                    <div>${formatUSD(subtotal)}</div>
                    {bcvRate > 0 && (
                      <div className="text-sm font-normal text-muted-foreground italic">
                        Bs. {formatBS(subtotal * bcvRate)}
                      </div>
                    )}
                  </div>
                </div>

                {bcvRate > 0 && (
                  <p className="text-[10px] text-center text-muted-foreground">
                    Tasa de cambio BCV: Bs. {formatBS(bcvRate)}
                  </p>
                )}

                <Button className="w-full" size="lg" onClick={handleCheckout}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Finalizar Pedido
                </Button>

                <Link to="/productos" className="block text-center text-sm text-primary hover:underline">
                  Continuar comprando
                </Link>
              </CardContent>
            </Card>

            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <MessageCircle className="h-5 w-5" />
                <span className="font-medium text-sm">Pedido sin linea de credito</span>
              </div>
              <p className="text-xs text-green-600 mt-1">Envianos tu pedido por WhatsApp y te contactaremos para confirmar disponibilidad y acordar forma de pago.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ShoppingCart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Tu carrito está vacío</h2>
          <p className="text-muted-foreground mb-6">Parece que aún no has añadido productos a tu carrito.</p>
          <Button asChild>
            <Link to="/productos">Ver productos</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
