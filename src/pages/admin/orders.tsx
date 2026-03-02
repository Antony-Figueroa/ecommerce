import React, { useState, useEffect } from "react"
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
  ShoppingBag,
  CreditCard,
  Calendar,
  AlertCircle,
  PlusCircle,
} from "lucide-react"
import { AdminPageHeader } from "@/components/admin/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
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
  const [sortBy, setSortBy] = useState<"saleNumber" | "customerName" | "totalUSD" | "createdAt">("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false)
  const [rejectionOrderId, setRejectionOrderId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null)
  const [editingQuantity, setEditingQuantity] = useState<{ itemId: string; quantity: number } | null>(null)

  // Acceptance & Financing states
  const [acceptanceModalOpen, setAcceptanceModalOpen] = useState(false)
  const [financingModalMode, setFinancingModalMode] = useState<"acceptance" | "installment-plan">("acceptance")
  const [acceptanceOrder, setAcceptanceOrder] = useState<Order | null>(null)
  const [initialPaymentUSD, setInitialPaymentUSD] = useState<string>("0")
  const [installmentCount, setInstallmentCount] = useState<number>(0)
  const [customInstallments, setCustomInstallments] = useState<any[]>([])
  const [isFinancingEnabled, setIsFinancingEnabled] = useState(false)
  const [customerOrders, setCustomerOrders] = useState<any[]>([])
  const [loadingSolvency, setLoadingSolvency] = useState(false)

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

  // Installment plan states
  const [paymentStatus, setPaymentStatus] = useState<any>(null)
  const [, setLoadingPaymentStatus] = useState(false)
  const [installmentPlanCount, setInstallmentPlanCount] = useState<number>(2)
  const [newInstallments, setNewInstallments] = useState<any[]>([
    { amountUSD: 0, dueDate: new Date().toISOString().split('T')[0] },
    { amountUSD: 0, dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
  ])

  // Proof verification states
  const [proofModalOpen, setProofModalOpen] = useState(false)
  const [selectedProof, setSelectedProof] = useState<any>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [isProcessingProof, setIsProcessingProof] = useState(false)

  const [confirmConfig, setConfirmConfig] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: "default" | "destructive";
    confirmText?: string;
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  })

  const confirmAction = (config: Omit<typeof confirmConfig, "open">) => {
    setConfirmConfig({ ...config, open: true })
  }

  const hasAcceptanceChanges = () => {
    return initialPaymentUSD !== "0" || installmentCount !== 0 || customInstallments.length > 0 || isFinancingEnabled
  }

  const hasPaymentChanges = () => {
    return paymentAmount !== "" || paymentReason !== ""
  }

  const hasDeliveryChanges = () => {
    return deliveryReason !== ""
  }

  const hasRejectionChanges = () => {
    return rejectionReason !== ""
  }

  const handleCloseAcceptanceModal = () => {
    if (hasAcceptanceChanges()) {
      confirmAction({
        title: "¿Salir sin guardar?",
        description: "Tienes cambios sin guardar en la configuración del pedido. ¿Estás seguro de que deseas salir?",
        confirmText: "Salir",
        variant: "destructive",
        onConfirm: () => {
          setAcceptanceModalOpen(false)
          setInitialPaymentUSD("0")
          setInstallmentCount(0)
          setCustomInstallments([])
          setIsFinancingEnabled(false)
        }
      })
    } else {
      setAcceptanceModalOpen(false)
    }
  }

  const handleClosePaymentModal = () => {
    if (hasPaymentChanges()) {
      confirmAction({
        title: "¿Salir sin guardar?",
        description: "Tienes cambios sin guardar en el registro de pago. ¿Estás seguro de que deseas salir?",
        confirmText: "Salir",
        variant: "destructive",
        onConfirm: () => {
          setPaymentModalOpen(false)
          setPaymentAmount("")
          setPaymentReason("")
        }
      })
    } else {
      setPaymentModalOpen(false)
    }
  }

  const handleCloseDeliveryModal = () => {
    if (hasDeliveryChanges()) {
      confirmAction({
        title: "¿Salir sin guardar?",
        description: "Tienes cambios sin guardar en el estado de entrega. ¿Estás seguro de que deseas salir?",
        confirmText: "Salir",
        variant: "destructive",
        onConfirm: () => {
          setDeliveryModalOpen(false)
          setDeliveryReason("")
        }
      })
    } else {
      setDeliveryModalOpen(false)
    }
  }

  const handleCloseRejectionModal = () => {
    if (hasRejectionChanges()) {
      confirmAction({
        title: "¿Salir sin guardar?",
        description: "Tienes cambios sin guardar en el motivo de rechazo. ¿Estás seguro de que deseas salir?",
        confirmText: "Salir",
        variant: "destructive",
        onConfirm: () => {
          setRejectionModalOpen(false)
          setRejectionReason("")
        }
      })
    } else {
      setRejectionModalOpen(false)
    }
  }

  useEffect(() => {
    if (selectedOrder) {
      refreshPaymentStatus(selectedOrder.id)
    } else {
      setPaymentStatus(null)
    }
  }, [selectedOrder])

  useEffect(() => {
    fetchOrders()
    // Polling cada 30 segundos para nuevos pedidos (tiempo real simulado)
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedOrder) {
      const updatedOrder = orders.find(o => o.id === selectedOrder.id)
      if (updatedOrder && JSON.stringify(updatedOrder) !== JSON.stringify(selectedOrder)) {
        setSelectedOrder(updatedOrder)
      }
    }
  }, [orders])

  useEffect(() => {
    if (!acceptanceModalOpen || financingModalMode !== "installment-plan") return
    const remaining = paymentStatus?.remainingUSD || 0
    const nextCount = Math.max(1, installmentPlanCount || 1)
    setNewInstallments(buildInstallments(nextCount, remaining))
  }, [acceptanceModalOpen, financingModalMode, installmentPlanCount, paymentStatus?.remainingUSD])

  const fetchOrders = async () => {
    try {
      const data = await api.getSales()
      console.log("Fetched orders:", data.sales) // Depuración
      setOrders(data.sales || [])
      
      // If there's a selected order, refresh its payment status
      if (selectedOrder) {
        refreshPaymentStatus(selectedOrder.id)
      }
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

  const refreshPaymentStatus = async (saleId: string) => {
    setLoadingPaymentStatus(true)
    try {
      const status = await api.getPaymentStatus(saleId)
      setPaymentStatus(status)
    } catch (error) {
      console.error("Error fetching payment status:", error)
    } finally {
      setLoadingPaymentStatus(false)
    }
  }

  const exportOrdersToCSV = () => {
    const headers = ["ID", "Fecha", "Cliente", "Email", "Teléfono", "Total USD", "Estado", "Método Pago", "Estado Entrega", "Pagado"]
    const rows = filteredOrders.map(order => [
      order.id.slice(0, 8),
      new Date(order.createdAt).toLocaleDateString("es-VE"),
      order.customerName || "Cliente",
      order.customerEmail || "",
      order.customerPhone || "",
      order.totalUSD,
      order.status,
      order.paymentMethod,
      order.deliveryStatus,
      order.isPaid ? "Sí" : "No"
    ])
    
    const csvContent = [headers, ...rows.map(row => row.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `pedidos_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    
    toast({ title: "Exportación Exitosa", description: "Los pedidos se han exportado correctamente." })
  }

  const handleCreateInstallmentPlan = async () => {
    if (!selectedOrder) return

    const totalInstallments = newInstallments.reduce((sum, inst) => sum + parseFloat(inst.amountUSD || 0), 0)
    const remainingToPay = selectedOrder.totalUSD - (paymentStatus?.paidAmountUSD || 0)

    if (Math.abs(totalInstallments - remainingToPay) > 0.01) {
      toast({
        title: "Monto inválido",
        description: `La suma de las cuotas (${formatUSD(totalInstallments)}) debe ser igual al saldo pendiente (${formatUSD(remainingToPay)})`,
        variant: "destructive"
      })
      return
    }

    // Validar que las fechas sean quincenales (opcional, pero recomendado según el usuario)
    // El usuario dijo "ej: 2 o 3 quincenas", así que validamos 14 días entre ellas
    for (let i = 1; i < newInstallments.length; i++) {
      const prevDate = new Date(newInstallments[i - 1].dueDate);
      const currDate = new Date(newInstallments[i].dueDate);
      const diffTime = currDate.getTime() - prevDate.getTime();
      const diffDays = diffTime / (1000 * 3600 * 24);
      
      if (Math.abs(diffDays - 14) > 0.5) { // Permitir pequeño margen por zona horaria
        toast({
          title: "Intervalo inválido",
          description: `Las cuotas ${i} y ${i+1} deben tener 14 días de diferencia (quincena).`,
          variant: "destructive"
        })
        return
      }
    }

    const dates = newInstallments.map(i => i.dueDate);
    const uniqueDates = new Set(dates);
    if (uniqueDates.size !== dates.length) {
      toast({
        title: "Fechas duplicadas",
        description: "Cada cuota debe tener una fecha de vencimiento única.",
        variant: "destructive"
      })
      return
    }

    confirmAction({
      title: "¿Crear plan de cuotas?",
      description: `¿Estás seguro de que deseas crear un plan de ${newInstallments.length} cuotas para este pedido?`,
      confirmText: "Crear Plan",
      onConfirm: async () => {
        setUpdatingId(selectedOrder.id)
        try {
          await api.createInstallmentPlan(selectedOrder.id, newInstallments)
          toast({
            title: "Plan creado",
            description: "El plan de cuotas ha sido creado exitosamente",
          })
          setAcceptanceModalOpen(false)
          refreshPaymentStatus(selectedOrder.id)
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.message || "No se pudo crear el plan de cuotas",
            variant: "destructive"
          })
        } finally {
          setUpdatingId(null)
        }
      }
    })
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

  const handleAcceptClick = async (order: Order) => {
    setAcceptanceOrder(order)
    setInitialPaymentUSD("0")
    setInstallmentCount(0)
    setIsFinancingEnabled(false)
    setCustomInstallments([])
    setFinancingModalMode("acceptance")
    setAcceptanceModalOpen(true)

    // Fetch customer history for solvency validation
    if (order.customerEmail) {
      setLoadingSolvency(true)
      try {
        const response = await api.getCustomers({ search: order.customerEmail })
        const customer = response.customers.find((c: any) => c.email === order.customerEmail)
        if (customer) {
          const history = await api.getCustomerOrders(customer.id)
          setCustomerOrders(history.orders || [])
        }
      } catch (error) {
        console.error("Error fetching solvency history:", error)
      } finally {
        setLoadingSolvency(false)
      }
    }
  }

  const confirmAcceptance = async () => {
    if (!acceptanceOrder) return

    const initial = parseFloat(initialPaymentUSD) || 0
    const financing = (isFinancingEnabled || initial > 0) ? {
      initialPaymentUSD: initial,
      installmentPlan: isFinancingEnabled ? customInstallments.map(inst => ({
        amountUSD: parseFloat(inst.amountUSD),
        dueDate: new Date(inst.dueDate)
      })) : []
    } : undefined

    confirmAction({
      title: "¿Aceptar pedido?",
      description: `¿Estás seguro de que deseas aceptar el pedido de ${acceptanceOrder.customerName}? ${isFinancingEnabled ? "Se creará un plan de financiamiento." : ""}`,
      confirmText: "Aceptar Pedido",
      onConfirm: async () => {
        setUpdatingId(acceptanceOrder.id)
        try {
          await api.updateSaleStatus(acceptanceOrder.id, 'ACCEPTED', undefined, financing)
          toast({
            title: "Pedido Aceptado",
            description: isFinancingEnabled 
              ? `El pedido ha sido aceptado con un plan de ${customInstallments.length} cuotas.`
              : "El pedido ha sido aceptado correctamente.",
          })
          setAcceptanceModalOpen(false)
          await fetchOrders()
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.message || "No se pudo aceptar el pedido",
            variant: "destructive"
          })
        } finally {
          setUpdatingId(null)
        }
      }
    })
  }

  const buildInstallments = (count: number, total: number) => {
    const safeCount = Math.max(1, Math.floor(count))
    const safeTotal = Math.max(0, total)
    const amountPerInstallment = parseFloat((safeTotal / safeCount).toFixed(2))
    const newInst = []
    for (let i = 1; i <= safeCount; i++) {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + (i * 14))
      const amount = i === safeCount
        ? safeTotal - (amountPerInstallment * (safeCount - 1))
        : amountPerInstallment
      newInst.push({
        amountUSD: amount.toFixed(2),
        dueDate: dueDate.toISOString().split('T')[0]
      })
    }
    return newInst
  }

  const calculateAutomaticInstallments = (count: number, initial: number) => {
    if (!acceptanceOrder) return
    const remaining = acceptanceOrder.totalUSD - initial
    if (remaining <= 0) {
      setCustomInstallments([])
      return
    }
    setCustomInstallments(buildInstallments(count, remaining))
  }

  const updateOrderStatus = async (orderId: string, status: string, reason?: string) => {
    const statusLabel = formatStatus(status).label

    confirmAction({
      title: `¿Cambiar estado a ${statusLabel}?`,
      description: `¿Estás seguro de que deseas marcar este pedido como "${statusLabel}"?`,
      confirmText: "Confirmar Cambio",
      variant: (status === 'REJECTED' || status === 'CANCELLED') ? "destructive" : "default",
      onConfirm: async () => {
        setUpdatingId(orderId)
        try {
          await api.updateSaleStatus(orderId, status, reason)
          toast({
            title: "Estado actualizado",
            description: `La orden ha sido marcada como ${statusLabel}`,
          })
          await fetchOrders()
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
    })
  }

  const updateOrderItemStatus = async (orderId: string, itemId: string, status: string) => {
    const label = status === 'ACCEPTED' ? 'Aceptado' : 'Rechazado'

    confirmAction({
      title: `¿Marcar item como ${label}?`,
      description: `¿Estás seguro de que deseas cambiar el estado de este producto a ${label}?`,
      confirmText: "Confirmar",
      variant: status === 'REJECTED' ? "destructive" : "default",
      onConfirm: async () => {
        setUpdatingItemId(itemId)
        try {
          await api.updateSaleItemStatus(orderId, itemId, status)
          toast({
            title: "Item actualizado",
            description: `El producto ha sido marcado como ${label}`,
          })
          
          // Refresh order data
          await fetchOrders()
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
    })
  }

  const updateOrderItemQuantity = async (orderId: string, itemId: string, quantity: number) => {
    confirmAction({
      title: "¿Actualizar cantidad?",
      description: `¿Deseas cambiar la cantidad de este producto a ${quantity}?`,
      confirmText: "Actualizar",
      onConfirm: async () => {
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
    })
  }

  const acceptAllOrderItems = async (orderId: string) => {
    confirmAction({
      title: "¿Aceptar todos los productos?",
      description: "¿Estás seguro de que deseas marcar todos los productos de este pedido como aceptados?",
      confirmText: "Aceptar Todos",
      onConfirm: async () => {
        setUpdatingId(orderId)
        try {
          await api.acceptAllSaleItems(orderId)
          toast({
            title: "Items aceptados",
            description: "Todos los productos han sido marcados como aceptados",
          })
          
          // Refresh order data
          await fetchOrders()
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
    })
  }

  const updateDeliveryStatus = async (orderId: string, deliveryStatus: string, reason?: string) => {
    const label = formatDeliveryStatus(deliveryStatus).label
    
    confirmAction({
      title: "¿Actualizar estado de entrega?",
      description: `¿Estás seguro de que deseas marcar la entrega como "${label}"?`,
      confirmText: "Actualizar Entrega",
      onConfirm: async () => {
        setUpdatingId(orderId)
        try {
          await api.updateSaleDeliveryStatus(orderId, deliveryStatus, reason)
          toast({
            title: "Entrega actualizada",
            description: `El estado de entrega ha sido marcado como ${label}`,
          })
          setDeliveryModalOpen(false)
          setDeliveryReason("")
          await fetchOrders()
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
    })
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

  const handleVerifyProof = async (proof: any) => {
    setSelectedProof(proof)
    setAdminNotes("")
    setProofModalOpen(true)
  }

  const confirmProofVerification = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedProof) return

    setIsProcessingProof(true)
    try {
      await api.verifyPaymentProof(selectedProof.id, { status, notes: adminNotes })
      
      toast({
        title: status === 'APPROVED' ? "Comprobante Aprobado" : "Comprobante Rechazado",
        description: status === 'APPROVED' 
          ? "El pago ha sido registrado y la cuota actualizada." 
          : "El comprobante ha sido rechazado.",
      })

      setProofModalOpen(false)
      setSelectedProof(null)
      
      if (selectedOrder) {
        refreshPaymentStatus(selectedOrder.id)
        fetchOrders()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo procesar el comprobante",
        variant: "destructive"
      })
    } finally {
      setIsProcessingProof(false)
    }
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
      // Use the new registerPayment method from api.ts
      await api.registerPayment(paymentOrderId, {
        amountUSD: amount,
        paymentMethod: 'CASH', // Default to cash for now, could be improved
        notes: paymentReason
      })
      
      toast({
        title: "Pago registrado",
        description: `Se ha registrado el pago de ${formatUSD(amount)}`,
      })
      setPaymentModalOpen(false)
      await fetchOrders()
      if (selectedOrder?.id === paymentOrderId) {
        refreshPaymentStatus(paymentOrderId)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo registrar el pago",
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
      // Usar api.whatsapp.com/send para intentar abrir directamente el chat
      const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`
      window.open(url, "_blank")
    } else {
      toast({
        title: "Error",
        description: "No hay número de teléfono válido para este cliente",
        variant: "destructive"
      })
    }
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
  }).sort((a, b) => {
    let comparison = 0
    if (sortBy === "saleNumber") comparison = a.saleNumber.localeCompare(b.saleNumber)
    else if (sortBy === "customerName") comparison = (a.customerName || "").localeCompare(b.customerName || "")
    else if (sortBy === "totalUSD") comparison = (a.totalUSD || 0) - (b.totalUSD || 0)
    else if (sortBy === "createdAt") comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    return sortOrder === "asc" ? comparison : -comparison
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
  const initialPaymentValue = parseFloat(initialPaymentUSD) || 0
  const financedTotalValue = customInstallments.reduce((s, i) => s + (parseFloat(i.amountUSD) || 0), 0)
  const acceptanceOrderTotal = acceptanceOrder?.totalUSD || 0
  const totalCombinedValue = initialPaymentValue + (isFinancingEnabled ? financedTotalValue : 0)
  const exceedsOrderTotal = totalCombinedValue - acceptanceOrderTotal > 0.01
  const planTotalValue = newInstallments.reduce((sum, inst) => sum + parseFloat(inst.amountUSD || 0), 0)
  const planRemainingValue = paymentStatus?.remainingUSD || 0
  const planExceedsRemaining = planTotalValue - planRemainingValue > 0.01

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/4"></div>
        <div className="h-64 bg-muted rounded"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6" role="main" aria-label="Gestión de Ventas">
      <AdminPageHeader 
        title="Gestión de Ventas"
        subtitle="Supervisa y procesa los pedidos de tus clientes en tiempo real."
        icon={ShoppingBag}
      />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex flex-col gap-1 md:hidden">
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-primary" aria-hidden="true" />
            Gestión de Ventas
          </h1>
          <p className="text-muted-foreground font-medium">Supervisa y procesa los pedidos de tus clientes en tiempo real.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end mr-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Última actualización</span>
            <span className="text-xs font-bold text-primary flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              En vivo
            </span>
          </div>
          <Button 
            variant="outline" 
            className="rounded-xl border-2 hover:bg-primary/5 transition-all font-bold gap-2"
            onClick={fetchOrders}
            disabled={loading}
            aria-label="Refrescar lista de pedidos"
          >
            <Clock className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>
          <Button 
            variant="outline" 
            className="rounded-xl border-2 hover:bg-primary/5 transition-all font-bold gap-2"
            onClick={exportOrdersToCSV}
            aria-label="Exportar pedidos"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" aria-hidden="true" />
            <Input
              placeholder="Buscar por # pedido, cliente, email o teléfono..."
              className="pl-11 h-12 bg-white dark:bg-card border-2 border-border/40 focus:border-primary/50 rounded-2xl transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Buscar pedidos"
            />
          </div>
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] h-10 bg-white dark:bg-card border-2 border-border/40 rounded-xl font-bold text-xs uppercase tracking-wider">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-bold text-xs">
                  <span className="flex items-center justify-between gap-3">
                    Todos
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{statusCounts.all}</span>
                  </span>
                </SelectItem>
                <SelectItem value="PENDING" className="font-bold text-xs">
                  <span className="flex items-center justify-between gap-3">
                    Pendientes
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{statusCounts.PENDING}</span>
                  </span>
                </SelectItem>
                <SelectItem value="ACCEPTED" className="font-bold text-xs">
                  <span className="flex items-center justify-between gap-3">
                    Aceptados
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{statusCounts.ACCEPTED}</span>
                  </span>
                </SelectItem>
                <SelectItem value="COMPLETED" className="font-bold text-xs">
                  <span className="flex items-center justify-between gap-3">
                    Completados
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{statusCounts.COMPLETED}</span>
                  </span>
                </SelectItem>
                <SelectItem value="REJECTED" className="font-bold text-xs">
                  <span className="flex items-center justify-between gap-3">
                    Rechazados
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{statusCounts.REJECTED}</span>
                  </span>
                </SelectItem>
                <SelectItem value="CANCELLED" className="font-bold text-xs">
                  <span className="flex items-center justify-between gap-3">
                    Cancelados
                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{statusCounts.CANCELLED}</span>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => { setSortBy(v as any); setSortOrder(sortOrder === "asc" ? "desc" : "asc") }}>
              <SelectTrigger className="w-[150px] h-10 bg-white dark:bg-card border-2 border-border/40 rounded-xl font-bold text-xs uppercase tracking-wider">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt" className="font-bold text-xs">
                  Fecha {sortBy === "createdAt" && (sortOrder === "desc" ? "↓" : "↑")}
                </SelectItem>
                <SelectItem value="saleNumber" className="font-bold text-xs">
                  # Pedido {sortBy === "saleNumber" && (sortOrder === "desc" ? "↓" : "↑")}
                </SelectItem>
                <SelectItem value="customerName" className="font-bold text-xs">
                  Cliente {sortBy === "customerName" && (sortOrder === "desc" ? "↓" : "↑")}
                </SelectItem>
                <SelectItem value="totalUSD" className="font-bold text-xs">
                  Total {sortBy === "totalUSD" && (sortOrder === "desc" ? "↓" : "↑")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 mt-6" role="list" aria-label="Lista de pedidos">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => {
                  const status = formatStatus(order.status)
                  const items = Array.isArray(order.items) ? order.items : []
                  
                  return (
                    <Card 
                      key={order.id} 
                      className="group hover:shadow-md transition-all duration-300 border border-border/60 overflow-hidden rounded-2xl"
                      role="listitem"
                      aria-labelledby={`order-heading-${order.id}`}
                    >
                      <CardContent className="p-0">
                        <div className="p-6">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                            <div className="flex items-start gap-4">
                              <div 
                                className={`p-3 rounded-2xl ${status.color === 'yellow' ? 'bg-yellow-50 dark:bg-yellow-900/20' : 
                                               status.color === 'blue' ? 'bg-blue-50 dark:bg-blue-900/20' :
                                               status.color === 'green' ? 'bg-green-50 dark:bg-green-900/20' :
                                               status.color === 'red' ? 'bg-red-50 dark:bg-red-900/20' :
                                               status.color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-900/20' :
                                               'bg-gray-50 dark:bg-gray-800'} shrink-0 transition-colors group-hover:scale-110 duration-300`}
                                aria-hidden="true"
                              >
                                {getStatusIcon(order.status)}
                              </div>
                              <div className="min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 id={`order-heading-${order.id}`} className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
                                    Pedido {order.saleNumber}
                                  </h3>
                                  <Select
                                    disabled={updatingId === order.id}
                                    value={order.deliveryStatus}
                                    onValueChange={(value) => handleDeliveryStatusClick(order.id, value)}
                                  >
                                    <SelectTrigger 
                                      className="h-7 w-[140px] bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-xs"
                                      aria-label={`Estado de entrega para pedido ${order.saleNumber}`}
                                    >
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
                                    <SelectTrigger 
                                      className={`h-7 w-[130px] ${status.class} font-medium border-current/20 text-xs`}
                                      aria-label={`Estado de orden para pedido ${order.saleNumber}`}
                                    >
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
                                    <Badge className="bg-emerald-500 text-white dark:bg-emerald-600 border-none" aria-label="Pagado">
                                      <CheckCircle className="h-3 w-3 mr-1" aria-hidden="true" />
                                      Pagado
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800/50" aria-label="Pendiente de pago">
                                      <Clock className="h-3 w-3 mr-1" aria-hidden="true" />
                                      Pendiente de Pago
                                    </Badge>
                                  )}
                                  {order.paymentMethod === 'WHATSAPP' && (
                                    <Badge variant="outline" className="bg-green-50/50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800/50" aria-label="Método de pago WhatsApp">
                                      <MessageCircle className="h-3 w-3 mr-1" aria-hidden="true" />
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
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="rounded-full hover:bg-primary hover:text-primary-foreground transition-colors" 
                                        onClick={() => setSelectedOrder(order)}
                                        aria-label={`Ver detalles del pedido ${order.saleNumber}`}
                                      >
                                        <Eye className="h-4 w-4" aria-hidden="true" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Ver detalles de la orden</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="icon" className="rounded-full" aria-label={`Más acciones para pedido ${order.saleNumber}`}>
                                      <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                                      <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
                                      Ver detalles
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => sendWhatsAppReminder(order)}>
                                      <MessageCircle className="h-4 w-4 mr-2 text-green-500" aria-hidden="true" />
                                      Enviar WhatsApp
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => generateInvoicePDF(order)}>
                                      <Download className="h-4 w-4 mr-2 text-blue-500" aria-hidden="true" />
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
                            <div 
                              className={`p-4 border rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm mb-4 ${
                                order.status === 'PENDING' 
                                  ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/50' 
                                  : order.status === 'ACCEPTED'
                                    ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/50'
                                    : 'bg-purple-50/50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800/50'
                              }`}
                              role="region"
                              aria-label={`Acciones rápidas para pedido ${order.saleNumber}`}
                            >
                            <div className="flex items-center gap-3">
                              <div 
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  order.status === 'PENDING' 
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                                    : order.status === 'ACCEPTED'
                                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                                }`}
                                aria-hidden="true"
                              >
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
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      disabled={updatingId === order.id || order.status !== 'ACCEPTED'}
                                      className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1 sm:flex-none h-10 px-4"
                                      onClick={() => handlePaymentClick(order)}
                                      aria-label={`Confirmar pago para pedido ${order.saleNumber}`}
                                    >
                                      {updatingId === order.id ? (
                                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin sm:mr-2" aria-hidden="true" />
                                      ) : (
                                        <CheckCircle className="h-4 w-4 sm:mr-2" aria-hidden="true" />
                                      )}
                                      <span className="hidden sm:inline">Confirmar Pago</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Confirmar Pago</p>
                                  </TooltipContent>
                                </Tooltip>

                                {order.status === 'PENDING' && (
                                  <>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
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
                                            if (hasRejected) {
                                              updateOrderStatus(order.id, 'PROPOSED');
                                            } else {
                                              handleAcceptClick(order);
                                            }
                                          }}
                                          aria-label={order.items.some(item => item.status === 'REJECTED') ? `Enviar propuesta para pedido ${order.saleNumber}` : `Aceptar pedido ${order.saleNumber}`}
                                        >
                                          {updatingId === order.id ? (
                                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin sm:mr-2" aria-hidden="true" />
                                          ) : (
                                            order.items.some(item => item.status === 'REJECTED') ? (
                                              <MessageCircle className="h-4 w-4 sm:mr-2" aria-hidden="true" />
                                            ) : (
                                              <CheckCircle className="h-4 w-4 sm:mr-2" aria-hidden="true" />
                                            )
                                          )}
                                          <span className="hidden sm:inline">
                                            {order.items.some(item => item.status === 'REJECTED') ? 'Enviar Propuesta' : 'Aceptar'}
                                          </span>
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{order.items.some(item => item.status === 'REJECTED') ? 'Enviar Propuesta' : 'Aceptar'}</p>
                                      </TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          size="sm" 
                                          variant="destructive" 
                                          disabled={updatingId === order.id}
                                          className="flex-1 sm:flex-none h-10 px-4"
                                          onClick={() => handleRejectClick(order.id)}
                                          aria-label={`Rechazar pedido ${order.saleNumber}`}
                                        >
                                          <XCircle className="h-4 w-4 sm:mr-2" aria-hidden="true" />
                                          <span className="hidden sm:inline">Rechazar</span>
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Rechazar</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </>
                                )}
                              </TooltipProvider>
                            </div>
                          </div>
                        )}
                      </div>

                        {/* Order Items Preview */}
                        <div className="mt-4 pt-4 border-t dark:border-gray-800">
                          <div className="flex flex-wrap gap-2" role="list" aria-label={`Vista previa de productos del pedido ${order.saleNumber}`}>
                            {items.slice(0, 3).map((item, idx) => (
                              <div 
                                key={idx} 
                                className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm"
                                role="listitem"
                              >
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
                            aria-label={`Ver historial y detalles completos del pedido ${order.saleNumber}`}
                          >
                            Ver Historial y Detalles
                          </Button>
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

        {/* Order Detail Modal */}
        <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
          <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0">
            {selectedOrder && (
              <>
                <div className="p-6 border-b bg-muted/30 dark:bg-muted/10 shrink-0">
                  <DialogHeader className="flex flex-col pr-8">
                    <div className="flex items-center justify-between">
                      <DialogTitle className="text-2xl font-black">Orden {selectedOrder?.saleNumber}</DialogTitle>
                      <Badge 
                        className={`${formatStatus(selectedOrder?.status || 'PENDING').class} text-sm px-3 py-1`}
                        aria-label={`Estado actual: ${formatStatus(selectedOrder?.status || 'PENDING').label}`}
                      >
                        {formatStatus(selectedOrder?.status || 'PENDING').label}
                      </Badge>
                    </div>
                    <DialogDescription className="mt-1">
                      Gestiona los productos, revisa el historial y realiza acciones sobre el pedido.
                    </DialogDescription>
                  </DialogHeader>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-6 space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Customer & Payment Info */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl border bg-card dark:border-gray-800" role="region" aria-label="Información del cliente y pedido">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                              <User className="h-3 w-3" aria-hidden="true" />
                              Información del Cliente
                            </h4>
                            <p className="font-bold text-lg text-primary">{selectedOrder?.customerName}</p>
                            <div className="space-y-1 mt-2">
                              {selectedOrder?.customerEmail && (
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                  <Search className="h-3 w-3" aria-hidden="true" /> 
                                  <span className="sr-only">Email: </span>
                                  {selectedOrder.customerEmail}
                                </p>
                              )}
                              {selectedOrder?.customerPhone && (
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                  <MessageCircle className="h-3 w-3" aria-hidden="true" /> 
                                  <span className="sr-only">Teléfono: </span>
                                  {selectedOrder.customerPhone}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                              <Clock className="h-3 w-3" aria-hidden="true" />
                              Detalles del Pedido
                            </h4>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Fecha:</span>
                                <span className="text-sm font-medium">{selectedOrder ? formatDate(selectedOrder.createdAt) : ''}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Método:</span>
                                <Badge variant="outline" className="text-xs" aria-label={`Método de pago: ${selectedOrder?.paymentMethod}`}>{selectedOrder?.paymentMethod}</Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Estado Entrega:</span>
                                <Badge 
                                  variant="outline" 
                                  className={`${formatDeliveryStatus(selectedOrder?.deliveryStatus || '').class} text-xs border-current/20`}
                                  aria-label={`Estado de entrega: ${formatDeliveryStatus(selectedOrder?.deliveryStatus || '').label}`}
                                >
                                  {getDeliveryStatusIcon(selectedOrder?.deliveryStatus || '')}
                                  <span className="ml-1">{formatDeliveryStatus(selectedOrder?.deliveryStatus || '').label}</span>
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Delivery Address & Notes */}
                      {(selectedOrder?.deliveryAddress || selectedOrder?.notes) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedOrder?.deliveryAddress && (
                            <div className="p-4 bg-blue-50/30 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                              <h4 className="font-bold text-xs uppercase tracking-widest text-blue-800 dark:text-blue-400 mb-2">Dirección de Entrega</h4>
                              <p className="text-sm text-blue-900 dark:text-blue-200/80">{selectedOrder.deliveryAddress}</p>
                            </div>
                          )}
                          {selectedOrder?.notes && (
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
                          <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2" id="products-summary-heading">
                            <Package className="h-3 w-3" aria-hidden="true" />
                            Resumen de Productos ({Array.isArray(selectedOrder?.items) ? selectedOrder?.items.length : 0})
                          </h4>
                          {selectedOrder?.status === 'PENDING' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 text-xs border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                              onClick={() => selectedOrder && acceptAllOrderItems(selectedOrder.id)}
                              disabled={updatingId === selectedOrder?.id}
                              aria-label="Aceptar todos los productos del pedido"
                            >
                              {updatingId === selectedOrder?.id ? (
                                <div className="h-3 w-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin mr-1" role="status" aria-label="Aceptando todos los productos..." />
                              ) : (
                                <CheckCircle className="h-3 w-3 mr-1" aria-hidden="true" />
                              )}
                              Aceptar Todo
                            </Button>
                          )}
                        </div>
                        <div className="border dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                          <table className="w-full text-sm" aria-labelledby="products-summary-heading">
                            <thead className="bg-muted/50 dark:bg-muted/20">
                              <tr>
                                <th scope="col" className="px-4 py-3 text-left font-bold">Producto</th>
                                <th scope="col" className="px-4 py-3 text-center font-bold">Cant.</th>
                                <th scope="col" className="px-4 py-3 text-right font-bold">Precio</th>
                                <th scope="col" className="px-4 py-3 text-right font-bold">Total</th>
                                <th scope="col" className="px-4 py-3 text-center font-bold">Acción</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-800 bg-card">
                              {Array.isArray(selectedOrder?.items) && selectedOrder?.items.length > 0 ? (
                                selectedOrder?.items.map((item, idx) => (
                                  <tr key={item.id || idx} className="hover:bg-muted/30 dark:hover:bg-muted/10 transition-colors">
                                    <td className="px-4 py-4">
                                      <p className="font-bold dark:text-gray-200">{item.name}</p>
                                      {item.status === 'REJECTED' && (
                                        <Badge variant="destructive" className="mt-1 h-5 text-[9px] px-1.5 uppercase font-black" aria-label="Producto rechazado">Rechazado</Badge>
                                      )}
                                      {item.status === 'ACCEPTED' && (
                                        <Badge variant="outline" className="mt-1 h-5 text-[9px] px-1.5 uppercase font-black bg-green-50 text-green-700 border-green-200" aria-label="Producto aceptado">Aceptado</Badge>
                                      )}
                                    </td>
                                    <td className="px-4 py-4 text-center dark:text-gray-300 font-medium">
                                      {selectedOrder?.status === 'PENDING' ? (
                                        <div className="flex flex-col items-center gap-1">
                                          {editingQuantity?.itemId === item.id ? (
                                            <div className="flex items-center gap-1">
                                              <label htmlFor={`qty-${item.id}`} className="sr-only">Cantidad para {item.name}</label>
                                              <Input
                                                id={`qty-${item.id}`}
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
                                                onClick={() => selectedOrder && updateOrderItemQuantity(selectedOrder.id, item.id, editingQuantity.quantity)}
                                                disabled={updatingItemId === item.id}
                                                aria-label={`Guardar cantidad para ${item.name}`}
                                              >
                                                {updatingItemId === item.id ? (
                                                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" role="status" aria-label="Guardando..." />
                                                ) : (
                                                  <CheckCircle className="h-4 w-4" aria-hidden="true" />
                                                )}
                                              </Button>
                                              <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-8 w-8 text-red-600"
                                                onClick={() => setEditingQuantity(null)}
                                                aria-label={`Cancelar edición de cantidad para ${item.name}`}
                                              >
                                                <XCircle className="h-4 w-4" aria-hidden="true" />
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
                                                aria-label={`Editar cantidad de ${item.name}`}
                                              >
                                                <MoreHorizontal className="h-3 w-3" aria-hidden="true" />
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
                                      {selectedOrder?.status === 'PENDING' ? (
                                        <div className="flex items-center justify-center gap-1">
                                          <Button
                                            size="icon"
                                            variant="outline"
                                            className={`h-8 w-8 rounded-full transition-all ${item.status === 'ACCEPTED' ? 'bg-green-600 text-white border-green-600 scale-110' : 'text-muted-foreground hover:text-green-600 hover:border-green-600'}`}
                                            onClick={() => selectedOrder && updateOrderItemStatus(selectedOrder.id, item.id, 'ACCEPTED')}
                                            disabled={updatingItemId === item.id}
                                            aria-label={`Aceptar ${item.name}`}
                                            aria-pressed={item.status === 'ACCEPTED'}
                                          >
                                            {updatingItemId === item.id && item.status !== 'ACCEPTED' ? (
                                              <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" role="status" aria-label="Procesando..." />
                                            ) : (
                                              <CheckCircle className="h-4 w-4" aria-hidden="true" />
                                            )}
                                          </Button>
                                          <Button
                                            size="icon"
                                            variant="outline"
                                            className={`h-8 w-8 rounded-full transition-all ${item.status === 'REJECTED' ? 'bg-red-600 text-white border-red-600 scale-110' : 'text-muted-foreground hover:text-red-600 hover:border-red-600'}`}
                                            onClick={() => selectedOrder && updateOrderItemStatus(selectedOrder.id, item.id, 'REJECTED')}
                                            disabled={updatingItemId === item.id}
                                            aria-label={`Rechazar ${item.name}`}
                                            aria-pressed={item.status === 'REJECTED'}
                                          >
                                            {updatingItemId === item.id && item.status !== 'REJECTED' ? (
                                              <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" role="status" aria-label="Procesando..." />
                                            ) : (
                                              <XCircle className="h-4 w-4" aria-hidden="true" />
                                            )}
                                          </Button>
                                        </div>
                                      ) : (
                                        <span className="text-xs text-muted-foreground" aria-hidden="true">-</span>
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
                                <td className="px-4 py-5 text-right text-2xl text-primary font-black" aria-label={`Total del pedido: ${formatUSD(selectedOrder?.totalUSD || 0)}`}>{formatUSD(selectedOrder?.totalUSD || 0)}</td>
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
                      <div className="p-4 rounded-xl border bg-card dark:border-gray-800 space-y-4" role="region" aria-labelledby="payment-status-heading">
                        <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2" id="payment-status-heading">
                          <TrendingUp className="h-3 w-3" aria-hidden="true" />
                          Estado de Pago
                        </h4>
                        <div className="space-y-3">
                          {selectedOrder?.isPaid ? (
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 rounded-lg" role="status" aria-label="Pedido pagado">
                              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold mb-1">
                                <CheckCircle className="h-4 w-4" aria-hidden="true" />
                                PAGADO
                              </div>
                              {selectedOrder?.paidAmountUSD && (
                                <p className="text-sm font-black text-emerald-800 dark:text-emerald-300">
                                  Recibido: ${formatUSD(selectedOrder.paidAmountUSD)}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {paymentStatus ? (
                                <div className="space-y-3">
                                  <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/50 rounded-lg" role="status" aria-label={`Pago pendiente: ${Math.round((paymentStatus.paidAmountUSD / selectedOrder!.totalUSD) * 100)}% completado`}>
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold">
                                        <Clock className="h-4 w-4" aria-hidden="true" />
                                        PENDIENTE
                                      </div>
                                      <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                                        {Math.round((paymentStatus.paidAmountUSD / selectedOrder!.totalUSD) * 100)}%
                                      </span>
                                    </div>
                                    <div 
                                      className="w-full bg-amber-200 dark:bg-amber-900/40 rounded-full h-1.5 mb-2" 
                                      role="progressbar" 
                                      aria-valuenow={Math.round((paymentStatus.paidAmountUSD / selectedOrder!.totalUSD) * 100)} 
                                      aria-valuemin={0} 
                                      aria-valuemax={100}
                                      aria-label="Progreso de pago"
                                    >
                                      <div 
                                        className="bg-amber-600 dark:bg-amber-500 h-1.5 rounded-full" 
                                        style={{ width: `${Math.min(100, (paymentStatus.paidAmountUSD / selectedOrder!.totalUSD) * 100)}%` }}
                                      />
                                    </div>
                                    <div className="flex justify-between text-[10px] font-medium text-amber-800 dark:text-amber-300">
                                      <span>Pagado: {formatUSD(paymentStatus.paidAmountUSD)}</span>
                                      <span>Pendiente: {formatUSD(paymentStatus.pendingAmountUSD)}</span>
                                    </div>
                                  </div>

                                  {/* Installment Plan Summary */}
                                  {paymentStatus.installments && paymentStatus.installments.length > 0 && (
                                    <div className="space-y-2" role="group" aria-label="Plan de cuotas">
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Plan de Cuotas</p>
                                      {paymentStatus.installments.map((inst: any) => (
                                        <React.Fragment key={inst.id}>
                                          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-[11px]" aria-label={`Cuota de ${formatUSD(inst.amountUSD)} vencimiento ${formatDate(inst.dueDate).split(',')[0]}, estado ${inst.status}`}>
                                          <div className="flex items-center gap-2">
                                            {inst.status === 'PAID' ? (
                                              <CheckCircle className="h-3 w-3 text-emerald-500" aria-hidden="true" />
                                            ) : inst.status === 'OVERDUE' ? (
                                              <AlertCircle className="h-3 w-3 text-red-500" aria-hidden="true" />
                                            ) : (
                                              <Calendar className="h-3 w-3 text-blue-500" aria-hidden="true" />
                                            )}
                                            <span className="font-medium">{formatDate(inst.dueDate).split(',')[0]}</span>
                                          </div>
                                          <div className="text-right">
                                            <p className="font-bold">{formatUSD(inst.amountUSD)}</p>
                                            <p className={`text-[9px] uppercase font-black ${
                                              inst.status === 'PAID' ? 'text-emerald-600' : 
                                              inst.status === 'OVERDUE' ? 'text-red-600' : 'text-blue-600'
                                            }`}>
                                              {inst.status === 'PAID' ? 'Pagado' : inst.status === 'OVERDUE' ? 'Vencido' : 'Pendiente'}
                                            </p>
                                          </div>
                                        </div>
                                        {inst.proofs && inst.proofs.length > 0 && (
                                          <div className="mt-1 pl-6 space-y-1">
                                            {inst.proofs.map((proof: any) => (
                                              <div 
                                                key={proof.id} 
                                                className={`flex items-center justify-between p-2 rounded border text-[10px] ${
                                                  proof.status === 'PENDING' ? 'bg-yellow-50 border-yellow-100' :
                                                  proof.status === 'APPROVED' ? 'bg-emerald-50 border-emerald-100' :
                                                  'bg-red-50 border-red-100'
                                                }`}
                                              >
                                                <div className="flex items-center gap-2">
                                                  <a 
                                                    href={proof.proofUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline font-bold"
                                                  >
                                                    Ver Comprobante
                                                  </a>
                                                  <span className="text-muted-foreground">• {formatUSD(proof.amountUSD)}</span>
                                                </div>
                                                {proof.status === 'PENDING' ? (
                                                  <Button 
                                                    size="sm" 
                                                    className="h-6 text-[9px] px-2"
                                                    onClick={() => handleVerifyProof(proof)}
                                                  >
                                                    Verificar
                                                  </Button>
                                                ) : (
                                                  <Badge variant="outline" className={`text-[8px] h-4 ${
                                                    proof.status === 'APPROVED' ? 'text-emerald-700 border-emerald-200' : 'text-red-700 border-red-200'
                                                  }`}>
                                                    {proof.status === 'APPROVED' ? 'APROBADO' : 'RECHAZADO'}
                                                  </Badge>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </React.Fragment>
                                      ))}
                                    </div>
                                  )}

                                  {!paymentStatus.hasInstallmentPlan && (
                                    <Button 
                                      variant="outline"
                                      className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-bold h-9 text-xs"
                                      onClick={() => {
                                        const remaining = paymentStatus.remainingUSD;
                                        setFinancingModalMode("installment-plan");
                                        setInstallmentPlanCount(2);
                                        setNewInstallments(buildInstallments(2, remaining));
                                        setAcceptanceModalOpen(true);
                                      }}
                                    >
                                      <PlusCircle className="h-3.5 w-3.5 mr-2" />
                                      Crear Plan de Cuotas
                                    </Button>
                                  )}

                                  <Button 
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10"
                                    onClick={() => {
                                      const remaining = paymentStatus?.remainingUSD ?? paymentStatus?.pendingAmountUSD ?? 0
                                      setPaymentAmount(remaining.toString());
                                      setPaymentModalOpen(true);
                                    }}
                                    disabled={selectedOrder?.status !== 'ACCEPTED' && selectedOrder?.status !== 'PROCESSING'}
                                  >
                                    Registrar Pago
                                  </Button>
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
                                    onClick={() => selectedOrder && handlePaymentClick(selectedOrder)}
                                    disabled={selectedOrder?.status !== 'ACCEPTED' && selectedOrder?.status !== 'PROCESSING'}
                                  >
                                    Confirmar Pago
                                  </Button>
                                </div>
                              )}
                              
                              {(selectedOrder?.status !== 'ACCEPTED' && selectedOrder?.status !== 'PROCESSING' && selectedOrder?.status !== 'COMPLETED') && (
                                <p className="text-[10px] text-center text-muted-foreground italic">
                                  El pago solo se puede confirmar cuando la orden ha sido aceptada o está en proceso.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* History Section */}
                      <div className="p-4 rounded-xl border bg-card dark:border-gray-800" role="region" aria-labelledby="order-history-heading">
                        <h4 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2" id="order-history-heading">
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          Historial de Actividad
                        </h4>
                        {selectedOrder?.auditLogs && selectedOrder.auditLogs.length > 0 ? (
                          <div className="space-y-6 border-l-2 border-muted dark:border-gray-800 ml-2 pl-4" role="list">
                            {selectedOrder.auditLogs.map((log) => (
                              <div key={log.id} className="relative" role="listitem">
                                <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-background border-2 border-primary shadow-sm" aria-hidden="true" />
                                <p className="text-xs font-bold dark:text-gray-200 leading-tight">
                                  {log.action === 'STATUS_CHANGE' 
                                    ? `Cambio de Estado: ${formatStatus(log.newStatus || '').label}`
                                    : log.action === 'DELIVERY_STATUS_CHANGE'
                                      ? `Cambio de Entrega: ${formatDeliveryStatus(log.newDeliveryStatus || '').label}`
                                      : log.action === 'CREATED' 
                                        ? 'Pedido recibido' 
                                        : log.action}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  <span className="sr-only">Fecha: </span>{formatDate(log.createdAt)} {log.user?.name ? `• Por: ${log.user.name}` : ''}
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
              </ScrollArea>

                {/* Footer Actions */}
                <div className="p-6 border-t bg-muted/30 dark:bg-muted/10 shrink-0">
                  <div className="flex flex-col sm:flex-row gap-3">
                    {selectedOrder?.status === 'PENDING' && (
                      <div className="flex flex-1 gap-3" role="group" aria-label="Acciones principales del pedido">
                        <Button 
                          className={`flex-1 h-12 font-bold shadow-lg transition-all active:scale-95 ${
                            selectedOrder?.items.some(item => item.status === 'REJECTED') 
                              ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                          onClick={() => {
                            if (selectedOrder) {
                              const hasRejected = selectedOrder.items.some(item => item.status === 'REJECTED');
                              if (hasRejected) {
                                updateOrderStatus(selectedOrder.id, 'PROPOSED');
                              } else {
                                handleAcceptClick(selectedOrder);
                              }
                            }
                          }}
                          disabled={updatingId === selectedOrder?.id}
                          aria-label={selectedOrder?.items.some(item => item.status === 'REJECTED') ? 'Enviar propuesta al cliente' : 'Aceptar el pedido definitivamente'}
                        >
                          {updatingId === selectedOrder?.id ? (
                            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" role="status" aria-label="Procesando..." />
                          ) : (
                            selectedOrder?.items.some(item => item.status === 'REJECTED') ? (
                              <MessageCircle className="h-5 w-5 mr-2" aria-hidden="true" />
                            ) : (
                              <CheckCircle className="h-5 w-5 mr-2" aria-hidden="true" />
                            )
                          )}
                          {selectedOrder?.items.some(item => item.status === 'REJECTED') ? 'ENVIAR PROPUESTA' : 'ACEPTAR PEDIDO'}
                        </Button>
                        <Button 
                          variant="destructive" 
                          className="flex-1 h-12 font-bold shadow-lg transition-all active:scale-95" 
                          onClick={() => selectedOrder && handleRejectClick(selectedOrder.id)}
                          disabled={updatingId === selectedOrder?.id}
                          aria-label="Rechazar el pedido definitivamente"
                        >
                          <XCircle className="h-5 w-5 mr-2" aria-hidden="true" />
                          RECHAZAR PEDIDO
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2 shrink-0" role="group" aria-label="Acciones de comunicación y documentos">
                      <Button 
                        variant="outline"
                        className="h-12 border-green-600 text-green-600 hover:bg-green-600 hover:text-white font-bold px-6" 
                        onClick={() => selectedOrder && sendWhatsAppReminder(selectedOrder)}
                        aria-label={`Enviar recordatorio por WhatsApp al cliente ${selectedOrder?.customerName}`}
                      >
                        <MessageCircle className="h-5 w-5 sm:mr-2" aria-hidden="true" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-12 font-bold px-6" 
                        onClick={() => selectedOrder && generateInvoicePDF(selectedOrder)}
                        aria-label={`Generar y descargar factura PDF del pedido ${selectedOrder?.saleNumber}`}
                      >
                        <Download className="h-5 w-5 sm:mr-2" aria-hidden="true" />
                        <span className="hidden sm:inline">Factura PDF</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="h-12 font-bold text-muted-foreground" 
                        onClick={() => setSelectedOrder(null)}
                        aria-label="Cerrar detalles del pedido"
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

        {/* Acceptance & Financing Modal */}
        <Dialog open={acceptanceModalOpen} onOpenChange={(open) => {
          if (!open) handleCloseAcceptanceModal()
          else setAcceptanceModalOpen(true)
        }}>
          <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-primary text-xl font-black">
                {financingModalMode === "acceptance" ? (
                  <>
                    <CheckCircle className="h-6 w-6" aria-hidden="true" />
                    Aceptar Pedido y Configurar Financiamiento
                  </>
                ) : (
                  <>
                    <Calendar className="h-6 w-6" aria-hidden="true" />
                    Crear Plan de Cuotas
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {financingModalMode === "acceptance" ? (
                  <>
                    Confirma la aceptación del pedido <strong>{acceptanceOrder?.saleNumber}</strong> para <strong>{acceptanceOrder?.customerName}</strong>. 
                    Configura el pago inicial y las cuotas si aplica.
                  </>
                ) : (
                  <>
                    Define las fechas y montos para el pago de esta orden. El total debe coincidir con el saldo pendiente: <strong>{formatUSD(paymentStatus?.remainingUSD || 0)}</strong>.
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            {financingModalMode === "acceptance" ? (
              <>
                <div className="py-6 space-y-6">
                  <div className="p-4 bg-muted/50 rounded-xl border flex justify-between items-center" role="region" aria-label="Resumen del pedido a aceptar">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Total del Pedido</p>
                      <p className="text-2xl font-black text-primary" aria-label={`Total del pedido: ${formatUSD(acceptanceOrder?.totalUSD || 0)}`}>{formatUSD(acceptanceOrder?.totalUSD || 0)}</p>
                    </div>
                    <Badge variant="outline" className="bg-background font-bold px-3 py-1" aria-label={`${(acceptanceOrder?.items || []).length} productos en el pedido`}>
                      {(acceptanceOrder?.items || []).length} Productos
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label htmlFor="initial-payment" className="text-sm font-bold flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-primary" aria-hidden="true" />
                        Pago Inicial (USD)
                      </label>
                      <span className="text-xs text-muted-foreground">Opcional</span>
                    </div>
                    <Input
                      id="initial-payment"
                      type="number"
                      step="0.01"
                      max={acceptanceOrderTotal}
                      placeholder="0.00"
                      value={initialPaymentUSD}
                      onChange={(e) => {
                        setInitialPaymentUSD(e.target.value)
                        if (isFinancingEnabled && installmentCount > 0) {
                          calculateAutomaticInstallments(installmentCount, parseFloat(e.target.value) || 0)
                        }
                      }}
                      className="text-lg font-bold h-12"
                      aria-label="Monto del pago inicial en dólares"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
                    <div className="space-y-0.5">
                      <label htmlFor="enable-financing" className="text-sm font-bold flex items-center gap-2 cursor-pointer">
                        <Calendar className="h-4 w-4 text-primary" aria-hidden="true" />
                        Habilitar Plan de Cuotas
                      </label>
                      <p className="text-xs text-muted-foreground">Dividir el saldo restante en pagos quincenales.</p>
                    </div>
                    <Checkbox 
                      id="enable-financing"
                      checked={isFinancingEnabled}
                      onCheckedChange={(checked) => {
                        setIsFinancingEnabled(!!checked)
                        if (checked && installmentCount === 0) {
                          setInstallmentCount(2)
                          calculateAutomaticInstallments(2, parseFloat(initialPaymentUSD) || 0)
                        }
                      }}
                      className="h-5 w-5"
                      aria-label="Habilitar plan de financiamiento en cuotas"
                    />
                  </div>

                  {isFinancingEnabled && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="space-y-3">
                        <label htmlFor="installment-count" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Número de Cuotas (Quincenales)</label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="installment-count"
                            type="number"
                            min={1}
                            step={1}
                            value={installmentCount}
                            onChange={(e) => {
                              const nextCount = Math.max(1, parseInt(e.target.value, 10) || 1)
                              setInstallmentCount(nextCount)
                              calculateAutomaticInstallments(nextCount, parseFloat(initialPaymentUSD) || 0)
                            }}
                            className="h-10 text-sm font-bold"
                            aria-label="Cantidad de cuotas para el financiamiento"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Detalle del Plan</label>
                        </div>
                        <div className="space-y-2" role="group" aria-label="Detalles de las cuotas">
                          {customInstallments.length === 0 && (
                            <div className="text-center py-4 border border-dashed rounded-lg bg-muted/20">
                              <p className="text-[10px] font-medium text-muted-foreground">No hay cuotas definidas. Ajusta el número de cuotas.</p>
                            </div>
                          )}
                          {customInstallments.map((inst, idx) => (
                            <div key={idx} className="flex gap-2 items-end p-3 border rounded-lg bg-background group relative animate-in zoom-in-95 duration-200">
                              <div className="flex-[1.2]">
                                <label htmlFor={`inst-amount-${idx}`} className="text-[9px] font-bold text-muted-foreground uppercase mb-1 block">Monto (USD)</label>
                                <Input
                                  id={`inst-amount-${idx}`}
                                  type="number"
                                  value={inst.amountUSD}
                                  readOnly
                                  className="h-8 text-xs font-bold"
                                  aria-label={`Monto de la cuota ${idx + 1}`}
                                />
                              </div>
                              <div className="flex-[1.5]">
                                <label htmlFor={`inst-date-${idx}`} className="text-[9px] font-bold text-muted-foreground uppercase mb-1 block">Vencimiento</label>
                                <Input
                                  id={`inst-date-${idx}`}
                                  type="date"
                                  value={inst.dueDate}
                                  onChange={(e) => {
                                    const updated = [...customInstallments]
                                    updated[idx].dueDate = e.target.value
                                    setCustomInstallments(updated)
                                  }}
                                  className="h-8 text-xs"
                                  aria-label={`Fecha de vencimiento de la cuota ${idx + 1}`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className={`p-3 border rounded-lg flex gap-3 items-start transition-colors duration-300 ${
                        loadingSolvency 
                          ? "bg-gray-50 border-gray-200" 
                          : customerOrders.some(o => o.status === 'ACCEPTED' && !o.isPaid)
                            ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                            : "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800"
                      }`} role="status" aria-live="polite">
                        {loadingSolvency ? (
                          <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin mt-0.5" role="presentation" />
                        ) : (
                          <AlertCircle className={`h-4 w-4 mt-0.5 ${
                            customerOrders.some(o => o.status === 'ACCEPTED' && !o.isPaid)
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-blue-600 dark:text-blue-400"
                          }`} aria-hidden="true" />
                        )}
                        <div>
                          <p className={`text-xs font-bold ${
                            customerOrders.some(o => o.status === 'ACCEPTED' && !o.isPaid)
                              ? "text-amber-800 dark:text-amber-300"
                              : "text-blue-800 dark:text-blue-300"
                          }`}>
                            Validación de Solvencia
                          </p>
                          {loadingSolvency ? (
                            <p className="text-[10px] text-muted-foreground animate-pulse">Analizando historial del cliente...</p>
                          ) : (
                            <p className={`text-[10px] ${
                              customerOrders.some(o => o.status === 'ACCEPTED' && !o.isPaid)
                                ? "text-amber-700 dark:text-amber-400/80"
                                : "text-blue-700 dark:text-blue-400/80"
                            }`}>
                              {customerOrders.some(o => o.status === 'ACCEPTED' && !o.isPaid)
                                ? `ATENCIÓN: El cliente tiene ${customerOrders.filter(o => o.status === 'ACCEPTED' && !o.isPaid).length} pedido(s) pendiente(s) de pago.`
                                : "Cliente sin deudas pendientes detectadas en su historial."}
                              {" El plan propuesto es quincenal (cada 14 días)."}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter className="bg-muted/30 p-4 -mx-6 -mb-6 mt-4 border-t">
                  <div className="flex flex-col w-full gap-3">
                    <div className="flex justify-between items-center px-2" role="region" aria-label="Resumen de financiamiento">
                      <div className="text-left">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Resumen Final</p>
                        <p className="text-sm font-bold">
                      {formatUSD(initialPaymentValue)} Inicial + {formatUSD(financedTotalValue)} Financiado
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Diferencia</p>
                        <p className={`text-sm font-black ${
                      Math.abs(totalCombinedValue - acceptanceOrderTotal) < 0.01
                            ? 'text-emerald-600'
                            : 'text-destructive'
                        }`} aria-live="polite">
                      {formatUSD(totalCombinedValue - acceptanceOrderTotal)}
                        </p>
                    {exceedsOrderTotal && (
                      <p className="text-[10px] font-bold text-destructive" role="alert">La suma supera el total del pedido.</p>
                    )}
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1 font-bold" onClick={handleCloseAcceptanceModal} aria-label="Cancelar aceptación del pedido">
                        Cancelar
                      </Button>
                      <Button 
                        className="flex-[2] font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                        onClick={confirmAcceptance}
                        disabled={
                          updatingId !== null || 
                      exceedsOrderTotal ||
                      (isFinancingEnabled && Math.abs(totalCombinedValue - acceptanceOrderTotal) >= 0.01)
                        }
                        aria-label="Confirmar aceptación del pedido y plan de financiamiento"
                      >
                        {updatingId !== null ? (
                          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" role="status" aria-label="Procesando..." />
                        ) : (
                          <CheckCircle className="h-5 w-5 mr-2" aria-hidden="true" />
                        )}
                        CONFIRMAR ACEPTACIÓN
                      </Button>
                    </div>
                  </div>
                </DialogFooter>
              </>
            ) : (
              <>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="plan-installment-count" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Número de Cuotas (Quincenales)</label>
                    <Input
                      id="plan-installment-count"
                      type="number"
                      min={1}
                      step={1}
                      value={installmentPlanCount}
                      onChange={(e) => {
                        const nextCount = Math.max(1, parseInt(e.target.value, 10) || 1)
                        setInstallmentPlanCount(nextCount)
                      }}
                      aria-label="Número de cuotas quincenales"
                    />
                  </div>
                  <div className="space-y-3" role="group" aria-label="Detalle de nuevas cuotas">
                    {newInstallments.map((inst, idx) => (
                      <div key={idx} className="flex gap-4 items-end p-3 border rounded-lg bg-muted/30">
                        <div className="flex-1 space-y-2">
                          <label htmlFor={`plan-amount-${idx}`} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Monto (USD)</label>
                          <Input
                            id={`plan-amount-${idx}`}
                            type="number"
                            step="0.01"
                            value={inst.amountUSD}
                            readOnly
                            placeholder="0.00"
                            aria-label={`Monto de la nueva cuota ${idx + 1}`}
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <label htmlFor={`plan-date-${idx}`} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Fecha de Vencimiento</label>
                          <Input
                            id={`plan-date-${idx}`}
                            type="date"
                            value={inst.dueDate}
                            onChange={(e) => {
                              const updated = [...newInstallments];
                              updated[idx].dueDate = e.target.value;
                              setNewInstallments(updated);
                            }}
                            aria-label={`Fecha de vencimiento de la nueva cuota ${idx + 1}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/10" role="region" aria-label="Resumen del nuevo plan de cuotas">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium">Total en cuotas:</span>
                      <span className={`font-black ${
                        Math.abs(planTotalValue - planRemainingValue) < 0.01
                          ? 'text-emerald-600'
                          : 'text-destructive'
                      }`} aria-live="polite">
                        {formatUSD(planTotalValue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                      <span>Saldo pendiente:</span>
                      <span>{formatUSD(planRemainingValue)}</span>
                    </div>
                    {planExceedsRemaining && (
                      <p className="text-[10px] font-bold text-destructive mt-1" role="alert">La suma supera el saldo pendiente.</p>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAcceptanceModalOpen(false)} aria-label="Cancelar creación de plan de cuotas">
                    Cancelar
                  </Button>
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground" 
                    onClick={handleCreateInstallmentPlan}
                    disabled={
                      updatingId !== null || 
                      Math.abs(planTotalValue - planRemainingValue) >= 0.01
                    }
                    aria-label="Confirmar nuevo plan de cuotas"
                  >
                    {updatingId !== null ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" role="status" aria-label="Procesando..." />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                    )}
                    Confirmar Plan
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Payment Confirmation Modal */}
        <Dialog open={paymentModalOpen} onOpenChange={(open) => {
          if (!open) handleClosePaymentModal()
          else setPaymentModalOpen(true)
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-primary">
                <CheckCircle className="h-5 w-5" aria-hidden="true" />
                Confirmar Pago del Pedido
              </DialogTitle>
              <DialogDescription>
                Ingresa el monto recibido y opcionalmente una nota. El pedido se marcará como <strong>PAGADO</strong> y <strong>COMPLETADO</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <label htmlFor="payment-amount" className="text-sm font-medium">Monto Recibido (USD)</label>
                <Input
                  id="payment-amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="font-bold text-lg"
                  autoFocus
                  aria-label="Monto recibido en dólares"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="payment-notes" className="text-sm font-medium">Notas de Pago (Opcional)</label>
                <Textarea
                  id="payment-notes"
                  placeholder="Ej: Pago recibido vía Zelle, transferencia Banesco, efectivo..."
                  value={paymentReason}
                  onChange={(e) => setPaymentReason(e.target.value)}
                  className="min-h-[80px] resize-none"
                  aria-label="Notas u observaciones sobre el pago"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleClosePaymentModal} aria-label="Cancelar registro de pago">
                Cancelar
              </Button>
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground" 
                onClick={confirmPayment}
                disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || updatingId !== null}
                aria-label="Confirmar pago y completar pedido"
              >
                {updatingId !== null ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" role="status" aria-label="Procesando..." />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                )}
                Confirmar y Completar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Rejection Reason Modal */}
        <Dialog open={rejectionModalOpen} onOpenChange={(open) => {
          if (!open) handleCloseRejectionModal()
          else setRejectionModalOpen(true)
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" aria-hidden="true" />
                Rechazar Pedido
              </DialogTitle>
              <DialogDescription id="rejection-description">
                Por favor, indica el motivo del rechazo. Este mensaje será visible en el historial del pedido.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4" role="region" aria-labelledby="rejection-description">
              <label htmlFor="rejection-reason" className="sr-only">Motivo del rechazo</label>
              <Textarea
                id="rejection-reason"
                placeholder="Ej: Producto agotado, problemas con el pago, zona de entrega no disponible..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px] resize-none"
                autoFocus
                aria-required="true"
                aria-label="Motivo por el cual se rechaza el pedido"
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleCloseRejectionModal} aria-label="Cancelar y volver al detalle">
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmRejection}
                disabled={!rejectionReason.trim() || updatingId !== null}
                aria-label="Confirmar rechazo del pedido"
              >
                {updatingId !== null ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" role="status" aria-label="Procesando..." />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                )}
                Confirmar Rechazo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Proof Verification Modal */}
        <Dialog open={proofModalOpen} onOpenChange={setProofModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-primary">
                <CheckCircle className="h-5 w-5" aria-hidden="true" />
                Verificar Comprobante
              </DialogTitle>
              <DialogDescription id="proof-verification-description">
                Revisa el comprobante y aprueba o rechaza el pago de <strong>{formatUSD(selectedProof?.amountUSD || 0)}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4" role="region" aria-labelledby="proof-verification-description">
              {selectedProof && (
                <div className="aspect-video relative rounded-lg overflow-hidden border" role="img" aria-label={`Comprobante de pago por ${formatUSD(selectedProof.amountUSD)}`}>
                  <img 
                    src={selectedProof.proofUrl} 
                    alt={`Comprobante de pago enviado por el cliente`} 
                    className="object-contain w-full h-full"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/50">
                    <a 
                      href={selectedProof.proofUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-white font-bold flex items-center gap-2"
                      aria-label="Ver comprobante en pantalla completa (abre en nueva pestaña)"
                    >
                      <Eye className="h-4 w-4" aria-hidden="true" />
                      Ver pantalla completa
                    </a>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="admin-proof-notes" className="text-sm font-medium">Notas del Administrador (Opcional)</label>
                <Textarea
                  id="admin-proof-notes"
                  placeholder="Ej: Pago recibido correctamente, el monto no coincide, etc."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="min-h-[80px] resize-none"
                  aria-label="Notas adicionales sobre la verificación del comprobante"
                />
              </div>
            </div>
            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={() => confirmProofVerification('REJECTED')}
                disabled={isProcessingProof}
                aria-label="Rechazar comprobante de pago"
              >
                {isProcessingProof ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" role="status" aria-label="Procesando..." />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                )}
                Rechazar
              </Button>
              <Button 
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => confirmProofVerification('APPROVED')}
                disabled={isProcessingProof}
                aria-label="Aprobar comprobante de pago"
              >
                {isProcessingProof ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" role="status" aria-label="Procesando..." />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                )}
                Aprobar Pago
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delivery Status Modal */}
        <Dialog open={deliveryModalOpen} onOpenChange={(open) => {
          if (!open) handleCloseDeliveryModal()
          else setDeliveryModalOpen(true)
        }}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-primary">
                <Truck className="h-5 w-5" aria-hidden="true" />
                Actualizar Estado de Entrega
              </DialogTitle>
              <DialogDescription id="delivery-status-description">
                Cambiar el estado de entrega a: <strong>{formatDeliveryStatus(newDeliveryStatus).label}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4" role="region" aria-labelledby="delivery-status-description">
              <div className="space-y-2">
                <label htmlFor="delivery-notes" className="text-sm font-medium">Nota u Observación (Opcional)</label>
                <Textarea
                  id="delivery-notes"
                  placeholder="Ej: Entregado al cliente, En camino con el repartidor..."
                  value={deliveryReason}
                  onChange={(e) => setDeliveryReason(e.target.value)}
                  className="min-h-[100px] resize-none"
                  aria-label="Notas sobre el cambio de estado de entrega"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleCloseDeliveryModal} aria-label="Cancelar y volver">
                Cancelar
              </Button>
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground" 
                onClick={confirmDeliveryStatus}
                disabled={updatingId !== null}
                aria-label={`Confirmar cambio de estado de entrega a ${formatDeliveryStatus(newDeliveryStatus).label}`}
              >
                {updatingId !== null ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" role="status" aria-label="Actualizando..." />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                )}
                Confirmar Cambio
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
