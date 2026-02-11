import * as React from "react"
import { Link } from "react-router-dom"
import { ShoppingBag, Package, Search, ExternalLink, Calendar, MapPin, CreditCard, ShoppingCart, CheckCircle, XCircle, Upload, Eye } from "lucide-react"
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
  
  // Estados para subir comprobante
  const [isProofDialogOpen, setIsProofDialogOpen] = React.useState(false)
  const [selectedInstallmentId, setSelectedInstallmentId] = React.useState<string | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)
  const [proofAmount, setProofAmount] = React.useState("")
  const [proofNotes, setProofNotes] = React.useState("")
  const [proofFile, setProofFile] = React.useState<File | null>(null)
  
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
    async function loadInitialData() {
      try {
        setIsLoading(true)
        // Optimizando waterfalls mediante ejecución paralela (async-parallel)
        await Promise.all([
          loadOrders(),
          fetchBCVRate()
        ])
      } finally {
        setIsLoading(false)
      }
    }
    loadInitialData()
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

  const handleRespondProposal = async (orderId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      setIsLoadingDetail(true)
      await api.respondToProposal(orderId, status)
      toast({
        title: status === 'ACCEPTED' ? "Propuesta Aceptada" : "Propuesta Rechazada",
        description: status === 'ACCEPTED' 
          ? "El pedido continuará con los productos disponibles." 
          : "El pedido ha sido cancelado exitosamente.",
      })
      
      // Refresh order list and details
      loadOrders()
      const updatedOrder = await api.getMyOrderDetail(orderId)
      setSelectedOrder(updatedOrder)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar tu respuesta",
        variant: "destructive"
      })
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

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("¿Estás seguro de que deseas cancelar este pedido?")) return;
    
    try {
      setIsLoadingDetail(true);
      await api.cancelMyOrder(orderId, "Cancelado por el cliente desde Mis Pedidos");
      toast({
        title: "Pedido Cancelado",
        description: "Tu pedido ha sido cancelado exitosamente.",
      });
      
      // Refresh order list and details
      loadOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        const updatedOrder = await api.getMyOrderDetail(orderId);
        setSelectedOrder(updatedOrder);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo cancelar el pedido",
        variant: "destructive"
      });
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInstallmentId || !proofFile || !proofAmount) return

    try {
      setIsUploading(true)
      
      // 1. Subir imagen
      const uploadResult = await api.uploadImages([proofFile])
      const proofUrl = uploadResult[0].url

      // 2. Registrar comprobante
      await api.submitPaymentProof(selectedInstallmentId, {
        proofUrl,
        amountUSD: Number(proofAmount),
        notes: proofNotes
      })

      toast({
        title: "Comprobante Enviado",
        description: "El administrador revisará tu pago pronto.",
      })

      // Limpiar y cerrar
      setIsProofDialogOpen(false)
      setProofFile(null)
      setProofAmount("")
      setProofNotes("")
      
      // Recargar detalle del pedido
      if (selectedOrder) {
        const updatedOrder = await api.getMyOrderDetail(selectedOrder.id)
        setSelectedOrder(updatedOrder)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo subir el comprobante",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  const filteredOrders = React.useMemo(() => {
    if (!searchTerm) return orders
    return orders.filter(order => 
      order.saleNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [orders, searchTerm])

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      pending: { label: "Pendiente (por revisión)", class: "bg-amber-100 text-amber-900 border-amber-200" },
      processing: { label: "Procesando (pendiente por pedir)", class: "bg-blue-100 text-blue-900 border-blue-200" },
      accepted: { label: "Aceptado (ya viene en camino)", class: "bg-emerald-100 text-emerald-900 border-emerald-200" },
      shipped: { label: "Enviado", class: "bg-indigo-100 text-indigo-900 border-indigo-200" },
      delivered: { label: "Entregado", class: "bg-emerald-100 text-emerald-900 border-emerald-200" },
      completed: { label: "Completado", class: "bg-green-100 text-green-900 border-green-200" },
      cancelled: { label: "Cancelado", class: "bg-rose-100 text-rose-900 border-rose-200" },
      rejected: { label: "Rechazado", class: "bg-red-100 text-red-900 border-red-200" },
      proposed: { label: "Propuesta Modificada", class: "bg-purple-100 text-purple-900 border-purple-200" },
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
                        {['pending', 'proposed'].includes(order.status.toLowerCase()) && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 sm:flex-none px-4 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelOrder(order.id);
                            }}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1.5" />
                            Cancelar
                          </Button>
                        )}
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
        <DialogContent className="max-w-3xl w-[95vw] sm:w-full max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-xl">
          <DialogHeader className="p-4 sm:p-6 pb-0 shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl sm:text-2xl flex flex-wrap items-center gap-2">
                Detalles del Pedido
                {selectedOrder && (
                  <Badge className={`${getStatusBadge(selectedOrder.status).class} text-[10px] sm:text-xs`} variant="secondary">
                    {getStatusBadge(selectedOrder.status).label}
                  </Badge>
                )}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs sm:text-sm">
              {selectedOrder ? `Pedido ${selectedOrder.saleNumber} • Realizado el ${new Date(selectedOrder.createdAt).toLocaleDateString("es-MX")}` : "Cargando detalles..."}
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="p-12 flex flex-col items-center justify-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-muted-foreground animate-pulse">Obteniendo información del pedido...</p>
            </div>
          ) : selectedOrder ? (
            <ScrollArea className="flex-1 p-4 sm:p-6">
              <div className="grid gap-6 sm:gap-8 grid-cols-1 md:grid-cols-2">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <ShoppingCart className="h-4 w-4 text-primary" />
                      Resumen de Productos
                    </h3>
                    <div className="space-y-4">
                      {selectedOrder.items?.map((item: SaleItem, idx: number) => {
                        const unitPrice = Number(item.unitPrice || 0);
                        const itemName = item.product?.name || item.name || "Producto";
                        const itemImage = item.product?.images?.[0]?.url;
                        const effectiveRate = getOrderRate(selectedOrder);
                        
                        return (
                          <div key={idx} className="flex gap-3 items-start sm:items-center">
                            <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg bg-muted overflow-hidden flex-shrink-0 border">
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
                                <Package className="h-6 w-6 sm:h-8 sm:w-8 m-3 sm:m-4 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-xs sm:text-sm line-clamp-1">{itemName}</p>
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <p className="text-[10px] sm:text-xs text-muted-foreground">
                                  Cant: {item.quantity} 
                                  {item.originalQuantity && item.originalQuantity !== item.quantity && (
                                    <span className="ml-1 line-through opacity-60">({item.originalQuantity})</span>
                                  )}
                                  • {formatUSD(unitPrice)} c/u
                                </p>
                                {item.status === 'REJECTED' && (
                                  <Badge variant="destructive" className="h-3.5 text-[7px] sm:text-[8px] uppercase px-1">No Disponible</Badge>
                                )}
                              </div>
                              {effectiveRate > 0 && (
                                <p className="text-[9px] sm:text-[10px] text-muted-foreground/70">
                                  Bs. {formatBS(unitPrice * effectiveRate)} c/u
                                </p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-bold text-xs sm:text-sm">{formatUSD(unitPrice * item.quantity)}</p>
                              {effectiveRate > 0 && (
                                <p className="text-[10px] sm:text-xs text-muted-foreground">
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
                  <div className="flex flex-col gap-3">
                    <div className="rounded-xl bg-muted/30 p-4 space-y-4 border border-border/50">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-primary mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Envío</p>
                          <p className="text-sm font-medium leading-tight">{selectedOrder.deliveryAddress || "Retiro en tienda"}</p>
                          {selectedOrder.shippingCostUSD > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">Costo: {formatUSD(selectedOrder.shippingCostUSD)}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CreditCard className="h-4 w-4 text-primary mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Método de Pago</p>
                          <p className="text-sm font-medium">{selectedOrder.paymentMethod || "WhatsApp"}</p>
                        </div>
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      className="w-full border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all font-bold gap-2 py-5"
                      onClick={() => {
                        const message = `Hola, contacto por mi pedido ${selectedOrder.saleNumber}`;
                        window.open(`https://wa.me/584244000000?text=${encodeURIComponent(message)}`, '_blank');
                      }}
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.432h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Contactar Proveedor
                    </Button>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <ExternalLink className="h-3 w-3" />
                      Información Adicional
                    </p>
                    <p className="text-sm italic text-muted-foreground leading-relaxed">
                      {selectedOrder.notes || "Sin notas adicionales"}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      Cronología
                    </p>
                    <ScrollArea className="h-[150px] pr-4 border-l border-muted ml-1">
                      <div className="space-y-5 pl-4">
                        {selectedOrder.auditLogs && selectedOrder.auditLogs.length > 0 ? (
                          selectedOrder.auditLogs.map((log: SaleAuditLog, idx: number) => (
                            <div key={idx} className="flex gap-3 text-xs relative">
                              {selectedOrder.auditLogs && idx !== selectedOrder.auditLogs.length - 1 && (
                                <div className="absolute left-[-20.5px] top-[14px] bottom-[-20px] w-[1px] bg-muted-foreground/20" />
                              )}
                              <div className="absolute left-[-24px] mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0 z-10 shadow-[0_0_0_2px_white] dark:shadow-[0_0_0_2px_#020617]" />
                              <div>
                                <p className="font-semibold text-xs leading-tight">
                                  {log.action === 'CREATED' ? 'Pedido realizado' : 
                                   log.action === 'STATUS_CHANGE' ? `Estado actualizado a ${getStatusBadge(log.newStatus || "").label}` : 
                                   log.action}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  {new Date(log.createdAt).toLocaleDateString("es-MX")} {new Date(log.createdAt).toLocaleTimeString("es-MX", { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                {log.reason && <p className="text-muted-foreground/80 mt-1 text-[11px] leading-snug">{log.reason}</p>}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex gap-3 text-xs relative">
                            <div className="absolute left-[-24px] mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0 z-10 shadow-[0_0_0_2px_white] dark:shadow-[0_0_0_2px_#020617]" />
                            <p className="font-medium">Pedido realizado: {new Date(selectedOrder.createdAt).toLocaleString("es-MX")}</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>

              {selectedOrder.status.toLowerCase() === 'proposed' && (
                <div className="mt-8 p-5 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/50 rounded-xl space-y-4">
                  <div className="flex items-center gap-3 text-purple-900 dark:text-purple-300">
                    <Package className="h-5 w-5" />
                    <h4 className="font-bold">Propuesta de Pedido Modificada</h4>
                  </div>
                  <p className="text-sm text-purple-800/80 dark:text-purple-300/80 leading-relaxed">
                    El administrador ha revisado tu pedido. Algunos productos no están disponibles. 
                    Puedes aceptar continuar con los productos restantes o rechazar esta propuesta y cancelar el pedido.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button 
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold h-11"
                      onClick={() => handleRespondProposal(selectedOrder.id, 'ACCEPTED')}
                      disabled={isLoadingDetail}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aceptar Propuesta
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-100 dark:border-purple-800 dark:text-purple-300 font-bold h-11"
                      onClick={() => handleRespondProposal(selectedOrder.id, 'REJECTED')}
                      disabled={isLoadingDetail}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rechazar y Cancelar
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-8 border-t pt-6 space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm text-muted-foreground">Subtotal</span>
                  <div className="text-right">
                    <span className="font-semibold text-sm sm:text-base">{formatUSD(Number(selectedOrder.subtotalUSD))}</span>
                    {getOrderRate(selectedOrder) > 0 && (
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Bs. {formatBS(Number(selectedOrder.subtotalUSD) * getOrderRate(selectedOrder))}</p>
                    )}
                  </div>
                </div>
                {Number(selectedOrder.shippingCostUSD) > 0 && (
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm text-muted-foreground">Envío</span>
                    <div className="text-right">
                      <span className="font-semibold text-sm sm:text-base">{formatUSD(Number(selectedOrder.shippingCostUSD))}</span>
                      {getOrderRate(selectedOrder) > 0 && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Bs. {formatBS(Number(selectedOrder.shippingCostUSD) * getOrderRate(selectedOrder))}</p>
                      )}
                    </div>
                  </div>
                )}
                <Separator className="my-1" />
                <div className="flex justify-between items-center py-2">
                  <span className="text-lg sm:text-xl font-bold">Total</span>
                  <div className="text-right">
                    <span className="text-2xl sm:text-3xl font-black text-primary leading-none">{formatUSD(Number(selectedOrder.totalUSD))}</span>
                    {getOrderRate(selectedOrder) > 0 && (
                      <div className="text-xs sm:text-sm font-bold text-muted-foreground mt-1">
                        <div>Bs. {formatBS(Number(selectedOrder.totalUSD) * getOrderRate(selectedOrder))}</div>
                        <div className="text-[9px] sm:text-[10px] opacity-70 font-normal">(Tasa: {formatBS(getOrderRate(selectedOrder))})</div>
                      </div>
                    )}
                  </div>
                </div>
                {getOrderRate(selectedOrder) > 0 && (
                  <p className="text-[10px] text-center text-muted-foreground/60 mt-6 pt-6 border-t border-dashed">
                    Tasa de cambio aplicada: 1 USD = {formatBS(getOrderRate(selectedOrder))} Bs.
                  </p>
                )}
              </div>

              {selectedOrder.paymentStatus?.installments && selectedOrder.paymentStatus.installments.length > 0 && (
                <div className="mt-8 border-t pt-6">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Plan de Pagos por Cuotas
                  </h3>
                  <div className="space-y-4">
                    {selectedOrder.paymentStatus.installments.map((inst, idx) => (
                      <Card key={inst.id} className="bg-muted/10">
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold">Cuota #{idx + 1}</span>
                                <Badge 
                                  variant="outline" 
                                  className={
                                    inst.status === 'PAID' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                    inst.status === 'PARTIAL' ? "bg-amber-50 text-amber-700 border-amber-200" :
                                    "bg-slate-50 text-slate-700 border-slate-200"
                                  }
                                >
                                  {inst.status === 'PAID' ? 'Pagada' : inst.status === 'PARTIAL' ? 'Pago Parcial' : 'Pendiente'}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                Vence: {new Date(inst.dueDate).toLocaleDateString("es-MX")}
                              </div>
                            </div>
                            
                            <div className="text-right flex flex-col justify-center">
                              <div className="text-lg font-black text-primary">{formatUSD(Number(inst.amountUSD))}</div>
                              {inst.paidAmount > 0 && (
                                <div className="text-xs text-emerald-600 font-medium">
                                  Pagado: {formatUSD(Number(inst.paidAmount))}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center">
                              {inst.status !== 'PAID' && (
                                <Button 
                                  size="sm" 
                                  className="w-full sm:w-auto gap-2"
                                  onClick={() => {
                                    setSelectedInstallmentId(inst.id)
                                    setProofAmount((Number(inst.amountUSD) - Number(inst.paidAmount)).toString())
                                    setIsProofDialogOpen(true)
                                  }}
                                >
                                  <Upload className="h-3.5 w-3.5" />
                                  Subir Comprobante
                                </Button>
                              )}
                            </div>
                          </div>

                          {inst.proofs && inst.proofs.length > 0 && (
                            <div className="mt-4 pt-4 border-t space-y-2">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Comprobantes enviados:</p>
                              {inst.proofs.map((proof) => (
                                <div key={proof.id} className="flex items-center justify-between text-xs bg-white dark:bg-slate-900 p-2 rounded border">
                                  <div className="flex items-center gap-2">
                                    <Badge 
                                      variant="outline" 
                                      className={
                                        proof.status === 'APPROVED' ? "bg-emerald-50 text-emerald-700" :
                                        proof.status === 'REJECTED' ? "bg-rose-50 text-rose-700" :
                                        "bg-amber-50 text-amber-700"
                                      }
                                    >
                                      {proof.status === 'APPROVED' ? 'Aprobado' : proof.status === 'REJECTED' ? 'Rechazado' : 'En revisión'}
                                    </Badge>
                                    <span className="font-medium">{formatUSD(Number(proof.amountUSD))}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">{new Date(proof.createdAt).toLocaleDateString()}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                                      <a href={proof.proofUrl} target="_blank" rel="noreferrer">
                                        <Eye className="h-3.5 w-3.5" />
                                      </a>
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isProofDialogOpen} onOpenChange={setIsProofDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Upload className="h-5 w-5" />
              Subir Comprobante de Pago
            </DialogTitle>
            <DialogDescription>
              Adjunta una captura de pantalla o foto de tu pago. El administrador lo verificará pronto.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitProof} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Monto Pagado (USD)</label>
              <Input
                type="number"
                step="0.01"
                required
                value={proofAmount}
                onChange={(e) => setProofAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Imagen del Comprobante</label>
              <Input
                type="file"
                accept="image/*"
                required
                onChange={(e) => setProofFile(e.target.files?.[0] || null)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notas adicionales (Opcional)</label>
              <Input
                value={proofNotes}
                onChange={(e) => setProofNotes(e.target.value)}
                placeholder="Ej: Transferencia desde Banco X, referencia #123"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsProofDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isUploading || !proofFile}>
                {isUploading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Enviar Comprobante
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default OrdersPage
