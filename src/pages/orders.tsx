import * as React from "react"
import { Link } from "react-router-dom"
import { ShoppingBag, Package, Search, ExternalLink, Calendar, MapPin, CreditCard, ShoppingCart } from "lucide-react"
import { useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { formatUSD, formatBS } from "@/lib/utils"
import { api, API_BASE } from "@/lib/api"
import { toast } from "@/hooks/use-toast"
import { useCart } from "@/contexts/cart-context"
import type { Sale as Order, SaleItem, SaleAuditLog } from "@/types"

export function OrdersPage() {
  const [searchParams] = useSearchParams()
  const orderIdFromUrl = searchParams.get("id")
  const [orders, setOrders] = React.useState<Order[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null)
  const [isDetailOpen, setIsDetailOpen] = React.useState(false)
  const [isLoadingDetail, setIsLoadingDetail] = React.useState(false)
  const [bcvRate, setBcvRate] = React.useState<number>(0)
  
  // Función para determinar qué tasa usar (histórica del pedido o actual)
  const getOrderRate = (order: Order) => {
    // Si el pedido está completado, entregado o pagado, DEBEMOS usar la tasa que se guardó en ese momento
    if (order.status.toLowerCase() === 'completed' || 
        order.status.toLowerCase() === 'delivered' || 
        order.isPaid || 
        order.bcvRate > 0) {
      return Number(order.bcvRate);
    }
    // Si no tiene tasa guardada (pedidos muy viejos o pendientes), usar la tasa actual del estado
    return bcvRate;
  };
  
  const { addItem } = useCart()

  React.useEffect(() => {
    loadOrders()
    fetchBCVRate()
  }, [])

  React.useEffect(() => {
    if (orderIdFromUrl) {
      handleViewDetails(orderIdFromUrl)
    }
  }, [orderIdFromUrl])

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
    
    let addedCount = 0;
    let outOfStockCount = 0;

    order.items.forEach(item => {
      // Solo podemos agregar al carrito si tenemos la información completa del producto
      const product = item.product;
      
      if (product) {
        // Validar stock: El producto debe tener stock y la cantidad solicitada debe ser menor o igual al stock disponible
        const availableStock = product.stock || 0;
        
        if (availableStock > 0) {
          // Si el stock es menor a lo que pidió originalmente, agregamos lo que haya disponible (máximo la cantidad original)
          const quantityToAdd = Math.min(item.quantity || 1, availableStock);
          addItem(product, quantityToAdd);
          addedCount++;
          
          if (quantityToAdd < (item.quantity || 1)) {
            // Se agregó parcialmente por falta de stock
            console.warn(`Producto ${product.name} agregado parcialmente (${quantityToAdd}/${item.quantity}) por stock limitado.`);
          }
        } else {
          outOfStockCount++;
        }
      } else {
        // Si no hay información del producto, lo contamos como no disponible
        outOfStockCount++;
      }
    });
    
    if (addedCount > 0) {
      toast({
        title: outOfStockCount > 0 ? "Pedido repetido parcialmente" : "Productos agregados",
        description: outOfStockCount > 0 
          ? `Se agregaron ${addedCount} productos al carrito. ${outOfStockCount} productos no tienen stock suficiente.`
          : "Todos los productos del pedido han sido agregados al carrito.",
        variant: outOfStockCount > 0 ? "default" : "default"
      });
    } else if (outOfStockCount > 0) {
      toast({
        title: "No se pudo repetir el pedido",
        description: "Ninguno de los productos tiene stock disponible actualmente.",
        variant: "destructive"
      });
    }
  }

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      const token = api.getToken();
      const url = `${API_BASE}/sales/${orderId}/invoice?token=${token}`;
      window.open(url, '_blank');
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar la factura",
        variant: "destructive"
      });
    }
  };

  const filteredOrders = React.useMemo(() => {
    if (!searchTerm) return orders
    return orders.filter(order => 
      order.saleNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [orders, searchTerm])

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      pending: { label: "Pendiente", class: "bg-amber-100 text-amber-900 border-amber-200" },
      processing: { label: "Procesando", class: "bg-blue-100 text-blue-900 border-blue-200" },
      accepted: { label: "Aceptado", class: "bg-emerald-100 text-emerald-900 border-emerald-200" },
      shipped: { label: "Enviado", class: "bg-indigo-100 text-indigo-900 border-indigo-200" },
      delivered: { label: "Entregado", class: "bg-emerald-100 text-emerald-900 border-emerald-200" },
      completed: { label: "Completado", class: "bg-green-100 text-green-900 border-green-200" },
      cancelled: { label: "Cancelado", class: "bg-rose-100 text-rose-900 border-rose-200" },
      rejected: { label: "Rechazado", class: "bg-red-100 text-red-900 border-red-200" },
    }
    return statusMap[status.toLowerCase()] || { label: status, class: "bg-slate-100 text-slate-900 border-slate-200" }
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
                          <span className="font-bold text-base">{order.saleNumber}</span>
                          <Badge className={status.class} variant="outline">
                            {status.label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-foreground/80 font-medium">
                          <p className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            {new Date(order.createdAt).toLocaleDateString("es-MX")}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="font-bold text-primary">{formatUSD(order.totalUSD)}</span>
                          </p>
                          <p className="flex items-center gap-1.5 text-muted-foreground font-normal">
                            <Package className="h-3.5 w-3.5" />
                            {order.items?.length || 0} productos
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 border-t p-4 sm:border-l sm:border-t-0 sm:p-6 bg-muted/20">
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="flex-1 sm:flex-none shadow-sm px-4"
                          onClick={() => handleViewDetails(order.id)}
                        >
                          Ver detalles
                        </Button>
                        {(order.status.toLowerCase() === 'completed' || order.status.toLowerCase() === 'delivered') && (
                          <>
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              className="flex-1 sm:flex-none px-4"
                              onClick={() => handleRepeatOrder(order)}
                            >
                              <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                              Repetir
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="flex-1 sm:flex-none px-4"
                              onClick={() => handleDownloadInvoice(order.id)}
                            >
                              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                              Factura
                            </Button>
                          </>
                        )}
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
                      {selectedOrder.items?.map((item: SaleItem, idx: number) => {
                        const unitPrice = Number(item.unitPrice || 0);
                        const itemName = item.product?.name || item.name || "Producto";
                        const itemImage = item.product?.images?.[0]?.url;
                        const effectiveRate = getOrderRate(selectedOrder);
                        
                        return (
                          <div key={idx} className="flex gap-3">
                            <div className="h-16 w-16 rounded-md bg-muted overflow-hidden flex-shrink-0 border">
                              {itemImage ? (
                                <img 
                                  src={itemImage} 
                                  alt={itemName} 
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
                              <p className="font-medium text-sm line-clamp-1">{itemName}</p>
                              <p className="text-xs text-muted-foreground">Cant: {item.quantity} • {formatUSD(unitPrice)} c/u</p>
                              {effectiveRate > 0 && (
                                <p className="text-[10px] text-muted-foreground/70">
                                  Bs. {formatBS(unitPrice * effectiveRate)} c/u
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-sm">{formatUSD(unitPrice * item.quantity)}</p>
                              {effectiveRate > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  Bs. {formatBS(unitPrice * item.quantity * effectiveRate)}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-xl bg-muted/30 p-4 space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-primary mt-1" />
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Envío</p>
                        <p className="text-sm font-medium">{selectedOrder.deliveryAddress || "Retiro en tienda"}</p>
                        {selectedOrder.shippingCostUSD > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">Costo: {formatUSD(selectedOrder.shippingCostUSD)}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CreditCard className="h-4 w-4 text-primary mt-1" />
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Método de Pago</p>
                        <p className="text-sm font-medium">{selectedOrder.paymentMethod || "WhatsApp"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <ExternalLink className="h-3 w-3" />
                      Información Adicional
                    </p>
                    <p className="text-sm italic text-muted-foreground">
                      {selectedOrder.notes || "Sin notas adicionales"}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      Cronología
                    </p>
                    <ScrollArea className="h-[150px] pr-4">
                      <div className="space-y-4">
                        {selectedOrder.auditLogs && selectedOrder.auditLogs.length > 0 ? (
                          selectedOrder.auditLogs.map((log: SaleAuditLog, idx: number) => (
                            <div key={idx} className="flex gap-3 text-xs relative">
                              {selectedOrder.auditLogs && idx !== selectedOrder.auditLogs.length - 1 && (
                                <div className="absolute left-[3.5px] top-[14px] bottom-[-16px] w-[1px] bg-muted-foreground/20" />
                              )}
                              <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0 z-10 shadow-[0_0_0_2px_white]" />
                              <div>
                                <p className="font-medium">
                                  {log.action === 'CREATED' ? 'Pedido realizado' : 
                                   log.action === 'STATUS_CHANGE' ? `Estado actualizado a ${getStatusBadge(log.newStatus || "").label}` : 
                                   log.action}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {new Date(log.createdAt).toLocaleDateString("es-MX")} {new Date(log.createdAt).toLocaleTimeString("es-MX", { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                {log.reason && <p className="text-muted-foreground mt-0.5">{log.reason}</p>}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex gap-3 text-xs">
                            <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                            <p className="font-medium">Pedido realizado: {new Date(selectedOrder.createdAt).toLocaleString("es-MX")}</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t pt-6 space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-muted-foreground">Subtotal</span>
                  <div className="text-right">
                    <span className="font-medium">{formatUSD(Number(selectedOrder.subtotalUSD))}</span>
                    {getOrderRate(selectedOrder) > 0 && (
                      <p className="text-xs text-muted-foreground">Bs. {formatBS(Number(selectedOrder.subtotalUSD) * getOrderRate(selectedOrder))}</p>
                    )}
                  </div>
                </div>
                {Number(selectedOrder.shippingCostUSD) > 0 && (
                  <div className="flex justify-between items-baseline">
                    <span className="text-muted-foreground">Envío</span>
                    <div className="text-right">
                      <span className="font-medium">{formatUSD(Number(selectedOrder.shippingCostUSD))}</span>
                      {getOrderRate(selectedOrder) > 0 && (
                        <p className="text-xs text-muted-foreground">Bs. {formatBS(Number(selectedOrder.shippingCostUSD) * getOrderRate(selectedOrder))}</p>
                      )}
                    </div>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between items-baseline">
                  <span className="text-xl font-bold">Total</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-primary">{formatUSD(Number(selectedOrder.totalUSD))}</span>
                    {getOrderRate(selectedOrder) > 0 && (
                      <div className="text-sm font-bold text-muted-foreground text-right">
                        <div>Bs. {formatBS(Number(selectedOrder.totalUSD) * getOrderRate(selectedOrder))}</div>
                        <div className="text-[10px] opacity-70 font-normal">(Tasa: {formatBS(getOrderRate(selectedOrder))})</div>
                      </div>
                    )}
                  </div>
                </div>
                {getOrderRate(selectedOrder) > 0 && (
                  <p className="text-[10px] text-center text-muted-foreground/60 mt-6 pt-4 border-t">
                    Tasa de cambio aplicada: 1 USD = {formatBS(getOrderRate(selectedOrder))} Bs.
                  </p>
                )}
              </div>
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default OrdersPage
