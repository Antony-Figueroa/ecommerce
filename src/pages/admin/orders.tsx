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
  orderNumber: string
  customerName: string
  customerPhone: string | null
  customerEmail: string | null
  items: OrderItem[]
  total: number
  status: string
  whatsappSent: boolean
  deliveryAddress: string | null
  notes: string | null
  createdAt: string
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
  }, [])

  const fetchOrders = async () => {
    try {
      const data = await api.getSales()
      setOrders(data.sales || [])
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const formatStatus = (status: string) => {
    const statusMap: Record<string, { label: string; class: string; color: string }> = {
      PENDING: { label: "Pendiente", class: "bg-yellow-100 text-yellow-800", color: "yellow" },
      CONFIRMED: { label: "Confirmado", class: "bg-blue-100 text-blue-800", color: "blue" },
      PROCESSING: { label: "Procesando", class: "bg-purple-100 text-purple-800", color: "purple" },
      SHIPPED: { label: "Enviado", class: "bg-indigo-100 text-indigo-800", color: "indigo" },
      DELIVERED: { label: "Entregado", class: "bg-green-100 text-green-800", color: "green" },
      CANCELLED: { label: "Cancelado", class: "bg-red-100 text-red-800", color: "red" },
    }
    return statusMap[status] || { label: status, class: "bg-gray-100 text-gray-800", color: "gray" }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "CONFIRMED":
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case "CANCELLED":
        return <XCircle className="h-4 w-4 text-red-500" />
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

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.updateSaleStatus(orderId, status)
      fetchOrders()
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status })
      }
    } catch {
    }
  }

  const sendWhatsAppReminder = async (_orderId: string) => {
    // WhatsApp functionality not yet implemented in API
    toast({
      title: "Próximamente",
      description: "Función de WhatsApp no implementada aún",
    })
  }

  const exportOrders = () => {
    const csvContent = orders.map(order =>
      `${order.orderNumber},${order.customerName},${order.customerEmail},${order.total},${order.status},${order.createdAt}`
    ).join("\n")
    
    const header = "Orden,Cliente,Email,Total,Estado,Fecha\n"
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
      email: "contacto@farmasiaplus.com",
    }

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Factura ${order.orderNumber}</title>
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
            <div>No. ${order.orderNumber}</div>
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
            <span>${formatUSD(order.total)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 1.2rem; margin-top: 0.5rem; border-top: 2px solid #000; padding-top: 0.5rem;">
            <span>TOTAL</span>
            <span>${formatUSD(order.total)}</span>
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
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const statusCounts = {
    all: orders.length,
    PENDING: orders.filter(o => o.status === "PENDING").length,
    CONFIRMED: orders.filter(o => o.status === "CONFIRMED").length,
    PROCESSING: orders.filter(o => o.status === "PROCESSING").length,
    SHIPPED: orders.filter(o => o.status === "SHIPPED").length,
    DELIVERED: orders.filter(o => o.status === "DELIVERED").length,
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
              <SelectItem value="CONFIRMED">Confirmado</SelectItem>
              <SelectItem value="PROCESSING">Procesando</SelectItem>
              <SelectItem value="SHIPPED">Enviado</SelectItem>
              <SelectItem value="DELIVERED">Entregado</SelectItem>
              <SelectItem value="CANCELLED">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Tabs */}
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="all">Todos ({statusCounts.all})</TabsTrigger>
            <TabsTrigger value="PENDING">Pendiente ({statusCounts.PENDING})</TabsTrigger>
            <TabsTrigger value="CONFIRMED">Confirmado ({statusCounts.CONFIRMED})</TabsTrigger>
            <TabsTrigger value="PROCESSING">Procesando ({statusCounts.PROCESSING})</TabsTrigger>
            <TabsTrigger value="SHIPPED">Enviado ({statusCounts.SHIPPED})</TabsTrigger>
            <TabsTrigger value="DELIVERED">Entregado ({statusCounts.DELIVERED})</TabsTrigger>
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
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="p-3 rounded-full bg-gray-100">
                              {getStatusIcon(order.status)}
                            </div>
                            <div>
                              <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold">{order.orderNumber}</h3>
                                <Badge className={status.class}>{status.label}</Badge>
                                {order.whatsappSent && (
                                  <Badge variant="outline" className="bg-green-50 text-green-700">
                                    <MessageCircle className="h-3 w-3 mr-1" />
                                    WhatsApp
                                  </Badge>
                                )}
                              </div>
                              <p className="text-muted-foreground mt-1">
                                {order.customerName} • {order.customerEmail || "Sin email"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(order.createdAt)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-2xl font-bold">${formatUSD(order.total)}</p>
                              <p className="text-sm text-muted-foreground">
                                {items.length} producto{items.length !== 1 ? "s" : ""}
                              </p>
                            </div>
                            
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
                                <DropdownMenuItem onClick={() => sendWhatsAppReminder(order.id)}>
                                  <MessageCircle className="h-4 w-4 mr-2" />
                                  Enviar WhatsApp
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" />
                                  Descargar factura
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

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
                                +{items.length - 3} mas
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Update Buttons */}
                        <div className="mt-4 pt-4 border-t flex gap-2">
                          <span className="text-sm text-muted-foreground self-center">Cambiar estado:</span>
                          <Select value={order.status} onValueChange={(val) => updateOrderStatus(order.id, val)}>
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">Pendiente</SelectItem>
                              <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                              <SelectItem value="PROCESSING">Procesando</SelectItem>
                              <SelectItem value="SHIPPED">Enviado</SelectItem>
                              <SelectItem value="DELIVERED">Entregado</SelectItem>
                              <SelectItem value="CANCELLED">Cancelado</SelectItem>
                            </SelectContent>
                          </Select>
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
                <CardTitle>Orden {selectedOrder.orderNumber}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)}>
                  <XCircle className="h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-muted-foreground">Cliente</h4>
                    <p>{selectedOrder.customerName}</p>
                    {selectedOrder.customerEmail && <p className="text-sm">{selectedOrder.customerEmail}</p>}
                    {selectedOrder.customerPhone && <p className="text-sm">{selectedOrder.customerPhone}</p>}
                  </div>
                  <div>
                    <h4 className="font-medium text-muted-foreground">Estado</h4>
                    <Badge className={formatStatus(selectedOrder.status).class}>
                      {formatStatus(selectedOrder.status).label}
                    </Badge>
                  </div>
                </div>

                {selectedOrder.deliveryAddress && (
                  <div>
                    <h4 className="font-medium text-muted-foreground">Direccion de entrega</h4>
                    <p>{selectedOrder.deliveryAddress}</p>
                  </div>
                )}

                {selectedOrder.notes && (
                  <div>
                    <h4 className="font-medium text-muted-foreground">Notas</h4>
                    <p>{selectedOrder.notes}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-muted-foreground mb-2">Productos</h4>
                  <div className="space-y-2">
                    {Array.isArray(selectedOrder.items) && selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between p-3 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            ${formatUSD(item.unitPrice)} x {item.quantity}
                          </p>
                        </div>
                        <p className="font-semibold">${formatUSD(item.total)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span>${formatUSD(selectedOrder.total)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => sendWhatsAppReminder(selectedOrder.id)}>
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
