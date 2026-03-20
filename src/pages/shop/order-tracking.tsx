import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import {
  ChevronRight,
  Package,
  Check,
  Clock,
  X,
  DollarSign,
  Phone,
  MapPin,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import { formatUSD, formatBS, cn } from "@/lib/utils"

interface TrackedOrder {
  saleNumber: string
  status: string
  deliveryStatus: string
  customerName: string
  createdAt: string
  updatedAt: string
  items: { name: string; quantity: number; status: string }[]
  totalUSD: number
  totalBS: number
  isPaid: boolean
  paymentStatus: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
  PROCESSING: { label: "Procesando", color: "bg-blue-100 text-blue-800 border-blue-200", icon: Package },
  ACCEPTED: { label: "Aceptado", color: "bg-green-100 text-green-800 border-green-200", icon: Check },
  COMPLETED: { label: "Completado", color: "bg-green-100 text-green-800 border-green-200", icon: Check },
  REJECTED: { label: "Rechazado", color: "bg-red-100 text-red-800 border-red-200", icon: X },
  CANCELLED: { label: "Cancelado", color: "bg-gray-100 text-gray-800 border-gray-200", icon: X },
  PROPOSED: { label: "Propuesta Enviada", color: "bg-purple-100 text-purple-800 border-purple-200", icon: AlertCircle },
}

const DELIVERY_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  NOT_DELIVERED: { label: "Sin entregar", color: "text-muted-foreground" },
  IN_TRANSIT: { label: "En tránsito", color: "text-blue-600" },
  DELIVERED: { label: "Entregado", color: "text-green-600" },
}

const ITEM_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  ACCEPTED: { label: "Confirmado", color: "text-green-600" },
  REJECTED: { label: "No disponible", color: "text-red-600" },
  PENDING: { label: "Pendiente", color: "text-yellow-600" },
}

export function OrderTrackingPage() {
  const { saleNumber } = useParams<{ saleNumber: string }>()
  const [order, setOrder] = useState<TrackedOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchNumber, setSearchNumber] = useState("")
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (saleNumber) {
      fetchOrder(saleNumber)
    }
  }, [saleNumber])

  const fetchOrder = async (number: string) => {
    if (!number) return

    setLoading(true)
    setError(null)

    try {
      const data = await api.trackOrder(number) as TrackedOrder
      setOrder(data)
    } catch (err: any) {
      console.error("Error fetching order:", err)
      if (err.message?.includes("404") || err.message?.includes("no encontrado")) {
        setError("No encontramos un pedido con ese número. Verifica el número e intenta de nuevo.")
      } else {
        setError("Error al cargar la información del pedido. Por favor intenta de nuevo.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchNumber.trim()) {
      fetchOrder(searchNumber.trim())
    }
  }

  const handleRefresh = async () => {
    if (!order) return
    setRefreshing(true)
    await fetchOrder(order.saleNumber)
    setRefreshing(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-VE", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const statusConfig = order ? STATUS_CONFIG[order.status] || { label: order.status, color: "bg-gray-100", icon: Clock } : null
  const StatusIcon = statusConfig?.icon || Clock

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-lg mx-auto text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Buscando tu pedido...</p>
        </div>
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
          <span className="font-medium text-foreground">Seguir Pedido</span>
        </nav>
      </div>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Seguir mi Pedido</h1>

        {!order && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Ingresa el número de tu pedido
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={searchNumber}
                      onChange={(e) => setSearchNumber(e.target.value)}
                      placeholder="Ej: VTA-260319-0001"
                      className="flex-1 h-12 px-4 rounded-xl border border-input bg-background text-sm"
                    />
                    <Button type="submit" size="lg" disabled={!searchNumber.trim()}>
                      Buscar
                    </Button>
                  </div>
                </div>
              </form>
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {order && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Pedido #{order.saleNumber}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="text-muted-foreground"
                  >
                    <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", statusConfig?.color.split(" ")[0])}>
                      <StatusIcon className={cn("h-5 w-5", statusConfig?.color.split(" ")[1])} />
                    </div>
                    <div>
                      <p className="font-semibold">{statusConfig?.label}</p>
                      <p className="text-sm text-muted-foreground">
                        Actualizado: {formatDate(order.updatedAt)}
                      </p>
                    </div>
                  </div>
                  {order.isPaid ? (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <DollarSign className="h-3 w-3 mr-1" />
                      Pagado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                      Pendiente de Pago
                    </Badge>
                  )}
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Estado de entrega:</span>
                    <span className={DELIVERY_STATUS_CONFIG[order.deliveryStatus]?.color || ""}>
                      {DELIVERY_STATUS_CONFIG[order.deliveryStatus]?.label || order.deliveryStatus}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Cliente:</span>
                    <span>{order.customerName}</span>
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-xl">
                  <p className="text-sm text-muted-foreground mb-1">Fecha del pedido</p>
                  <p className="font-medium">{formatDate(order.createdAt)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Productos ({order.items.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.items.map((item, index) => {
                  const itemStatus = ITEM_STATUS_CONFIG[item.status] || { label: item.status, color: "text-muted-foreground" }
                  return (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
                      </div>
                      <Badge variant="outline" className={itemStatus.color}>
                        {itemStatus.label}
                      </Badge>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-bold text-lg">${formatUSD(order.totalUSD)}</span>
                  </div>
                  {order.totalBS && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Equivalente</span>
                      <span className="text-muted-foreground">Bs. {formatBS(Number(order.totalBS))}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl">
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">¿Tienes dudas sobre tu pedido?</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Contacta con nosotros por WhatsApp para cualquier consulta sobre tu pedido.
                  </p>
                  <Button asChild size="sm" className="bg-green-600 hover:bg-green-700">
                    <a
                      href="https://wa.me/584123456789"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Contactar por WhatsApp
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button variant="outline" asChild>
                <Link to="/productos">Seguir comprando</Link>
              </Button>
            </div>
          </div>
        )}

        <Card className="mt-8">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-3">¿Dónde encuentro mi número de pedido?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Tu número de pedido fue enviado a tu WhatsApp al momento de hacer el pedido. También puedes
              encontrarlo en tu correo de confirmación si realizaste uno.
            </p>
            <p className="text-sm text-muted-foreground">
              El formato del número de pedido es: <code className="bg-muted px-2 py-1 rounded">VTA-YYMMDD-XXXX</code>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
