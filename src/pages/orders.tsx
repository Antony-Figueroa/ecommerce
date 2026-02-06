import * as React from "react"
import { Link } from "react-router-dom"
import { ShoppingBag, Package, Search, ExternalLink, Calendar, MapPin, CreditCard, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { formatUSD } from "@/lib/utils"
import { api } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { useCart } from "@/contexts/cart-context"
import type { Sale as Order } from "@/types"

export function OrdersPage() {
  const [orders, setOrders] = React.useState<Order[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [isLoadingDetail, setIsLoadingDetail] = React.useState(false)
  
  const { addItem } = useCart()

  React.useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setIsLoading(true)
      const response = await api.getMyOrders()
      setOrders(response.sales || [])
    } catch (error) {
      console.error("Error loading orders:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDetails = async (orderId: string) => {
    try {
      setIsLoadingDetail(true)
      setIsDetailOpen(true)
      const order = await api.getMyOrderDetail(orderId)
      setSelectedOrder(order)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles del pedido",
        variant: "destructive"
      })
      setIsDetailOpen(false)
    } finally {
      setIsLoadingDetail(false)
    }
  }

  const handleRepeatOrder = (order: Order) => {
    if (!order.items) return
    
    order.items.forEach(item => {
      if (item.product) {
        addItem(item.product, item.quantity || 1)
      }
    })
    
    toast({
      title: "Productos agregados",
      description: "Los productos del pedido han sido agregados al carrito."
    })
  }

  const filteredOrders = React.useMemo(() => {
    if (!searchTerm) return orders
    return orders.filter(order => 
      order.saleNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [orders, searchTerm])

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      pending: { label: "Pendiente", class: "bg-yellow-100 text-yellow-800" },
      confirmed: { label: "Confirmado", class: "bg-blue-100 text-blue-800" },
      shipped: { label: "Enviado", class: "bg-purple-100 text-purple-800" },
      delivered: { label: "Entregado", class: "bg-green-100 text-green-800" },
      cancelled: { label: "Cancelado", class: "bg-red-100 text-red-800" },
    }
    return statusMap[status] || { label: status, class: "bg-gray-100 text-gray-800" }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mis Pedidos</h1>
            <p className="text-muted-foreground">Gestiona y revisa el historial de tus pedidos</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Buscar pedido..." 
              className="pl-10" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-6 text-primary">
              <Package className="h-12 w-12" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">
              {searchTerm ? "No se encontraron pedidos" : "Aún no has realizado ningún pedido"}
            </h2>
            <p className="mb-8 max-w-md text-muted-foreground">
              {searchTerm 
                ? `No encontramos ningún pedido que coincida con "${searchTerm}"`
                : "Cuando realices tu primera compra, aparecerá aquí para que puedas seguir su estado."}
            </p>
            {!searchTerm && (
              <Button asChild>
                <Link to="/productos" className="gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Empezar a comprar
                </Link>
              </Button>
            )}
            {searchTerm && (
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Limpiar búsqueda
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const status = getStatusBadge(order.status)
              return (
                <Card key={order.id} className="overflow-hidden transition-shadow hover:shadow-md">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <div className="flex-1 p-6">
                        <div className="mb-2 flex items-center gap-3">
                          <span className="font-bold">{order.saleNumber}</span>
                          <Badge className={status.class} variant="secondary">
                            {status.label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                          <p>Fecha: {new Date(order.createdAt).toLocaleDateString("es-MX")}</p>
                          <p>Total: {formatUSD(order.totalUSD)}</p>
                          <p>{order.items?.length || 0} productos</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 border-t p-4 sm:border-l sm:border-t-0 sm:p-6">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 sm:flex-none"
                          onClick={() => handleViewDetails(order.id)}
                        >
                          Ver detalles
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1 sm:flex-none"
                          onClick={() => handleRepeatOrder(order)}
                        >
                          Repetir pedido
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl flex items-center gap-2">
              Detalles del Pedido
              {selectedOrder && (
                <Badge className={getStatusBadge(selectedOrder.status).class} variant="secondary">
                  {getStatusBadge(selectedOrder.status).label}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder ? `Pedido ${selectedOrder.saleNumber} • Realizado el ${new Date(selectedOrder.createdAt).toLocaleDateString("es-MX")}` : "Cargando detalles..."}
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="p-12 flex flex-col items-center justify-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-muted-foreground animate-pulse">Obteniendo información del pedido...</p>
            </div>
          ) : selectedOrder ? (
            <ScrollArea className="flex-1 p-6">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-primary" />
                      Resumen de Productos
                    </h3>
                    <div className="space-y-3">
                      {selectedOrder.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex gap-3">
                          <div className="h-16 w-16 rounded-md bg-muted overflow-hidden flex-shrink-0 border">
                            {item.product?.images?.[0] ? (
                              <img 
                                src={item.product.images[0]} 
                                alt={item.product.name} 
                                className="h-full w-full object-cover" 
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "https://placehold.co/100x100/f8fafc/6366f1?text=X";
                                  target.onerror = null;
                                }}
                              />
                            ) : (
                              <Package className="h-8 w-8 m-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm line-clamp-1">{item.product?.name || "Producto"}</p>
                            <p className="text-xs text-muted-foreground">Cant: {item.quantity} • {formatUSD(item.priceUSD)} c/u</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm">{formatUSD(item.priceUSD * item.quantity)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatUSD(selectedOrder.subtotalUSD || selectedOrder.totalUSD)}</span>
                    </div>
                    {selectedOrder.taxUSD !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Impuestos</span>
                        <span>{formatUSD(selectedOrder.taxUSD)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span className="text-primary">{formatUSD(selectedOrder.totalUSD)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-lg bg-muted/50 p-4 space-y-4 border">
                    <div>
                      <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        Envío
                      </h4>
                      <p className="text-sm font-medium">{selectedOrder.shippingCostUSD > 0 ? "Envío a domicilio" : "Retiro en tienda"}</p>
                      {selectedOrder.shippingCostUSD > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">Costo: {formatUSD(selectedOrder.shippingCostUSD)}</p>
                      )}
                    </div>

                    <Separator className="bg-border/50" />

                    <div>
                      <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-2">
                        <CreditCard className="h-3 w-3" />
                        Información Adicional
                      </h4>
                      <p className="text-sm text-muted-foreground italic">
                        {selectedOrder.notes || "Sin notas adicionales"}
                      </p>
                    </div>

                    <Separator className="bg-border/50" />

                    <div>
                      <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        Cronología
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                          <p className="text-[11px]">Pedido realizado: {new Date(selectedOrder.createdAt).toLocaleString("es-MX")}</p>
                        </div>
                        {selectedOrder.status !== 'pending' && (
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <p className="text-[11px]">Estado actualizado a {getStatusBadge(selectedOrder.status).label}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button className="w-full gap-2" onClick={() => handleRepeatOrder(selectedOrder)}>
                      <ShoppingCart className="h-4 w-4" />
                      Repetir este pedido
                    </Button>
                    <Button variant="outline" className="w-full gap-2" asChild>
                      <a href={`/api/sales/${selectedOrder.id}/invoice`} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        Descargar Factura (PDF)
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default OrdersPage
