import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ChevronRight, ShoppingCart, Trash2, Plus, Minus, MessageCircle, Heart, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCart } from "@/contexts/cart-context"
import { formatUSD } from "@/lib/utils"

interface Coupon {
  code: string
  discount: number
  type: "percentage" | "fixed"
  minPurchase: number
}

const availableCoupons: Coupon[] = [
  { code: "BIENVENIDO10", discount: 10, type: "percentage", minPurchase: 200 },
  { code: "AHORRO20", discount: 20, type: "percentage", minPurchase: 500 },
  { code: "ENVIOGRATIS", discount: 49.99, type: "fixed", minPurchase: 300 },
]

export function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, totalPrice, saveForLater, moveToCart, getSavedItems } = useCart()
  const navigate = useNavigate()

  const [showCheckout, setShowCheckout] = useState(false)
  const [checkoutData, setCheckoutData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deliveryAddress: "",
    notes: "",
  })
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [couponError, setCouponError] = useState("")
  const [savedItems, setSavedItems] = useState<typeof items>([])

  useEffect(() => {
    setSavedItems(getSavedItems())
  }, [getSavedItems])

  const subtotal = totalPrice
  const discount = appliedCoupon
    ? appliedCoupon.type === "percentage"
      ? subtotal * (appliedCoupon.discount / 100)
      : appliedCoupon.discount
    : 0
  const shipping = subtotal >= 500 ? 0 : 49.99
  const tax = (subtotal - discount) * 0.16
  const total = subtotal - discount + shipping + tax

  const applyCoupon = () => {
    const coupon = availableCoupons.find(
      (c) => c.code.toUpperCase() === couponCode.toUpperCase()
    )

    if (!coupon) {
      setCouponError("Código de cupón no válido")
      setAppliedCoupon(null)
      return
    }

    if (subtotal < coupon.minPurchase) {
      setCouponError(`最小 compra de $${coupon.minPurchase} para usar este cupón`)
      setAppliedCoupon(null)
      return
    }

    setAppliedCoupon(coupon)
    setCouponError("")
    setCouponCode("")
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode("")
    setCouponError("")
  }

  const handleCheckout = () => {
    if (items.length === 0) return
    setShowCheckout(true)
  }

  const generateWhatsAppOrder = () => {
    const phoneNumber = "5215551234567"

    let message = `*🧪 Nueva Orden - Ana's Supplements*%0A%0A`
    message += `*Cliente:* ${checkoutData.customerName}%0A`
    message += `*Email:* ${checkoutData.customerEmail}%0A`
    message += `*Telefono:* ${checkoutData.customerPhone}%0A`

    if (appliedCoupon) {
      message += `*Cupón aplicado:* ${appliedCoupon.code}%0A`
      message += `*Descuento:* -$${formatUSD(discount)}%0A%0A`
    }

    message += `*📦 Productos:*%0A`
    items.forEach((item, index) => {
      message += `${index + 1}. ${item.product.name}%0A`
      message += `   Cantidad: ${item.quantity}%0A`
      message += `   Precio: $${formatUSD(item.product.price)}%0A`
      message += `   Subtotal: $${formatUSD(Number(item.product.price) * item.quantity)}%0A%0A`
    })

    message += `*💰 Resumen:*%0A`
    message += `   Subtotal: $${formatUSD(subtotal)}%0A`
    if (appliedCoupon) {
      message += `   Descuento: -$${formatUSD(discount)}%0A`
    }
    message += `   Envio: $${formatUSD(shipping)}%0A`
    message += `   IVA: $${formatUSD(tax)}%0A`
    message += `*   Total: $${formatUSD(total)}*%0A`

    message += `%0A*📍 Direccion de Entrega:*%0A${checkoutData.deliveryAddress}%0A`

    if (checkoutData.notes) {
      message += `%0A*📝 Notas:*%0A${checkoutData.notes}%0A`
    }

    message += `%0A_%0APedido generado desde Ana's Supplements E-commerce_`

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`

    clearCart()
    setShowCheckout(false)
    window.open(whatsappUrl, "_blank")
    navigate("/")
  }

  if (showCheckout) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary">Inicio</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/carrito" className="hover:text-primary">Carrito</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-foreground">Finalizar Pedido</span>
          </nav>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Informacion de Entrega</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nombre completo</label>
                  <Input
                    value={checkoutData.customerName}
                    onChange={(e) => setCheckoutData({ ...checkoutData, customerName: e.target.value })}
                    placeholder="Juan Perez"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Telefono (con WhatsApp)</label>
                  <Input
                    value={checkoutData.customerPhone}
                    onChange={(e) => setCheckoutData({ ...checkoutData, customerPhone: e.target.value })}
                    placeholder="5523456789"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={checkoutData.customerEmail}
                    onChange={(e) => setCheckoutData({ ...checkoutData, customerEmail: e.target.value })}
                    placeholder="juan@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Direccion de entrega</label>
                  <Input
                    value={checkoutData.deliveryAddress}
                    onChange={(e) => setCheckoutData({ ...checkoutData, deliveryAddress: e.target.value })}
                    placeholder="Calle 123, Colonia Centro, Ciudad de Mexico"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notas adicionales</label>
                  <Input
                    value={checkoutData.notes}
                    onChange={(e) => setCheckoutData({ ...checkoutData, notes: e.target.value })}
                    placeholder="Entregar despues de las 6pm"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Resumen del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-64 overflow-y-auto space-y-3">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity} x ${formatUSD(item.product.price)}</p>
                      </div>
                      <p className="font-semibold">${formatUSD(item.product.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-green-600 bg-green-50 p-2 rounded">
                    <span>Cupón {appliedCoupon.code}</span>
                    <span>-${formatUSD(discount)}</span>
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${formatUSD(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Descuento</span>
                    <span className={discount > 0 ? "text-green-600" : ""}>
                      {discount > 0 ? `-$${formatUSD(discount)}` : "$0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Envio</span>
                    <span>{shipping === 0 ? <span className="text-green-600">Gratis</span> : `$${formatUSD(shipping)}`}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IVA (16%)</span>
                    <span>${formatUSD(tax)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${formatUSD(total)}</span>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <MessageCircle className="h-5 w-5" />
                    <span className="font-medium">Pedido por WhatsApp</span>
                  </div>
                  <p className="text-sm text-green-600">
                    Se abrira WhatsApp para enviar tu pedido directamente a la farmacia. Un ejecutivo te contactara para confirmar.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setShowCheckout(false)}>
                    Volver al carrito
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={generateWhatsAppOrder}
                    disabled={!checkoutData.customerName || !checkoutData.customerPhone || !checkoutData.deliveryAddress}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Enviar por WhatsApp
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
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
                          />
                        </div>
                        <div className="flex flex-1 flex-col">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="font-medium">{item.product.name}</h3>
                              <p className="text-sm text-muted-foreground">{item.product.brand}</p>
                              <p className="text-sm text-muted-foreground">{item.product.format} • {item.product.weight}</p>
                              <p className="text-sm font-semibold mt-1">${formatUSD(item.product.price)}</p>
                            </div>
                            <p className="font-semibold">${formatUSD(Number(item.product.price) * item.quantity)}</p>
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
                    <span>${formatUSD(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Descuento</span>
                    <span className={discount > 0 ? "text-green-600" : ""}>
                      {discount > 0 ? `-$${formatUSD(discount)}` : "$0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Envio estimado</span>
                    <span>{shipping === 0 ? <span className="text-green-600">Gratis</span> : `$${formatUSD(shipping)}`}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IVA (16%)</span>
                    <span>${formatUSD(tax)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${formatUSD(total)}</span>
                </div>

                {appliedCoupon ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600 font-medium">{appliedCoupon.code}</span>
                        <span className="text-xs text-green-500">
                          -{appliedCoupon.type === "percentage" ? `${appliedCoupon.discount}%` : `$${appliedCoupon.discount}`}
                        </span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-green-600 h-6 w-6 p-0" onClick={removeCoupon}>
                        ×
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Código de cupón</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="EJEMPLO10"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className={couponError ? "border-red-500" : ""}
                      />
                      <Button variant="outline" onClick={applyCoupon}>Aplicar</Button>
                    </div>
                    {couponError && <p className="text-xs text-red-500">{couponError}</p>}
                    <p className="text-xs text-muted-foreground">
                      Cupones disponibles: {availableCoupons.map(c => c.code).join(", ")}
                    </p>
                  </div>
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

            <Card className="mt-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Añade ${formatUSD(500 - subtotal)} más para obtener envío gratis</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${Math.min(100, (subtotal / 500) * 100)}%` }} />
                </div>
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
