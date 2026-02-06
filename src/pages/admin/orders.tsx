import { useState, useEffect } from "react"
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  MessageCircle,
  Search,
  Download,
  Eye,
  MoreHorizontal,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AdminLayout } from "@/components/layout/admin-layout"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { formatUSD } from "@/lib/utils"

interface OrderItem {
  productId: string
  name: string
  quantity: number
  unitPrice: number
  total: number
}

interface Order {
  id: string
  saleNumber: string
  customerName: string
  customerPhone: string | null
  customerEmail: string | null
  items: OrderItem[]
  totalUSD: number
  status: string
  paymentMethod: string
  deliveryAddress: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
  auditLogs?: AuditLog[]
}

interface AuditLog {
  id: string
  action: string
  oldStatus: string | null
  newStatus: string | null
  userId: string | null
  reason: string | null
  createdAt: string
  user?: {
    name: string
  }
}

export function AdminOrdersPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    fetchOrders()
    // Polling cada 30 segundos para nuevos pedidos (tiempo real simulado)
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchOrders = async () => {
    try {
      const data = await api.getSales()
      setOrders(data.sales || [])
    } catch (error) {
      console.error("Error fetching orders:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las órdenes",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const formatStatus = (status: string) => {
    const statusMap: Record<string, { label: string; class: string; color: string }> = {
      PENDING: { label: "Pendiente", class: "bg-yellow-100 text-yellow-800", color: "yellow" },
      PROCESSING: { label: "Procesando", class: "bg-blue-100 text-blue-800", color: "blue" },
      ACCEPTED: { label: "Aceptado", class: "bg-green-100 text-green-800", color: "green" },
      REJECTED: { label: "Rechazado", class: "bg-red-100 text-red-800", color: "red" },
      COMPLETED: { label: "Completado", class: "bg-emerald-100 text-emerald-800", color: "emerald" },
      CANCELLED: { label: "Cancelado", class: "bg-gray-100 text-gray-800", color: "gray" },
    }
    return statusMap[status] || { label: status, class: "bg-gray-100 text-gray-800", color: "gray" }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "PROCESSING":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "ACCEPTED":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />
      case "CANCELLED":
        return <XCircle className="h-4 w-4 text-gray-500" />
      default:
        return <Package className="h-4 w-4 text-gray-500" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const updateOrderStatus = async (orderId: string, status: string, reason?: string) => {
    try {
      await api.updateSaleStatus(orderId, status, reason)
      toast({
        title: "Estado actualizado",
        description: `La orden ha sido marcada como ${formatStatus(status).label}`,
      })
      fetchOrders()
      if (selectedOrder?.id === orderId) {
        // Refresh detail view if it's the current one
        const updatedOrders = await api.getSales()
        const updatedOrder = updatedOrders.sales.find((o: any) => o.id === orderId)
        if (updatedOrder) setSelectedOrder(updatedOrder)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el estado",
        variant: "destructive"
      })
    }
  }

  const sendWhatsAppReminder = async (order: Order) => {
    const message = `Hola ${order.customerName}, te contactamos de Ana's Supplements sobre tu pedido ${order.saleNumber}. El estado actual es: ${formatStatus(order.status).label}.`
    const phone = order.customerPhone?.replace(/\D/g, "")
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank")
    } else {
      toast({
        title: "Error",
        description: "No hay número de teléfono válido para este cliente",
        variant: "destructive"
      })
    }
  }

  const exportOrders = () => {
    const csvContent = orders.map(order =>
      `${order.saleNumber},${order.customerName},${order.customerEmail || ""},${order.totalUSD},${order.status},${order.createdAt}`
    ).join("\n")
    
    const header = "Orden,Cliente,Email,Total USD,Estado,Fecha\n"
    const blob = new Blob([header + csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ordenes_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  const generateInvoicePDF = (order: Order) => {
    const items = Array.isArray(order.items) ? order.items : []
    const companyInfo = {
      name: "Ana's Supplements",
      address: "Av. Principal #123, Col. Centro, Ciudad de Mexico",
      phone: "55 5123 4567",
      email: "contacto@anas-supplements.com",
    }

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Factura ${order.saleNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #0066cc; padding-bottom: 20px; }
          .company-name { font-size: 28px; font-weight: bold; color: #0066cc; }
          .company-details { font-size: 12px; color: #666; line-height: 1.6; }
          .invoice-title { font-size: 24px; font-weight: bold; color: #333; }
          .invoice-info { text-align: right; font-size: 12px; color: #666; }
          .customer-section { margin-bottom: 30px; }
          .customer-title { font-weight: bold; margin-bottom: 10px; color: #0066cc; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .table th { background: #0066cc; color: white; padding: 12px 8px; text-align: left; font-size: 12px; }
          .table td { padding: 12px 8px; border-bottom: 1px solid #eee; font-size: 13px; }
          .table tr:last-child td { border-bottom: 2px solid #0066cc; }
          .totals { float: right; width: 300px; }
          .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .total-row.final { border-bottom: 2px solid #0066cc; font-weight: bold; font-size: 18px; padding-top: 12px; }
          .footer { clear: both; margin-top: 50px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company-name">${companyInfo.name}</div>
            <div class="company-details">
              ${companyInfo.address}<br>
              Tel: ${companyInfo.phone}<br>
              ${companyInfo.email}
            </div>
          </div>
          <div class="invoice-info">
            <div class="invoice-title">FACTURA</div>
            <div>No. ${order.saleNumber}</div>
            <div>Fecha: ${new Date(order.createdAt).toLocaleDateString("es-MX")}</div>
          </div>
        </div>

        <div class="customer-section">
          <div class="customer-title">CLIENTE</div>
          <div>${order.customerName}</div>
          ${order.customerEmail ? `<div>${order.customerEmail}</div>` : ""}
          ${order.customerPhone ? `<div>Tel: ${order.customerPhone}</div>` : ""}
          ${order.deliveryAddress ? `<div>Dirección: ${order.deliveryAddress}</div>` : ""}
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>PRODUCTO</th>
              <th style="text-align: center;">CANT.</th>
              <th style="text-align: right;">PRECIO</th>
              <th style="text-align: right;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">${formatUSD(item.unitPrice)}</td>
                <td style="text-align: right;">${formatUSD(item.total)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal</span>
            <span>${formatUSD(order.totalUSD)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.2rem; margin-top: 0.5rem; border-top: 2px solid #000; padding-top: 0.5rem;">
            <span>TOTAL</span>
            <span>${formatUSD(order.totalUSD)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Gracias por su compra en ${companyInfo.name}</p>
          <p>Esta factura fue generada el ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(invoiceHTML)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
      }, 250)
    }
  }

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.saleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusCounts = {
    all: orders.length,
    PENDING: orders.filter(o => o.status === "PENDING").length,
    PROCESSING: orders.filter(o => o.status === "PROCESSING").length,
    ACCEPTED: orders.filter(o => o.status === "ACCEPTED").length,
    REJECTED: orders.filter(o => o.status === "REJECTED").length,
    COMPLETED: orders.filter(o => o.status === "COMPLETED").length,
    CANCELLED: orders.filter(o => o.status === "CANCELLED").length,
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion de Ordenes</h1>
            <p className="text-muted-foreground">Administra y da seguimiento a todos los pedidos</p>
          </div>
          <Button onClick={exportOrders}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por orden, cliente o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="PENDING">Pendiente</SelectItem>
              <SelectItem value="PROCESSING">Procesando</SelectItem>
              <SelectItem value="ACCEPTED">Aceptado</SelectItem>
              <SelectItem value="REJECTED">Rechazado</SelectItem>
              <SelectItem value="COMPLETED">Completado</SelectItem>
              <SelectItem value="CANCELLED">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="all">Todos ({statusCounts.all})</TabsTrigger>
            <TabsTrigger value="PENDING">Pendiente ({statusCounts.PENDING})</TabsTrigger>
            <TabsTrigger value="PROCESSING">Procesando ({statusCounts.PROCESSING})</TabsTrigger>
            <TabsTrigger value="ACCEPTED">Aceptado ({statusCounts.ACCEPTED})</TabsTrigger>
            <TabsTrigger value="REJECTED">Rechazado ({statusCounts.REJECTED})</TabsTrigger>
            <TabsTrigger value="COMPLETED">Completado ({statusCounts.COMPLETED})</TabsTrigger>
            <TabsTrigger value="CANCELLED">Cancelado ({statusCounts.CANCELLED})</TabsTrigger>
          </TabsList>

          <TabsContent value={statusFilter} className="mt-6">
            <div className="grid gap-4">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const status = formatStatus(order.status)
                  const items = Array.isArray(order.items) ? order.items : []
                  
                  return (
                    <Card key={order.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-full bg-gray-100 shrink-0">
                              {getStatusIcon(order.status)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-lg font-semibold">{order.saleNumber}</h3>
                                <Badge className={status.class}>{status.label}</Badge>
                                {order.paymentMethod === 'WHATSAPP' && (
                                  <Badge variant="outline" className="bg-green-50 text-green-700">
                                    <MessageCircle className="h-3 w-3 mr-1" />
                                    WhatsApp
                                  </Badge>
                                )}
                              </div>
                              <p className="text-muted-foreground mt-1 truncate">
                                {order.customerName} • {order.customerEmail || "Sin email"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(order.createdAt)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between md:justify-end gap-4">
                            <div className="text-right">
                              <p className="text-2xl font-bold">${formatUSD(order.totalUSD)}</p>
                              <p className="text-sm text-muted-foreground">
                                {items.length} producto{items.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button variant="outline" size="icon" onClick={() => setSelectedOrder(order)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver detalles
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => sendWhatsAppReminder(order)}>
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Enviar WhatsApp
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => generateInvoicePDF(order)}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Descargar factura
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions for Pending */}
                        {order.status === 'PENDING' && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
                            <span className="text-sm font-medium text-blue-900">¿Aceptar este pedido?</span>
                            <div className="flex gap-2 w-full sm:w-auto">
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
                                onClick={() => updateOrderStatus(order.id, 'ACCEPTED')}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Aceptar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                className="flex-1 sm:flex-none"
                                onClick={() => {
                                  const reason = prompt("Motivo del rechazo:")
                                  if (reason !== null) updateOrderStatus(order.id, 'REJECTED', reason)
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Rechazar
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Order Items Preview */}
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex flex-wrap gap-2">
                            {items.slice(0, 3).map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm">
                                <span className="truncate max-w-[200px]">{item.name}</span>
                                <span className="text-muted-foreground">x{item.quantity}</span>
                              </div>
                            ))}
                            {items.length > 3 && (
                              <span className="px-3 py-1 text-sm text-muted-foreground">
                                +{items.length - 3} más
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Update Buttons */}
                        <div className="mt-4 pt-4 border-t flex flex-wrap items-center gap-3">
                          <span className="text-sm text-muted-foreground">Cambiar estado:</span>
                          <Select value={order.status} onValueChange={(val) => updateOrderStatus(order.id, val)}>
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">Pendiente</SelectItem>
                              <SelectItem value="PROCESSING">Procesando</SelectItem>
                              <SelectItem value="ACCEPTED">Aceptado</SelectItem>
                              <SelectItem value="REJECTED">Rechazado</SelectItem>
                              <SelectItem value="COMPLETED">Completado</SelectItem>
                              <SelectItem value="CANCELLED">Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <div className="ml-auto">
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                               onClick={() => setSelectedOrder(order)}
                             >
                               Ver Historial
                             </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              ) : (
                <Card>
                  <CardContent className="py-16 text-center">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No hay ordenes</h3>
                    <p className="text-muted-foreground">No se encontraron ordenes con los criterios de busqueda.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Orden {selectedOrder.saleNumber}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)}>
                  <XCircle className="h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-1">Cliente</h4>
                      <p className="font-medium">{selectedOrder.customerName}</p>
                      {selectedOrder.customerEmail && <p className="text-sm text-muted-foreground">{selectedOrder.customerEmail}</p>}
                      {selectedOrder.customerPhone && <p className="text-sm text-muted-foreground">{selectedOrder.customerPhone}</p>}
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-1">Método de Pago</h4>
                      <Badge variant="outline">{selectedOrder.paymentMethod}</Badge>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-1">Estado Actual</h4>
                      <Badge className={formatStatus(selectedOrder.status).class}>
                        {formatStatus(selectedOrder.status).label}
                      </Badge>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-1">Fecha de Pedido</h4>
                      <p className="text-sm">{formatDate(selectedOrder.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {selectedOrder.deliveryAddress && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-1">Dirección de Entrega</h4>
                    <p className="text-sm">{selectedOrder.deliveryAddress}</p>
                  </div>
                )}

                {selectedOrder.notes && (
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-1">Notas del Cliente</h4>
                    <p className="text-sm italic text-yellow-900">{selectedOrder.notes}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">Resumen de Productos</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Producto</th>
                          <th className="px-4 py-2 text-center">Cant.</th>
                          <th className="px-4 py-2 text-right">Precio</th>
                          <th className="px-4 py-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {Array.isArray(selectedOrder.items) && selectedOrder.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2">{item.name}</td>
                            <td className="px-4 py-2 text-center">{item.quantity}</td>
                            <td className="px-4 py-2 text-right">${formatUSD(item.unitPrice)}</td>
                            <td className="px-4 py-2 text-right font-medium">${formatUSD(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 font-bold">
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-right">TOTAL</td>
                          <td className="px-4 py-3 text-right text-lg">${formatUSD(selectedOrder.totalUSD)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Audit Logs */}
                {selectedOrder.auditLogs && selectedOrder.auditLogs.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">Historial de la Orden</h4>
                    <div className="space-y-3 border-l-2 border-gray-100 ml-2 pl-4">
                      {selectedOrder.auditLogs.map((log) => (
                        <div key={log.id} className="relative">
                          <div className="absolute -left-[21px] top-1.5 h-3 w-3 rounded-full bg-gray-200 border-2 border-white" />
                          <p className="text-sm font-medium">
                            {log.action === 'STATUS_CHANGE' 
                              ? `Estado cambiado de ${formatStatus(log.oldStatus || '').label} a ${formatStatus(log.newStatus || '').label}`
                              : log.action === 'CREATED' 
                                ? 'Pedido recibido' 
                                : log.action}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(log.createdAt)} {log.user?.name ? `por ${log.user.name}` : ''}
                          </p>
                          {log.reason && (
                            <p className="text-xs mt-1 text-red-600 bg-red-50 p-1 rounded inline-block">
                              Motivo: {log.reason}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => sendWhatsAppReminder(selectedOrder)}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Enviar WhatsApp
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => generateInvoicePDF(selectedOrder)}>
                    <Download className="h-4 w-4 mr-2" />
                    Descargar PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
