import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ChevronRight, ShoppingCart, Trash2, Plus, Minus, MessageCircle, Heart, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { formatUSD } from "@/lib/utils"
import { api } from "@/lib/api"

export function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, totalPrice, saveForLater, moveToCart, getSavedItems } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [showCheckout, setShowCheckout] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [checkoutData, setCheckoutData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deliveryAddress: "",
    notes: "",
  })

  // Pre-llenar datos del usuario si está autenticado
  useEffect(() => {
    if (user && !showCheckout) {
      setCheckoutData(prev => ({
        ...prev,
        customerName: prev.customerName || user.name || "",
        customerPhone: prev.customerPhone || user.phone || "",
        customerEmail: prev.customerEmail || user.email || "",
      }))
    }
  }, [user, showCheckout])

  const [savedItems, setSavedItems] = useState<typeof items>([])
  const [whatsappNumber, setWhatsappNumber] = useState("584123456789") // Default fallback (Venezuela)

  useEffect(() => {
    setSavedItems(getSavedItems())
    fetchPublicSettings()
  }, [getSavedItems])

  const fetchPublicSettings = async () => {
    try {
      const settings = await api.getPublicSettings()
      if (settings.whatsapp_number) {
        // Limpiar el número para el enlace de WhatsApp (solo números)
        // Asegurarse de que no tenga el signo + pero mantenga el código de país
        const cleanNumber = settings.whatsapp_number.replace(/\+/g, '').replace(/\D/g, '')
        setWhatsappNumber(cleanNumber)
      }
    } catch (error) {
      console.error("Error fetching public settings:", error)
    }
  }

  const subtotal = totalPrice
  const total = subtotal

  const handleCheckout = () => {
    if (items.length === 0) return
    setShowCheckout(true)
  }

  const generateWhatsAppOrder = async () => {
    if (isProcessing) return
    
    try {
      setIsProcessing(true)
      // 1. First, create the order in the database
      const orderData = {
        userId: user?.id,
        customerName: checkoutData.customerName,
        customerPhone: checkoutData.customerPhone,
        customerEmail: checkoutData.customerEmail,
        deliveryAddress: checkoutData.deliveryAddress,
        notes: checkoutData.notes,
        paymentMethod: 'WHATSAPP',
        items: items.map(item => ({
          productId: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          unitPrice: Number(item.product.price)
        }))
      }

      await api.createSale(orderData)

      // 2. If database creation is successful, proceed with WhatsApp
      const phoneNumber = whatsappNumber

      let message = `*🧪 Nueva Orden - Ana's Supplements*\n\n`
      message += `*Cliente:* ${checkoutData.customerName}\n`
      message += `*Email:* ${checkoutData.customerEmail}\n`
      message += `*Teléfono:* ${checkoutData.customerPhone}\n\n`

      message += `*📦 Productos:*\n`
      items.forEach((item, index) => {
        message += `${index + 1}. ${item.product.name}\n`
        message += `   Cantidad: ${item.quantity}\n`
        message += `   Precio: $${formatUSD(item.product.price)}\n`
        message += `   Subtotal: $${formatUSD(Number(item.product.price) * item.quantity)}\n\n`
      })

      message += `*💰 Resumen:*\n`
      message += `   Subtotal: $${formatUSD(subtotal)}\n`
      message += `*   Total: $${formatUSD(total)}*\n`

      message += `\n*📍 Dirección de Entrega:*\n${checkoutData.deliveryAddress}\n`

      if (checkoutData.notes) {
        message += `\n*📝 Notas:*\n${checkoutData.notes}\n`
      }

      message += `\n_\nPedido generado desde Ana's Supplements E-commerce_`

      const encodedMessage = encodeURIComponent(message)
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`

      // Importante: No cerramos el checkout ni limpiamos el carrito inmediatamente
      // para evitar que la UI cambie drásticamente mientras se abre la ventana
      
      // Abrir WhatsApp
      const win = window.open(whatsappUrl, "_blank")
      
      // Si el popup fue bloqueado, redirigir en la misma pestaña
      if (!win || win.closed || typeof win.closed === 'undefined') {
        window.location.href = whatsappUrl
      } else {
        // Si se abrió con éxito, limpiamos y volvemos al inicio
        clearCart()
        setShowCheckout(false)
        navigate("/")
      }
    } catch (error: any) {
      console.error("Error creating order:", error)
      alert(error.message || "Hubo un error al procesar tu pedido. Por favor intenta de nuevo.")
    } finally {
      setIsProcessing(false)
    }
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
                  <label className="text-sm font-medium">Teléfono (con WhatsApp)</label>
                  <Input
                    value={checkoutData.customerPhone}
                    onChange={(e) => setCheckoutData({ ...checkoutData, customerPhone: e.target.value })}
                    placeholder="04121234567"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={checkoutData.customerEmail}
                    onChange={(e) => setCheckoutData({ ...checkoutData, customerEmail: e.target.value })}
                    placeholder="cliente@email.com"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Dirección de entrega</label>
                  <Input
                    value={checkoutData.deliveryAddress}
                    onChange={(e) => setCheckoutData({ ...checkoutData, deliveryAddress: e.target.value })}
                    placeholder="Av. Principal, Edificio Ana, Piso 1, Caracas"
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

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${formatUSD(subtotal)}</span>
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
                    disabled={!checkoutData.customerName || !checkoutData.customerPhone || !checkoutData.deliveryAddress || isProcessing}
                  >
                    {isProcessing ? (
                      <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <MessageCircle className="mr-2 h-4 w-4" />
                    )}
                    {isProcessing ? "Procesando..." : "Enviar por WhatsApp"}
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
                    <span>${formatUSD(subtotal)}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${formatUSD(total)}</span>
                </div>

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
