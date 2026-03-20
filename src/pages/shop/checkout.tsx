import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  ChevronRight,
  ChevronLeft,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  MessageCircle,
  Heart,
  RotateCcw,
  Check,
  MapPin,
  Phone,
  Mail,
  Package,
  Copy,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { formatUSD, formatBS, cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { CheckoutSteps, CHECKOUT_STEPS } from "@/components/shop/checkout-steps"

type CheckoutStep = 1 | 2 | 3 | 4

interface CheckoutData {
  customerName: string
  customerPhone: string
  customerEmail: string
  deliveryAddress: string
  notes: string
}

export function CheckoutPage() {
  const { items, updateQuantity, removeItem, clearCart, totalPrice, saveForLater, moveToCart, getSavedItems } = useCart()
  const { user } = useAuth()
  const { toast } = useToast()

  const [currentStep, setCurrentStep] = useState<CheckoutStep>(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [bcvRate, setBcvRate] = useState<number>(0)
  const [whatsappNumber, setWhatsappNumber] = useState("584123456789")
  const [savedItems, setSavedItems] = useState<typeof items>([])
  const [createdSaleNumber, setCreatedSaleNumber] = useState<string>("")

  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deliveryAddress: "",
    notes: "",
  })

  useEffect(() => {
    if (user) {
      setCheckoutData((prev) => ({
        customerName: prev.customerName || user.name || "",
        customerPhone: prev.customerPhone || user.phone || "",
        customerEmail: prev.customerEmail || user.email || "",
        deliveryAddress: prev.deliveryAddress || user.address || "",
        notes: prev.notes,
      }))
    }
  }, [user])

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
      const settings = await api.getPublicSettings()
      if (settings.whatsapp_number) {
        const cleanNumber = settings.whatsapp_number.replace(/\+/g, "").replace(/\D/g, "")
        setWhatsappNumber(cleanNumber)
      }
    } catch (error) {
      console.error("Error fetching public settings:", error)
    }
  }

  const subtotal = totalPrice

  const isStep1Valid = items.length > 0
  const isStep2Valid =
    checkoutData.customerName.trim() !== "" &&
    checkoutData.customerPhone.trim() !== "" &&
    checkoutData.deliveryAddress.trim() !== ""

  const handleNextStep = () => {
    if (currentStep === 1 && isStep1Valid) {
      setCurrentStep(2)
    } else if (currentStep === 2 && isStep2Valid) {
      setCurrentStep(3)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as CheckoutStep)
    }
  }

  const generateWhatsAppOrder = async () => {
    if (isProcessing) return

    try {
      setIsProcessing(true)

      const orderData = {
        userId: user?.id,
        customerName: checkoutData.customerName,
        customerPhone: checkoutData.customerPhone,
        customerEmail: checkoutData.customerEmail,
        deliveryAddress: checkoutData.deliveryAddress,
        notes: checkoutData.notes,
        paymentMethod: "WHATSAPP",
        items: items.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          quantity: item.quantity,
          unitPrice: Number(item.product.price),
        })),
      }

      const result = await api.createSale(orderData) as any
      const saleNumber = result.sale?.saleNumber || result.saleNumber || "N/A"
      setCreatedSaleNumber(saleNumber)

      const phoneNumber = whatsappNumber

      let message = `*🧪 Nueva Orden - Ana's Supplements*\n\n`
      message += `*#Pedido:* ${saleNumber}\n\n`
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
      if (bcvRate > 0) {
        message += `   Subtotal (Bs.): Bs. ${formatBS(subtotal * bcvRate)}\n`
      }
      message += `*   Total: $${formatUSD(subtotal)}*\n`
      if (bcvRate > 0) {
        message += `*   Total (Bs.): Bs. ${formatBS(subtotal * bcvRate)}*\n`
        message += `   (Tasa BCV: Bs. ${formatBS(bcvRate)})\n`
      }

      message += `\n*📍 Dirección de Entrega:*\n${checkoutData.deliveryAddress}\n`

      if (checkoutData.notes) {
        message += `\n*📝 Notas:*\n${checkoutData.notes}\n`
      }

      message += `\n_\nPedido generado desde Ana's Supplements E-commerce_`

      const encodedMessage = encodeURIComponent(message)
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`

      const win = window.open(whatsappUrl, "_blank")

      if (!win || win.closed || typeof win.closed === "undefined") {
        window.location.href = whatsappUrl
      } else {
        clearCart()
        setCurrentStep(4)
      }
    } catch (error: any) {
      console.error("Error creating order:", error)
      toast({
        title: "Error al procesar pedido",
        description: error.message || "Hubo un error al procesar tu pedido. Por favor intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const copySaleNumber = () => {
    navigator.clipboard.writeText(createdSaleNumber)
    toast({
      title: "Copiado",
      description: "Número de pedido copiado al portapapeles",
    })
  }

  const renderStep1_Cart = () => (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-8">
        {items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                {items.length} {items.length === 1 ? "producto" : "productos"} en tu carrito
              </CardTitle>
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
                          const target = e.target as HTMLImageElement
                          target.src = "https://placehold.co/200x200/f8fafc/6366f1?text=Error"
                          target.onerror = null
                        }}
                      />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium">{item.product.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.product.brand}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.product.format} • {item.product.weight}
                          </p>
                          <div className="mt-1">
                            <p className="text-sm font-semibold">${formatUSD(item.product.price)}</p>
                            {bcvRate > 0 && (
                              <p className="text-xs text-muted-foreground">
                                Bs. {formatBS(Number(item.product.price) * bcvRate)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${formatUSD(Number(item.product.price) * item.quantity)}</p>
                          {bcvRate > 0 && (
                            <p className="text-xs text-muted-foreground italic">
                              Bs. {formatBS(Number(item.product.price) * item.quantity * bcvRate)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            className="h-8 w-16 text-center"
                            readOnly
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
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
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => removeItem(item.product.id)}
                          >
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
                          const target = e.target as HTMLImageElement
                          target.src = "https://placehold.co/100x100/f8fafc/6366f1?text=Img"
                          target.onerror = null
                        }}
                      />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <div>
                        <h3 className="font-medium">{item.product.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity} • ${formatUSD(item.product.price)}
                        </p>
                      </div>
                      <div className="mt-auto">
                        <Button variant="outline" size="sm" onClick={() => moveToCart(item.product.id)}>
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
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>Resumen del pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
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

            <Button className="w-full" size="lg" onClick={handleNextStep} disabled={!isStep1Valid}>
              Continuar
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>

            <Link to="/productos" className="block text-center text-sm text-primary hover:underline">
              Continuar comprando
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderStep2_DeliveryInfo = () => (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Información de Entrega
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <span className="text-destructive">*</span> Nombre completo
              </label>
              <Input
                value={checkoutData.customerName}
                onChange={(e) => setCheckoutData({ ...checkoutData, customerName: e.target.value })}
                placeholder="Juan Perez"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span className="text-destructive">*</span> Teléfono (con WhatsApp)
              </label>
              <Input
                value={checkoutData.customerPhone}
                onChange={(e) => setCheckoutData({ ...checkoutData, customerPhone: e.target.value })}
                placeholder="04121234567"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </label>
              <Input
                type="email"
                value={checkoutData.customerEmail}
                onChange={(e) => setCheckoutData({ ...checkoutData, customerEmail: e.target.value })}
                placeholder="cliente@email.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="text-destructive">*</span> Dirección de entrega
              </label>
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
                placeholder="Entregar después de las 6pm, portería abierta..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex gap-4">
          <Button variant="outline" onClick={handlePrevStep}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <Button className="flex-1" onClick={handleNextStep} disabled={!isStep2Valid}>
            Continuar
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div>
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>Resumen del pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="max-h-48 overflow-y-auto space-y-3">
              {items.map((item) => (
                <div key={item.product.id} className="flex justify-between items-start text-sm">
                  <div>
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">${formatUSD(item.product.price * item.quantity)}</p>
                </div>
              ))}
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
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderStep3_Confirm = () => (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Datos de Entrega
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-bold text-primary">{checkoutData.customerName.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="font-semibold">{checkoutData.customerName}</p>
                <p className="text-muted-foreground">{checkoutData.customerPhone}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <p>{checkoutData.deliveryAddress}</p>
            </div>
            {checkoutData.customerEmail && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <p className="text-muted-foreground">{checkoutData.customerEmail}</p>
              </div>
            )}
            {checkoutData.notes && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-xs font-medium mb-1">Notas:</p>
                <p className="text-sm">{checkoutData.notes}</p>
              </div>
            )}
            <Button variant="outline" size="sm" className="mt-2" onClick={handlePrevStep}>
              Editar datos
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Productos ({items.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item) => (
              <div key={item.product.id} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-md overflow-hidden bg-muted">
                    <img
                      src={item.product.image || "/placeholder.png"}
                      alt={item.product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">Cantidad: {item.quantity}</p>
                  </div>
                </div>
                <p className="font-semibold">${formatUSD(item.product.price * item.quantity)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>Resumen del Pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <div className="text-right">
                  <div>${formatUSD(subtotal)}</div>
                  {bcvRate > 0 && <div className="text-xs text-muted-foreground">Bs. {formatBS(subtotal * bcvRate)}</div>}
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Envío</span>
                <span className="text-sm">Por confirmar</span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between font-semibold text-lg">
              <span>Total Estimado</span>
              <div className="text-right">
                <div>${formatUSD(subtotal)}</div>
                {bcvRate > 0 && (
                  <div className="text-sm font-normal text-muted-foreground italic">
                    Bs. {formatBS(subtotal * bcvRate)}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <MessageCircle className="h-5 w-5" />
                <span className="font-medium">Pedido por WhatsApp</span>
              </div>
              <p className="text-sm text-green-600">
                Se abrirá WhatsApp para enviar tu pedido directamente a la farmacia. Un ejecutivo te
                contactará para confirmar disponibilidad, envío y forma de pago.
              </p>
            </div>

            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
              onClick={generateWhatsAppOrder}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Enviar por WhatsApp
                </>
              )}
            </Button>

            <Button variant="outline" className="w-full" onClick={handlePrevStep}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderStep4_Success = () => (
    <div className="max-w-lg mx-auto text-center space-y-6">
      <div className="flex justify-center">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
          <Check className="h-10 w-10 text-green-600" />
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold mb-2">¡Pedido Enviado!</h1>
        <p className="text-muted-foreground">
          Tu pedido ha sido registrado exitosamente. Por favor completa el envío por WhatsApp para que
          procesemos tu orden.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Número de Pedido</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-2xl font-bold font-mono">{createdSaleNumber}</p>
                <Button variant="ghost" size="icon" onClick={copySaleNumber}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm text-muted-foreground mb-2">Resumen</p>
              <div className="flex justify-between text-sm">
                <span>Productos</span>
                <span className="font-semibold">{items.length}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span>Total</span>
                <span className="font-semibold">${formatUSD(subtotal)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-2 text-primary mb-2">
            <MessageCircle className="h-5 w-5" />
            <span className="font-semibold">Revisa WhatsApp</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Tu pedido debería haberse abierto en WhatsApp. Si no se abrió, puedes enviar un mensaje
            manualmente a nuestro número con el número de pedido: <span className="font-mono font-semibold">{createdSaleNumber}</span>
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <Button asChild size="lg">
          <Link to="/pedidos">Ver mis pedidos</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/productos">Seguir comprando</Link>
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        ¿Tienes dudas? Contacta con nosotros por{" "}
        <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          WhatsApp
        </a>
      </p>
    </div>
  )

  if (currentStep === 4) {
    return (
      <div className="container mx-auto px-4 py-8">
        {renderStep4_Success()}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">
            Inicio
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/carrito" className="hover:text-primary">
            Carrito
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className={cn("font-medium", currentStep === 1 && "text-foreground")}>Checkout</span>
        </nav>
      </div>

      <CheckoutSteps currentStep={currentStep} steps={CHECKOUT_STEPS} />

      {currentStep === 1 && renderStep1_Cart()}
      {currentStep === 2 && renderStep2_DeliveryInfo()}
      {currentStep === 3 && renderStep3_Confirm()}
    </div>
  )
}
