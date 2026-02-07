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
  Truck,
  User,
  TrendingUp,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
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
  id: string
  productId: string
  name: string
  quantity: number
  originalQuantity?: number | null
  unitPrice: number
  total: number
  status: string
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
  isPaid: boolean
  paidAmountUSD: number | null
  deliveryStatus: string
  createdAt: string
  updatedAt: string
  auditLogs?: AuditLog[]
}

interface AuditLog {
  id: string
  action: string
  oldStatus: string | null
  newStatus: string | null
  oldDeliveryStatus: string | null
  newDeliveryStatus: string | null
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
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false)
  const [rejectionOrderId, setRejectionOrderId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null)
  const [editingQuantity, setEditingQuantity] = useState<{itemId: string, quantity: number} | null>(null)

  // Payment confirmation states
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<string>("")
  const [paymentReason, setPaymentReason] = useState("")

  // Delivery status states
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false)
  const [deliveryOrderId, setDeliveryOrderId] = useState<string | null>(null)
  const [newDeliveryStatus, setNewDeliveryStatus] = useState<string>("")
  const [deliveryReason, setDeliveryReason] = useState("")

  useEffect(() => {
    fetchOrders()
    // Polling cada 30 segundos para nuevos pedidos (tiempo real simulado)
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchOrders = async () => {
    try {
      const data = await api.getSales()
      console.log("Fetched orders:", data.sales) // Depuración
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
      PENDING: { 
        label: "Pendiente (por revisión)", 
        class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800", 
        color: "yellow" 
      },
      PROCESSING: { 
        label: "Procesando (pendiente por pedir)", 
        class: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800", 
        color: "blue" 
      },
      ACCEPTED: { 
        label: "Aceptado (ya viene en camino)", 
        class: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800", 
        color: "green" 
      },
      REJECTED: { 
        label: "Rechazado", 
        class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800", 
        color: "red" 
      },
      COMPLETED: { 
        label: "Completado", 
        class: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800", 
        color: "emerald" 
      },
      PROPOSED: { 
        label: "Propuesta Enviada", 
        class: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800", 
        color: "purple" 
      },
      CANCELLED: { 
        label: "Cancelado", 
        class: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700", 
        color: "gray" 
      },
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
      case "PROPOSED":
        return <MessageCircle className="h-4 w-4 text-purple-500" />
      case "CANCELLED":
        return <XCircle className="h-4 w-4 text-gray-500" />
      default:
        return <Package className="h-4 w-4 text-gray-500" />
    }
  }

  const formatDeliveryStatus = (status: string) => {
    const statusMap: Record<string, { label: string; class: string; color: string }> = {
      NOT_DELIVERED: { 
        label: "No entregado", 
        class: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700", 
        color: "gray" 
      },
      DELIVERED: { 
        label: "Entregado", 
        class: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800", 
        color: "emerald" 
      },
    }
    return statusMap[status] || { label: status === "IN_TRANSIT" ? "En tránsito (obsoleto)" : (status || "Pendiente"), class: "bg-gray-100 text-gray-800", color: "gray" }
  }

  const getDeliveryStatusIcon = (status: string) => {
    switch (status) {
      case "NOT_DELIVERED":
        return <Package className="h-4 w-4 text-gray-500" />
      case "DELIVERED":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />
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
    setUpdatingId(orderId)
    try {
      await api.updateSaleStatus(orderId, status, reason)
      toast({
        title: "Estado actualizado",
        description: `La orden ha sido marcada como ${formatStatus(status).label}`,
      })
      await fetchOrders()
      if (selectedOrder?.id === orderId) {
        // Refresh detail view if it's the current one
        const updatedOrders = await api.getSales()
        const updatedOrder = updatedOrders.sales.find((o: any) => o.id === orderId)
        if (updatedOrder) setSelectedOrder(updatedOrder)
      }
      if (status === 'REJECTED') {
        setRejectionModalOpen(false)
        setRejectionReason("")
        setRejectionOrderId(null)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el estado",
        variant: "destructive"
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const updateOrderItemStatus = async (orderId: string, itemId: string, status: string) => {
    setUpdatingItemId(itemId)
    try {
      await api.updateSaleItemStatus(orderId, itemId, status)
      toast({
        title: "Item actualizado",
        description: `El producto ha sido marcado como ${status === 'ACCEPTED' ? 'Aceptado' : 'Rechazado'}`,
      })
      
      // Refresh order data
      await fetchOrders()
      if (selectedOrder?.id === orderId) {
        const updatedOrders = await api.getSales()
        const updatedOrder = updatedOrders.sales.find((o: any) => o.id === orderId)
        if (updatedOrder) setSelectedOrder(updatedOrder)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el item",
        variant: "destructive"
      })
    } finally {
      setUpdatingItemId(null)
    }
  }

  const updateOrderItemQuantity = async (orderId: string, itemId: string, quantity: number) => {
    setUpdatingItemId(itemId)
    try {
      await api.updateSaleItemQuantity(orderId, itemId, quantity)
      toast({
        title: "Cantidad actualizada",
        description: "La cantidad del producto ha sido ajustada correctamente",
      })
      
      setEditingQuantity(null)
      // Refresh order data
      await fetchOrders()
      if (selectedOrder?.id === orderId) {
        const updatedOrders = await api.getSales()
        const updatedOrder = updatedOrders.sales.find((o: any) => o.id === orderId)
        if (updatedOrder) setSelectedOrder(updatedOrder)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la cantidad",
        variant: "destructive"
      })
    } finally {
      setUpdatingItemId(null)
    }
  }

  const acceptAllOrderItems = async (orderId: string) => {
    setUpdatingId(orderId)
    try {
      await api.acceptAllSaleItems(orderId)
      toast({
        title: "Items aceptados",
        description: "Todos los productos han sido marcados como aceptados",
      })
      
      // Refresh order data
      await fetchOrders()
      if (selectedOrder?.id === orderId) {
        const updatedOrders = await api.getSales()
        const updatedOrder = updatedOrders.sales.find((o: any) => o.id === orderId)
        if (updatedOrder) setSelectedOrder(updatedOrder)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron aceptar los items",
        variant: "destructive"
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const updateDeliveryStatus = async (orderId: string, deliveryStatus: string, reason?: string) => {
    setUpdatingId(orderId)
    try {
      await api.updateSaleDeliveryStatus(orderId, deliveryStatus, reason)
      toast({
        title: "Entrega actualizada",
        description: `El estado de entrega ha sido marcado como ${formatDeliveryStatus(deliveryStatus).label}`,
      })
      setDeliveryModalOpen(false)
      setDeliveryReason("")
      await fetchOrders()
      if (selectedOrder?.id === orderId) {
        const updatedOrders = await api.getSales()
        const updatedOrder = updatedOrders.sales.find((o: any) => o.id === orderId)
        if (updatedOrder) setSelectedOrder(updatedOrder)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el estado de entrega",
        variant: "destructive"
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDeliveryStatusClick = (orderId: string, status: string) => {
    setDeliveryOrderId(orderId)
    setNewDeliveryStatus(status)
    setDeliveryReason("")
    setDeliveryModalOpen(true)
  }

  const confirmDeliveryStatus = () => {
    if (deliveryOrderId && newDeliveryStatus) {
      updateDeliveryStatus(deliveryOrderId, newDeliveryStatus, deliveryReason)
    }
  }

  const handleRejectClick = (orderId: string) => {
    setRejectionOrderId(orderId)
    setRejectionModalOpen(true)
  }

  const confirmRejection = () => {
    if (rejectionOrderId && rejectionReason.trim()) {
      updateOrderStatus(rejectionOrderId, 'REJECTED', rejectionReason)
    } else {
      toast({
        title: "Motivo requerido",
        description: "Por favor, ingresa el motivo del rechazo",
        variant: "destructive"
      })
    }
  }

  const handlePaymentClick = (order: Order) => {
    if (order.status !== 'ACCEPTED') {
      toast({
        title: "Acción no permitida",
        description: "Solo se puede confirmar el pago de pedidos aceptados",
        variant: "destructive"
      })
      return
    }
    setPaymentOrderId(order.id)
    setPaymentAmount(order.totalUSD.toString())
    setPaymentReason("")
    setPaymentModalOpen(true)
  }

  const confirmPayment = async () => {
    if (!paymentOrderId) return
    
    const amount = parseFloat(paymentAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Monto inválido",
        description: "Por favor, ingresa un monto válido mayor a 0",
        variant: "destructive"
      })
      return
    }

    setUpdatingId(paymentOrderId)
    try {
      await api.confirmSalePayment(paymentOrderId, amount, paymentReason)
      toast({
        title: "Pago confirmado",
        description: `La orden ha sido marcada como Pagada y Completada`,
      })
      setPaymentModalOpen(false)
      await fetchOrders()
      if (selectedOrder?.id === paymentOrderId) {
        const updatedOrders = await api.getSales()
        const updatedOrder = updatedOrders.sales.find((o: any) => o.id === paymentOrderId)
        if (updatedOrder) setSelectedOrder(updatedOrder)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo confirmar el pago",
        variant: "destructive"
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const sendWhatsAppReminder = async (order: Order) => {
    const statusLabels: Record<string, string> = {
      PENDING: "Pendiente (por revisión)",
      PROCESSING: "Procesando (pendiente por pedir)",
      ACCEPTED: "Aceptado (ya viene en camino)",
      REJECTED: "Rechazado",
      COMPLETED: "Completado",
      PROPOSED: "Propuesta Enviada",
      CANCELLED: "Cancelado",
    }
    const label = statusLabels[order.status] || order.status
    const message = `Hola ${order.customerName}, te contactamos de Ana's Supplements sobre tu pedido ${order.saleNumber}. El estado actual es: ${label}.`
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
      address: "Av. Principal, Edificio Ana, Piso 1, Caracas",
      phone: "+58 412 345 6789",
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
    PROPOSED: orders.filter(o => o.status === "PROPOSED").length,
  }

  if (loading) {
    return (
      <AdminLayout title="Ordenes">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Ordenes">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
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
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="all">Todos ({statusCounts.all})</TabsTrigger>
            <TabsTrigger value="PENDING">Pendiente ({statusCounts.PENDING})</TabsTrigger>
            <TabsTrigger value="PROCESSING">Procesando ({statusCounts.PROCESSING})</TabsTrigger>
            <TabsTrigger value="ACCEPTED">Aceptado ({statusCounts.ACCEPTED})</TabsTrigger>
            <TabsTrigger value="PROPOSED">Propuesta ({statusCounts.PROPOSED})</TabsTrigger>
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
                    <Card key={order.id} className="group hover:shadow-lg transition-all duration-300 border-gray-200/60 dark:border-gray-800/60 overflow-hidden">
                      <CardContent className="p-0">
                        <div className="p-6">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                            <div className="flex items-start gap-4">
                              <div className={`p-3 rounded-2xl ${status.color === 'yellow' ? 'bg-yellow-50 dark:bg-yellow-900/20' : 
                                               status.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20' :
                                               status.color === 'green' ? 'bg-green-50 dark:bg-green-900/20' :
                                               status.color === 'red' ? 'bg-red-50 dark:bg-red-900/20' :
                                               status.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-900/20' :
                                               'bg-gray-50 dark:bg-gray-800'} shrink-0 transition-colors group-hover:scale-110 duration-300`}>
                                {getStatusIcon(order.status)}
                              </div>
                              <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">{order.saleNumber}</h3>
                                  <Select
                            disabled={updatingId === order.id}
                            value={order.deliveryStatus}
                            onValueChange={(value) => handleDeliveryStatusClick(order.id, value)}
                          >
                                    <SelectTrigger className="h-7 w-[140px] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-xs">
                                      <SelectValue placeholder="Estado Entrega" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="NOT_DELIVERED">No entregado</SelectItem>
                                      <SelectItem value="DELIVERED">Entregado</SelectItem>
                                    </SelectContent>
                                  </Select>

                                  <Select
                                    disabled={updatingId === order.id}
                                    value={order.status}
                                    onValueChange={(value) => {
                                      if (value === 'REJECTED') {
                                        handleRejectClick(order.id)
                                      } else {
                                        updateOrderStatus(order.id, value)
                                      }
                                    }}
                                  >
                                    <SelectTrigger className={`h-7 w-[130px] ${status.class} font-medium border-current/20 text-xs`}>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="PENDING">Pendiente</SelectItem>
                                      <SelectItem value="PROCESSING">Procesando</SelectItem>
                                      <SelectItem value="ACCEPTED">Aceptado</SelectItem>
                                      {order.status === 'PROPOSED' && (
                                        <SelectItem value="PROPOSED">Propuesta Enviada</SelectItem>
                                      )}
                                      <SelectItem value="REJECTED">Rechazado</SelectItem>
                                      <SelectItem value="COMPLETED">Completado</SelectItem>
                                      <SelectItem value="CANCELLED">Cancelado</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {order.isPaid ? (
                                    <Badge className="bg-emerald-500 text-white dark:bg-emerald-600 border-none">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Pagado
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800/50">
                                      <Clock className="h-3 w-3 mr-1" />
                                      Pendiente de Pago
                                    </Badge>
                                  )}
                                  {order.paymentMethod === 'WHATSAPP' && (
                                    <Badge variant="outline" className="bg-green-50/50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800/50">
                                      <MessageCircle className="h-3 w-3 mr-1" />
                                      WhatsApp
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-1 text-sm">
                                  <p className="font-medium text-gray-700 dark:text-gray-300">
                                    {order.customerName}
                                  </p>
                                  <span className="hidden sm:inline text-gray-300 dark:text-gray-700">•</span>
                                  <p className="text-muted-foreground truncate max-w-[200px]">
                                    {order.customerEmail || "Sin email"}
                                  </p>
                                </div>
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(order.createdAt)}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between md:justify-end gap-6">
                              <div className="text-right">
                                <p className="text-2xl font-black text-gray-900 dark:text-white">${formatUSD(order.totalUSD)}</p>
                                <p className="text-xs font-medium text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full inline-block mt-1">
                                  {items.length} producto{items.length !== 1 ? "s" : ""}
                                </p>
                              </div>
                              
                              <div className="flex gap-2">
                                <Button variant="outline" size="icon" className="rounded-full hover:bg-primary hover:text-primary-foreground transition-colors" onClick={() => setSelectedOrder(order)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon" className="rounded-full">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Ver detalles
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => sendWhatsAppReminder(order)}>
                                      <MessageCircle className="h-4 w-4 mr-2 text-green-500" />
                                      Enviar WhatsApp
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => generateInvoicePDF(order)}>
                                      <Download className="h-4 w-4 mr-2 text-blue-500" />
                                      Descargar factura
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="px-6 pb-6">
                          {/* Quick Actions for Pending & Accepted */}
                          {(order.status === 'PENDING' || order.status === 'ACCEPTED' || order.status === 'PROPOSED') && (
                            <div className={`p-4 border rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm mb-4 ${
                              order.status === 'PENDING' 
                                ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/50' 
                                : order.status === 'ACCEPTED'
                                  ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/50'
                                  : 'bg-purple-50/50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800/50'
                            }`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                order.status === 'PENDING' 
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                                  : order.status === 'ACCEPTED'
                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                              }`}>
                                {order.status === 'PENDING' ? <Clock className="h-5 w-5" /> : order.status === 'ACCEPTED' ? <CheckCircle className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
                              </div>
                              <div>
                                <span className={`text-sm font-semibold block ${
                                  order.status === 'PENDING' 
                                    ? 'text-blue-900 dark:text-blue-300' 
                                    : order.status === 'ACCEPTED'
                                      ? 'text-emerald-900 dark:text-emerald-300'
                                      : 'text-purple-900 dark:text-purple-300'
                                }`}>
                                  {order.status === 'PENDING' ? 'Nuevo pedido pendiente' : order.status === 'ACCEPTED' ? 'Pedido aceptado' : 'Propuesta enviada'}
                                </span>
                                <span className={`text-xs ${
                                  order.status === 'PENDING' 
                                    ? 'text-blue-700/70 dark:text-blue-400/70' 
                                    : order.status === 'ACCEPTED'
                                      ? 'text-emerald-700/70 dark:text-emerald-400/70'
                                      : 'text-purple-700/70 dark:text-purple-400/70'
                                }`}>
                                  {order.status === 'PENDING' ? 'Revisa los detalles antes de aceptar' : order.status === 'ACCEPTED' ? 'Esperando confirmación de pago' : 'Esperando respuesta del cliente'}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                              <Button 
                                size="sm" 
                                disabled={updatingId === order.id || order.status !== 'ACCEPTED'}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1 sm:flex-none h-10 px-4"
                                onClick={() => handlePaymentClick(order)}
                              >
                                {updatingId === order.id ? (
                                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                )}
                                Confirmar Pago
                              </Button>
                              
                              {order.status === 'PENDING' && (
                                <>
                                  <Button 
                                    size="sm" 
                                    disabled={updatingId === order.id}
                                    className={`${
                                      order.items.some(item => item.status === 'REJECTED') 
                                        ? 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800' 
                                        : 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800'
                                    } text-white flex-1 sm:flex-none h-10 px-4`}
                                    onClick={() => {
                                      const hasRejected = order.items.some(item => item.status === 'REJECTED');
                                      updateOrderStatus(order.id, hasRejected ? 'PROPOSED' : 'ACCEPTED');
                                    }}
                                  >
                                    {updatingId === order.id ? (
                                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    ) : (
                                      order.items.some(item => item.status === 'REJECTED') ? (
                                        <MessageCircle className="h-4 w-4 mr-2" />
                                      ) : (
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                      )
                                    )}
                                    {order.items.some(item => item.status === 'REJECTED') ? 'Enviar Propuesta' : 'Aceptar'}
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive" 
                                    disabled={updatingId === order.id}
                                    className="flex-1 sm:flex-none h-10 px-4"
                                    onClick={() => handleRejectClick(order.id)}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Rechazar
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Order Items Preview */}
                        <div className="mt-4 pt-4 border-t dark:border-gray-800">
                          <div className="flex flex-wrap gap-2">
                            {items.slice(0, 3).map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm">
                                <span className="truncate max-w-[200px] text-gray-800 dark:text-gray-200 font-medium">{item.name}</span>
                                <span className="text-muted-foreground">x{item.quantity}</span>
                              </div>
                            ))}
                            {items.length > 3 && (
                              <span className="px-3 py-1 text-sm text-muted-foreground bg-gray-50 dark:bg-gray-900/50 rounded-full border border-dashed border-gray-200 dark:border-gray-700">
                                +{items.length - 3} más
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Order Detail Link */}
                        <div className="mt-4 pt-4 border-t dark:border-gray-800 flex items-center justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            onClick={() => setSelectedOrder(order)}
                          >
                            Ver Historial y Detalles
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
        <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
          <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0">
            {selectedOrder && (
              <>
                <div className="p-6 border-b bg-muted/30 dark:bg-muted/10 shrink-0">
                  <DialogHeader className="flex flex-col pr-8">
                    <div className="flex items-center justify-between">
                      <DialogTitle className="text-2xl font-black">Orden {selectedOrder.saleNumber}</DialogTitle>
                      <Badge className={`${formatStatus(selectedOrder.status).class} text-sm px-3 py-1`}>
                        {formatStatus(selectedOrder.status).label}
                      </Badge>
                    </div>
                    <DialogDescription className="mt-1">
                      Gestiona los productos, revisa el historial y realiza acciones sobre el pedido.
                    </DialogDescription>
                  </DialogHeader>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Customer & Payment Info */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl border bg-card dark:border-gray-800">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                              <User className="h-3 w-3" />
                              Información del Cliente
                            </h4>
                            <p className="font-bold text-lg text-primary">{selectedOrder.customerName}</p>
                            <div className="space-y-1 mt-2">
                              {selectedOrder.customerEmail && (
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                  <Search className="h-3 w-3" /> {selectedOrder.customerEmail}
                                </p>
                              )}
                              {selectedOrder.customerPhone && (
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                  <MessageCircle className="h-3 w-3" /> {selectedOrder.customerPhone}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                              <Clock className="h-3 w-3" />
                              Detalles del Pedido
                            </h4>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Fecha:</span>
                                <span className="text-sm font-medium">{formatDate(selectedOrder.createdAt)}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Método:</span>
                                <Badge variant="outline" className="text-xs">{selectedOrder.paymentMethod}</Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Estado Entrega:</span>
                                <Badge variant="outline" className={`${formatDeliveryStatus(selectedOrder.deliveryStatus).class} text-xs border-current/20`}>
                                  {getDeliveryStatusIcon(selectedOrder.deliveryStatus)}
                                  <span className="ml-1">{formatDeliveryStatus(selectedOrder.deliveryStatus).label}</span>
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Delivery Address & Notes */}
                      {(selectedOrder.deliveryAddress || selectedOrder.notes) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedOrder.deliveryAddress && (
                            <div className="p-4 bg-blue-50/30 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                              <h4 className="font-bold text-xs uppercase tracking-widest text-blue-800 dark:text-blue-400 mb-2">Dirección de Entrega</h4>
                              <p className="text-sm text-blue-900 dark:text-blue-200/80">{selectedOrder.deliveryAddress}</p>
                            </div>
                          )}
                          {selectedOrder.notes && (
                            <div className="p-4 bg-amber-50/30 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30">
                              <h4 className="font-bold text-xs uppercase tracking-widest text-amber-800 dark:text-amber-400 mb-2">Notas del Cliente</h4>
                              <p className="text-sm italic text-amber-900 dark:text-amber-200/80">{selectedOrder.notes}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Products Table */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Package className="h-3 w-3" />
                            Resumen de Productos ({Array.isArray(selectedOrder.items) ? selectedOrder.items.length : 0})
                          </h4>
                          {selectedOrder.status === 'PENDING' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 text-xs border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                              onClick={() => acceptAllOrderItems(selectedOrder.id)}
                              disabled={updatingId === selectedOrder.id}
                            >
                              {updatingId === selectedOrder.id ? (
                                <div className="h-3 w-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin mr-1" />
                              ) : (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              )}
                              Aceptar Todo
                            </Button>
                          )}
                        </div>
                        <div className="border dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50 dark:bg-muted/20">
                              <tr>
                                <th className="px-4 py-3 text-left font-bold">Producto</th>
                                <th className="px-4 py-3 text-center font-bold">Cant.</th>
                                <th className="px-4 py-3 text-right font-bold">Precio</th>
                                <th className="px-4 py-3 text-right font-bold">Total</th>
                                <th className="px-4 py-3 text-center font-bold">Acción</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-800 bg-card">
                              {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                                selectedOrder.items.map((item, idx) => (
                                  <tr key={item.id || idx} className="hover:bg-muted/30 dark:hover:bg-muted/10 transition-colors">
                                    <td className="px-4 py-4">
                                      <p className="font-bold dark:text-gray-200">{item.name}</p>
                                      {item.status === 'REJECTED' && (
                                        <Badge variant="destructive" className="mt-1 h-5 text-[9px] px-1.5 uppercase font-black">Rechazado</Badge>
                                      )}
                                      {item.status === 'ACCEPTED' && (
                                        <Badge variant="outline" className="mt-1 h-5 text-[9px] px-1.5 uppercase font-black bg-green-50 text-green-700 border-green-200">Aceptado</Badge>
                                      )}
                                    </td>
                                    <td className="px-4 py-4 text-center dark:text-gray-300 font-medium">
                                      {selectedOrder.status === 'PENDING' ? (
                                        <div className="flex flex-col items-center gap-1">
                                          {editingQuantity?.itemId === item.id ? (
                                            <div className="flex items-center gap-1">
                                              <Input
                                                type="number"
                                                value={editingQuantity.quantity}
                                                onChange={(e) => setEditingQuantity({ ...editingQuantity, quantity: parseInt(e.target.value) || 0 })}
                                                className="w-16 h-8 text-center px-1"
                                                min={1}
                                                max={item.originalQuantity || item.quantity}
                                              />
                                              <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-8 w-8 text-green-600"
                                                onClick={() => updateOrderItemQuantity(selectedOrder.id, item.id, editingQuantity.quantity)}
                                                disabled={updatingItemId === item.id}
                                              >
                                                <CheckCircle className="h-4 w-4" />
                                              </Button>
                                              <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-8 w-8 text-red-600"
                                                onClick={() => setEditingQuantity(null)}
                                              >
                                                <XCircle className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-2">
                                              <span>{item.quantity}</span>
                                              <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6 text-muted-foreground hover:text-primary"
                                                onClick={() => setEditingQuantity({ itemId: item.id, quantity: item.quantity })}
                                              >
                                                <MoreHorizontal className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          )}
                                          {item.originalQuantity && item.originalQuantity !== item.quantity && (
                                            <span className="text-[10px] text-muted-foreground line-through">Orig: {item.originalQuantity}</span>
                                          )}
                                        </div>
                                      ) : (
                                        <>
                                          <span>{item.quantity}</span>
                                          {item.originalQuantity && item.originalQuantity !== item.quantity && (
                                            <span className="text-[10px] text-muted-foreground line-through block">Orig: {item.originalQuantity}</span>
                                          )}
                                        </>
                                      )}
                                    </td>
                                    <td className="px-4 py-4 text-right dark:text-gray-300 font-medium">{formatUSD(item.unitPrice)}</td>
                                    <td className="px-4 py-4 text-right font-bold dark:text-white">{formatUSD(item.total)}</td>
                                    <td className="px-4 py-4 text-center">
                                      {selectedOrder.status === 'PENDING' ? (
                                        <div className="flex items-center justify-center gap-1">
                                          <Button
                                            size="icon"
                                            variant="outline"
                                            className={`h-8 w-8 rounded-full transition-all ${item.status === 'ACCEPTED' ? 'bg-green-600 text-white border-green-600 scale-110' : 'text-muted-foreground hover:text-green-600 hover:border-green-600'}`}
                                            onClick={() => updateOrderItemStatus(selectedOrder.id, item.id, 'ACCEPTED')}
                                            disabled={updatingItemId === item.id}
                                          >
                                            {updatingItemId === item.id && item.status !== 'ACCEPTED' ? (
                                              <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                              <CheckCircle className="h-4 w-4" />
                                            )}
                                          </Button>
                                          <Button
                                            size="icon"
                                            variant="outline"
                                            className={`h-8 w-8 rounded-full transition-all ${item.status === 'REJECTED' ? 'bg-red-600 text-white border-red-600 scale-110' : 'text-muted-foreground hover:text-red-600 hover:border-red-600'}`}
                                            onClick={() => updateOrderItemStatus(selectedOrder.id, item.id, 'REJECTED')}
                                            disabled={updatingItemId === item.id}
                                          >
                                            {updatingItemId === item.id && item.status !== 'REJECTED' ? (
                                              <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                              <XCircle className="h-4 w-4" />
                                            )}
                                          </Button>
                                        </div>
                                      ) : (
                                        <span className="text-xs text-muted-foreground">-</span>
                                      )}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground italic">
                                    No hay productos registrados en esta orden
                                  </td>
                                </tr>
                              )}
                            </tbody>
                            <tfoot className="bg-muted/50 dark:bg-muted/20 font-black border-t dark:border-gray-800">
                              <tr>
                                <td colSpan={3} className="px-4 py-5 text-right text-sm tracking-widest text-muted-foreground">TOTAL DEL PEDIDO</td>
                                <td className="px-4 py-5 text-right text-2xl text-primary font-black">{formatUSD(selectedOrder.totalUSD)}</td>
                                <td></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Sidebar: Status & History */}
                    <div className="space-y-6">
                      {/* Payment Status Card */}
                      <div className="p-4 rounded-xl border bg-card dark:border-gray-800 space-y-4">
                        <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                          <TrendingUp className="h-3 w-3" />
                          Estado de Pago
                        </h4>
                        <div className="space-y-3">
                          {selectedOrder.isPaid ? (
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 rounded-lg">
                              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold mb-1">
                                <CheckCircle className="h-4 w-4" />
                                PAGADO
                              </div>
                              {selectedOrder.paidAmountUSD && (
                                <p className="text-sm font-black text-emerald-800 dark:text-emerald-300">
                                  Recibido: ${formatUSD(selectedOrder.paidAmountUSD)}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/50 rounded-lg">
                                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold">
                                  <Clock className="h-4 w-4" />
                                  PENDIENTE
                                </div>
                              </div>
                              <Button 
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10"
                                onClick={() => handlePaymentClick(selectedOrder)}
                                disabled={selectedOrder.status !== 'ACCEPTED'}
                              >
                                {selectedOrder.status !== 'ACCEPTED' ? 'Debe aceptar la orden' : 'Confirmar Pago'}
                              </Button>
                              {selectedOrder.status !== 'ACCEPTED' && (
                                <p className="text-[10px] text-center text-muted-foreground italic">
                                  El pago solo se puede confirmar cuando la orden ha sido aceptada por el administrador.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* History Section */}
                      <div className="p-4 rounded-xl border bg-card dark:border-gray-800">
                        <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          Historial
                        </h4>
                        {selectedOrder.auditLogs && selectedOrder.auditLogs.length > 0 ? (
                          <div className="space-y-6 border-l-2 border-muted dark:border-gray-800 ml-2 pl-4">
                            {selectedOrder.auditLogs.map((log) => (
                              <div key={log.id} className="relative">
                                <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-background border-2 border-primary shadow-sm" />
                                <p className="text-xs font-bold dark:text-gray-200 leading-tight">
                                  {log.action === 'STATUS_CHANGE' 
                                    ? `Estado: ${formatStatus(log.newStatus || '').label}`
                                    : log.action === 'DELIVERY_STATUS_CHANGE'
                                      ? `Entrega: ${formatDeliveryStatus(log.newDeliveryStatus || '').label}`
                                      : log.action === 'CREATED' 
                                        ? 'Pedido recibido' 
                                        : log.action}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  {formatDate(log.createdAt)} {log.user?.name ? `• ${log.user.name}` : ''}
                                </p>
                                {log.reason && (
                                  <div className="mt-1.5 p-1.5 bg-destructive/5 dark:bg-red-900/10 rounded text-[10px] text-destructive dark:text-red-400 border border-destructive/10">
                                    <strong>Motivo:</strong> {log.reason}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic text-center py-4">Sin registros de actividad</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t bg-muted/30 dark:bg-muted/10 shrink-0">
                  <div className="flex flex-col sm:flex-row gap-3">
                    {selectedOrder.status === 'PENDING' && (
                      <div className="flex flex-1 gap-3">
                        <Button 
                          className={`flex-1 h-12 font-bold shadow-lg transition-all active:scale-95 ${
                            selectedOrder.items.some(item => item.status === 'REJECTED') 
                              ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                          onClick={() => {
                            const hasRejected = selectedOrder.items.some(item => item.status === 'REJECTED');
                            updateOrderStatus(selectedOrder.id, hasRejected ? 'PROPOSED' : 'ACCEPTED');
                          }}
                          disabled={updatingId === selectedOrder.id}
                        >
                          {updatingId === selectedOrder.id ? (
                            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          ) : (
                            selectedOrder.items.some(item => item.status === 'REJECTED') ? (
                              <MessageCircle className="h-5 w-5 mr-2" />
                            ) : (
                              <CheckCircle className="h-5 w-5 mr-2" />
                            )
                          )}
                          {selectedOrder.items.some(item => item.status === 'REJECTED') ? 'ENVIAR PROPUESTA' : 'ACEPTAR PEDIDO'}
                        </Button>
                        <Button 
                          variant="destructive" 
                          className="flex-1 h-12 font-bold shadow-lg transition-all active:scale-95" 
                          onClick={() => handleRejectClick(selectedOrder.id)}
                          disabled={updatingId === selectedOrder.id}
                        >
                          <XCircle className="h-5 w-5 mr-2" />
                          RECHAZAR PEDIDO
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2 shrink-0">
                      <Button 
                        variant="outline"
                        className="h-12 border-green-600 text-green-600 hover:bg-green-600 hover:text-white font-bold px-6" 
                        onClick={() => sendWhatsAppReminder(selectedOrder)}
                      >
                        <MessageCircle className="h-5 w-5 sm:mr-2" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-12 font-bold px-6" 
                        onClick={() => generateInvoicePDF(selectedOrder)}
                      >
                        <Download className="h-5 w-5 sm:mr-2" />
                        <span className="hidden sm:inline">Factura PDF</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="h-12 font-bold text-muted-foreground" 
                        onClick={() => setSelectedOrder(null)}
                      >
                        Cerrar
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Payment Confirmation Modal */}
        <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-primary">
                <CheckCircle className="h-5 w-5" />
                Confirmar Pago del Pedido
              </DialogTitle>
              <DialogDescription>
                Ingresa el monto recibido y opcionalmente una nota. El pedido se marcará como <strong>PAGADO</strong> y <strong>COMPLETADO</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Monto Recibido (USD)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="font-bold text-lg"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notas de Pago (Opcional)</label>
                <Textarea
                  placeholder="Ej: Pago recibido vía Zelle, transferencia Banesco, efectivo..."
                  value={paymentReason}
                  onChange={(e) => setPaymentReason(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setPaymentModalOpen(false)}>
                Cancelar
              </Button>
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground" 
                onClick={confirmPayment}
                disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || updatingId !== null}
              >
                {updatingId !== null ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Confirmar y Completar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rejection Reason Modal */}
        <Dialog open={rejectionModalOpen} onOpenChange={setRejectionModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                Rechazar Pedido
              </DialogTitle>
              <DialogDescription>
                Por favor, indica el motivo del rechazo. Este mensaje será visible en el historial del pedido.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Textarea
                placeholder="Ej: Producto agotado, problemas con el pago, zona de entrega no disponible..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px] resize-none"
                autoFocus
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setRejectionModalOpen(false)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmRejection}
                disabled={!rejectionReason.trim() || updatingId !== null}
              >
                {updatingId !== null ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Confirmar Rechazo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delivery Status Modal */}
        <Dialog open={deliveryModalOpen} onOpenChange={setDeliveryModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-primary">
                <Truck className="h-5 w-5" />
                Actualizar Estado de Entrega
              </DialogTitle>
              <DialogDescription>
                Cambiar el estado de entrega a: <strong>{formatDeliveryStatus(newDeliveryStatus).label}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nota u Observación (Opcional)</label>
                <Textarea
                  placeholder="Ej: Entregado al cliente, En camino con el repartidor..."
                  value={deliveryReason}
                  onChange={(e) => setDeliveryReason(e.target.value)}
                  className="min-h-[100px] resize-none"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setDeliveryModalOpen(false)}>
                Cancelar
              </Button>
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground" 
                onClick={confirmDeliveryStatus}
                disabled={updatingId !== null}
              >
                {updatingId !== null ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Confirmar Cambio
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
