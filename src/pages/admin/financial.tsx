import { startOfDay, isBefore, format, isWithinInterval, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { useState, useEffect, useMemo } from "react"
import {
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  Plus,
  Edit,
  Minus,
  Calculator,
  FileText,
  History,
  Settings,
  RefreshCw,
  X,
  Download,
  CheckCircle2
} from "lucide-react"
import { AdminPageHeader } from "@/components/admin/page-header"
import { BusinessEventsCalendar, type BusinessEvent } from "@/components/admin/business-events-calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
 
import { formatUSD, formatBS } from "@/lib/utils"
import { api, API_BASE } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import {
  generateInventoryReport,
  generateSalesReport,
  generateFinancialReport
} from "@/lib/report-utils"
import { Loader2 } from "lucide-react"

interface Product {
  id: string
  name: string
  sku: string
  stock: number
  purchasePrice: number
  profitMargin: number
  price: number
}

interface CartItem {
  product: Product
  quantity: number
}

interface BCVRate {
  rate: number
  timestamp: string
}

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export function FinancialDashboard() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [bcvRate, setBcvRate] = useState<BCVRate>({ rate: 375.00, timestamp: new Date().toISOString() })
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [isUpdatingBcv, setIsUpdatingBcv] = useState(false)
  const [businessEvents, setBusinessEvents] = useState<BusinessEvent[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(false)
  const [isAddEventOpen, setIsAddEventOpen] = useState(false)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [reportDates, setReportDates] = useState({
    start: '',
    end: ''
  })
  const [newEvent, setNewEvent] = useState({
    type: 'CUSTOM',
    title: '',
    description: '',
    time: '12:00',
    isFuture: true
  })

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

  // Memoize totals to avoid recalculation on every render
  const totals = useMemo(() => {
    const totalCostUSD = cart.reduce((sum, item) => {
      const purchasePrice = Number(item.product?.purchasePrice) || 0
      return sum + (purchasePrice) * (item.quantity || 0)
    }, 0)

    const totalUSD = cart.reduce((sum, item) => {
      const price = Number(item.product?.price) || 0
      return sum + price * (item.quantity || 0)
    }, 0)

    const rate = Number(bcvRate?.rate) || 375.00
    const totalBs = totalUSD * rate
    const profitUSD = totalUSD - totalCostUSD
    const profitBs = profitUSD * rate

    return {
      totalCostUSD,
      totalUSD,
      totalBs,
      profitUSD,
      profitBs
    }
  }, [cart, bcvRate])

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    document.title = "Gestión Financiera | Ana's Supplements Admin"
  }, [])

  const handleGenerateReport = (type: string) => {
    // Validar si es personalizado que tenga fechas
    if (type === "Personalizado" && (!reportDates.start || !reportDates.end)) {
      toast({
        title: "Fechas requeridas",
        description: "Por favor selecciona un rango de fechas para el reporte personalizado.",
        variant: "destructive"
      })
      return
    }

    confirmAction({
      title: "Generar Reporte",
      description: `¿Estás seguro de que deseas generar un reporte de ${type}?`,
      confirmText: "Generar",
      onConfirm: async () => {
        try {
          toast({
            title: "Generando reporte",
            description: `El reporte de ${type} se está procesando...`,
          })

          if (type === "Inventario") {
            generateInventoryReport(products)
          } else if (type === "Ventas") {
            generateSalesReport(sales)
          } else if (type === "Financiero") {
            generateFinancialReport(sales, products)
          } else if (type === "Personalizado") {
            const filteredSales = sales.filter(s => {
              const saleDate = parseISO(s.createdAt)
              return isWithinInterval(saleDate, {
                start: startOfDay(new Date(reportDates.start)),
                end: startOfDay(new Date(reportDates.end))
              })
            })
            generateSalesReport(filteredSales, reportDates.start, reportDates.end)
          }

          toast({
            title: "Reporte generado",
            description: "El documento se ha descargado correctamente.",
          })
        } catch (error) {
          console.error("Error generating report:", error)
          toast({
            title: "Error",
            description: "No se pudo generar el reporte. Inténtalo de nuevo.",
            variant: "destructive"
          })
        }
      }
    })
  }

  const fetchData = async () => {
    try {
      fetchEvents()
      // Usar la API real para el BCV
      const rateData = await api.getBCVStatus()
      if (rateData && rateData.currentRate) {
        setBcvRate({ 
          rate: Number(rateData.currentRate.rate) || 375.00, 
          timestamp: rateData.currentRate.createdAt || rateData.currentRate.timestamp || new Date().toISOString() 
        })
      }

      // Usar la API real para productos y ventas (ahora con el cliente api)
      const [productsData, salesData] = await Promise.all([
        api.get<{ products: Product[] }>("/admin/products"),
        api.get<{ sales: any[] }>("/admin/sales?limit=10").catch(() => ({ sales: [] })),
      ])

      if (productsData && productsData.products) {
        setProducts(productsData.products)
      }
      if (salesData && salesData.sales) {
        setSales(salesData.sales)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      // Demo data if API fails
      if (products.length === 0) {
        setProducts([
          { id: "1", name: "Paracetamol 500mg", sku: "PAR-001", stock: 45, purchasePrice: 5.50, profitMargin: 1.5, price: 11.25 },
          { id: "2", name: "Ibuprofeno 400mg", sku: "IBU-002", stock: 8, purchasePrice: 8.75, profitMargin: 1.5, price: 16.13 },
          { id: "3", name: "Amoxicilina 500mg", sku: "AMO-003", stock: 3, purchasePrice: 12.00, profitMargin: 1.6, price: 23.20 },
          { id: "4", name: "Vitamina C 1000mg", sku: "VIT-004", stock: 120, purchasePrice: 15.00, profitMargin: 1.4, price: 23.10 },
        ])
      }
    }
  }

  const fetchEvents = async () => {
    setIsLoadingEvents(true)
    try {
      // Get events from different sources
      const [salesData, reqData, invData, dbEvents] = await Promise.all([
        api.getSalesReport(),
        api.getRequirementsReport(),
        api.getInventoryReportAdmin(),
        api.getBusinessEvents()
      ])

      const events: BusinessEvent[] = []

      // Map persistence DB events (priority)
      if (Array.isArray(dbEvents)) {
        dbEvents.forEach((ev: any) => {
          events.push({
            id: ev.id,
            type: ev.type as any,
            title: ev.title,
            description: ev.description,
            date: ev.date,
            amount: ev.amount,
            status: ev.status,
            isFuture: ev.isFuture
          })
        })
      }

      // Map sales (only if not already in dbEvents to avoid duplicates if synced later)
      if (Array.isArray(salesData)) {
        salesData.forEach((sale: any) => {
          if (!events.find(e => e.id === `sale-${sale.id}`)) {
            events.push({
              id: `sale-${sale.id}`,
              type: 'SALE',
              title: `Venta #${sale.saleNumber}`,
              description: `${sale.customerName} - ${formatUSD(sale.totalUSD)}`,
              date: sale.date || sale.createdAt,
              amount: Number(sale.totalUSD),
              status: 'completed'
            })
          }
        })
      }

      // Map requirements
      if (reqData && Array.isArray(reqData.items)) {
        reqData.items.forEach((req: any) => {
          if (!events.find(e => e.id === `req-${req.id}`)) {
            events.push({
              id: `req-${req.id}`,
              type: 'REQUIREMENT',
              title: `Requerimiento ${req.code}`,
              description: `${req.supplier} - ${formatUSD(req.totalUSD)}`,
              date: req.date || req.createdAt,
              amount: Number(req.totalUSD),
              status: req.status.toLowerCase()
            })
          }
        })
      }

      // Map low stock
      if (invData && invData.alerts && Array.isArray(invData.alerts.lowStock)) {
        invData.alerts.lowStock.forEach((prod: any) => {
          if (!events.find(e => e.id === `lowstock-${prod.id}`)) {
            // Alertas de stock bajo se asocian al día de hoy para que no se muevan
            // En el futuro, esto debería venir de una tabla de notificaciones persistentes
            const today = new Date();
            today.setHours(12, 0, 0, 0); // Mediodía para evitar problemas de zona horaria
            
            events.push({
              id: `lowstock-${prod.id}`,
              type: 'LOW_STOCK',
              title: `Stock Bajo: ${prod.name}`,
              description: `Quedan ${prod.stock} unidades (Mín: ${prod.minStock})`,
              date: today.toISOString(),
            })
          }
        })
      }

      setBusinessEvents(events)
    } catch (error) {
      console.error("Error fetching business events:", error)
    } finally {
      setIsLoadingEvents(false)
    }
  }

  const handleAddEvent = async () => {
    if (!selectedDate || !newEvent.title) {
      toast({
        title: "Error",
        description: "El título y la fecha son obligatorios",
        variant: "destructive"
      })
      return
    }

    // Validación de fecha pasada
    const today = startOfDay(new Date())
    const eventDate = startOfDay(selectedDate)
    
    if (isBefore(eventDate, today)) {
      toast({
        title: "Fecha inválida",
        description: "No se pueden crear eventos en fechas pasadas.",
        variant: "destructive"
      })
      return
    }

    const actionText = editingEventId ? "editar" : "crear"
    const actionTitle = editingEventId ? "Editar Evento" : "Crear Evento"

    confirmAction({
      title: actionTitle,
      description: `¿Estás seguro de que deseas ${actionText} este evento en el calendario?`,
      confirmText: editingEventId ? "Actualizar" : "Crear",
      onConfirm: async () => {
        try {
          const [hours, minutes] = newEvent.time.split(':').map(Number)
          const dateWithTime = new Date(selectedDate)
          dateWithTime.setHours(hours, minutes, 0, 0)
          const finalDate = dateWithTime.toISOString()

          if (editingEventId) {
            await api.put(`/admin/business-events/${editingEventId}`, {
              ...newEvent,
              date: finalDate,
            })
            toast({
              title: "Evento actualizado",
              description: "Los cambios se han guardado correctamente."
            })
          } else {
            await api.createBusinessEvent({
              ...newEvent,
              date: finalDate,
            })
            toast({
              title: "Evento creado",
              description: "El evento se ha guardado correctamente en el calendario."
            })
          }

          setIsAddEventOpen(false)
          setEditingEventId(null)
          setNewEvent({
            type: 'CUSTOM',
            title: '',
            description: '',
            time: '12:00',
            isFuture: true
          })
          fetchEvents()
        } catch (error) {
          console.error("Error saving event:", error)
          toast({
            title: "Error",
            description: `No se pudo ${actionText} el evento.`,
            variant: "destructive"
          })
        }
      }
    })
  }

  const handleEditEvent = (event: BusinessEvent) => {
    // Solo permitir editar eventos que no sean generados por el sistema (que tienen prefijos)
    const isSystemEvent = event.id.toString().includes('-') && 
                         (event.id.toString().startsWith('sale-') || 
                          event.id.toString().startsWith('req-') || 
                          event.id.toString().startsWith('lowstock-'))
    
    if (isSystemEvent) {
      toast({
        title: "Evento del sistema",
        description: "Los eventos generados automáticamente no se pueden editar.",
        variant: "destructive"
      })
      return
    }

    setEditingEventId(event.id)
    setNewEvent({
      type: event.type,
      title: event.title,
      description: event.description || '',
      time: event.date ? format(new Date(event.date), "HH:mm") : '12:00',
      isFuture: event.isFuture ?? true
    })
    setSelectedDate(new Date(event.date))
    setIsAddEventOpen(true)
  }

  const handleDeleteEvent = (id: string) => {
    // Solo permitir eliminar eventos que no sean generados por el sistema
    const isSystemEvent = id.toString().includes('-') && 
                         (id.toString().startsWith('sale-') || 
                          id.toString().startsWith('req-') || 
                          id.toString().startsWith('lowstock-'))
    
    if (isSystemEvent) {
      toast({
        title: "Evento del sistema",
        description: "Los eventos generados automáticamente no se pueden eliminar.",
        variant: "destructive"
      })
      return
    }

    confirmAction({
      title: "Eliminar Evento",
      description: "¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
      variant: "destructive",
      onConfirm: async () => {
        try {
          await api.delete(`/admin/business-events/${id}`)
          toast({
            title: "Evento eliminado",
            description: "El evento se ha borrado del calendario."
          })
          fetchEvents()
        } catch (error) {
          console.error("Error deleting event:", error)
          toast({
            title: "Error",
            description: "No se pudo eliminar el evento.",
            variant: "destructive"
          })
        }
      }
    })
  }

  const onDateClick = (date: Date) => {
    const today = startOfDay(new Date())
    const clickedDate = startOfDay(date)
    
    if (isBefore(clickedDate, today)) {
      toast({
        title: "Acción no permitida",
        description: "No se pueden añadir eventos en fechas que ya pasaron.",
        variant: "destructive"
      })
      return
    }

    setSelectedDate(date)
    setIsAddEventOpen(true)
  }

  const handleUpdateBcv = async () => {
    confirmAction({
      title: "¿Actualizar tasa BCV?",
      description: "Se realizará una petición al servidor para obtener la tasa oficial más reciente.",
      confirmText: "Actualizar",
      onConfirm: async () => {
        setIsUpdatingBcv(true)
        try {
          const result = await api.forceBCVUpdate()
          console.log("Resultado de actualización BCV:", result)
          
          const newRate = Number(result.record?.rate || result.rate)
          
          if (isNaN(newRate) || newRate <= 0) {
            throw new Error("La API devolvió una tasa inválida")
          }

          setBcvRate({ 
            rate: newRate, 
            timestamp: result.record?.createdAt || result.record?.timestamp || new Date().toISOString() 
          })
          
          toast({
            title: "Tasa actualizada",
            description: `La tasa BCV se ha actualizado a Bs ${formatBS(newRate)}`,
          })
        } catch (error) {
          console.error("Error updating BCV rate:", error)
          toast({
            title: "Error",
            description: "No se pudo actualizar la tasa BCV automáticamente.",
            variant: "destructive",
          })
        } finally {
            setIsUpdatingBcv(false)
        }
      }
    })
  }

  const handleManualBcvUpdate = async (newRate: number) => {
    if (!newRate || isNaN(newRate) || newRate <= 0) {
      toast({
        title: "Error",
        description: "Por favor ingresa una tasa válida",
        variant: "destructive"
      })
      return
    }

    confirmAction({
      title: "¿Establecer tasa manual?",
      description: `¿Estás seguro de que deseas establecer la tasa BCV manualmente a Bs ${formatBS(newRate)}?`,
      confirmText: "Establecer Tasa",
      onConfirm: async () => {
        setIsUpdatingBcv(true)
        try {
          const result = await api.setBCVRateManual(newRate)
          const confirmedRate = Number(result.rate)
          setBcvRate({ 
            rate: isNaN(confirmedRate) ? newRate : confirmedRate, 
            timestamp: result.record?.createdAt || new Date().toISOString() 
          })
          toast({
            title: "Tasa actualizada manualmente",
            description: `La tasa BCV se ha establecido a Bs ${formatBS(result.rate)}`,
          })
        } catch (error) {
          toast({
            title: "Error",
            description: "No se pudo actualizar la tasa manualmente.",
            variant: "destructive",
          })
        } finally {
          setIsUpdatingBcv(false)
        }
      }
    })
  }

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId))
  }

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    )
  }



  const processSale = async () => {
    if (cart.length === 0) return

    confirmAction({
      title: "¿Procesar venta?",
      description: `¿Estás seguro de que deseas procesar esta venta por un total de ${formatUSD(totals.totalUSD)}?`,
      confirmText: "Procesar Venta",
      onConfirm: async () => {
        const items = cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
        }))

        try {
          const response = await fetch(`${API_BASE}/financial/sales`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items,
              bcvRate: bcvRate.rate,
              customerName: "Venta directa",
            }),
          })

          if (response.ok) {
            setCart([])
            fetchData()
            toast({
              title: "Venta procesada",
              description: "Venta procesada exitosamente!",
            })
          }
        } catch (error) {
          toast({
            title: "Venta procesada (demo)",
            description: "La venta se procesó en modo demo.",
          })
          setCart([])
        }
      }
    })
  }



  return (
    <>
      <div className="space-y-6 pb-20 md:pb-0">
        <AdminPageHeader 
          title="Gestión Financiera"
          subtitle="Inventario, ventas y análisis de rentabilidad"
          icon={Calculator}
          rightContent={
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex items-center gap-3 bg-green-50 dark:bg-green-950/20 px-4 py-2 rounded-xl border border-green-200 dark:border-green-900/30 shadow-sm">
                <DollarSign className="h-6 w-6 text-green-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Tasa BCV</p>
                  <div className="flex flex-row sm:flex-col items-baseline sm:items-start justify-between gap-2 sm:gap-0">
                    <p className="text-xl font-black text-green-700 dark:text-green-400 leading-none">Bs {formatBS(bcvRate?.rate || 0)}</p>
                    <p className="text-[10px] text-green-600/70 mt-0 sm:mt-1 font-medium">
                      {bcvRate?.timestamp ? new Date(bcvRate.timestamp).toLocaleString('es-VE', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        hour12: true 
                      }) : 'Cargando...'}
                    </p>
                  </div>
                </div>
              </div>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    disabled={isUpdatingBcv}
                    className="h-11 rounded-xl border-slate-200/50 dark:border-border/50 bg-white dark:bg-card font-bold text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all"
                  >
                    {isUpdatingBcv ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Settings className="h-4 w-4 mr-2" />
                    )}
                    Gestionar Tasa
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80" align="end">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium leading-none">Tasa de Cambio (BCV)</h4>
                      <p className="text-sm text-muted-foreground">
                        Actualiza la tasa para cálculos en Bolívares.
                      </p>
                    </div>
                    <div className="grid gap-4">
                      <div className="flex flex-col gap-2">
                        <label htmlFor="manual-rate" className="text-sm font-medium">Establecer manualmente</label>
                        <div className="flex gap-2">
                          <Input
                            id="manual-rate"
                            type="number"
                            step="0.01"
                            placeholder={bcvRate?.rate?.toString() || "0.00"}
                            className="h-9"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleManualBcvUpdate(parseFloat(e.currentTarget.value))
                              }
                            }}
                          />
                          <Button 
                            size="sm" 
                            onClick={(e) => {
                              const input = e.currentTarget.previousElementSibling as HTMLInputElement
                              handleManualBcvUpdate(parseFloat(input.value))
                            }}
                          >
                            OK
                          </Button>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">O también</span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={handleUpdateBcv}
                        disabled={isUpdatingBcv}
                      >
                        {isUpdatingBcv ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Actualizar desde BCV
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          }
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start gap-1 border-b border-border/40 pb-px mb-6 min-w-max">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-muted-foreground mr-2 self-end pb-2">Vista:</span>
            <TabsTrigger value="overview" className="gap-2">
              <TrendingUp className="h-3.5 w-3.5" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="pos" className="gap-2">
              <Calculator className="h-3.5 w-3.5" />
              Punto de Venta
            </TabsTrigger>
            <TabsTrigger value="inventory" className="gap-2">
              <Package className="h-3.5 w-3.5" />
              Inventario
            </TabsTrigger>
            <TabsTrigger value="sales" className="gap-2">
              <FileText className="h-3.5 w-3.5" />
              Ventas
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <History className="h-3.5 w-3.5" />
              Reportes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <BusinessEventsCalendar 
              events={businessEvents} 
              isLoading={isLoadingEvents}
              onDateClick={onDateClick}
              onEditEvent={handleEditEvent}
              onDeleteEvent={handleDeleteEvent}
            />

            <Dialog open={isAddEventOpen} onOpenChange={(open) => {
              setIsAddEventOpen(open)
              if (!open) {
                  setEditingEventId(null)
                  setNewEvent({
                    type: 'CUSTOM',
                    title: '',
                    description: '',
                    time: '12:00',
                    isFuture: true
                  })
                }
            }}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {editingEventId ? <Edit className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />}
                    {editingEventId ? 'Editar Evento' : 'Añadir Evento al Calendario'}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedDate && format(selectedDate, "PPPP", { locale: es })}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right font-bold text-xs uppercase">Tipo</Label>
                    <Select 
                      value={newEvent.type} 
                      onValueChange={(v) => setNewEvent({...newEvent, type: v})}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CUSTOM">Evento Personalizado</SelectItem>
                        <SelectItem value="ALERT">Alerta / Recordatorio</SelectItem>
                        <SelectItem value="SALE">Venta Manual</SelectItem>
                        <SelectItem value="REQUIREMENT">Requerimiento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right font-bold text-xs uppercase">Título</Label>
                    <Input
                      id="title"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                      placeholder="Ej: Reunión con proveedor"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right font-bold text-xs uppercase">Detalles</Label>
                    <Input
                      id="description"
                      value={newEvent.description}
                      onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                      placeholder="Descripción del evento"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="time" className="text-right font-bold text-xs uppercase">Hora</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                      className="col-span-3"
                    />
                  </div>
                  <div className="flex items-center space-x-2 ml-[100px]">
                    <Checkbox 
                      id="isFuture" 
                      checked={newEvent.isFuture}
                      onCheckedChange={(checked) => setNewEvent({...newEvent, isFuture: !!checked})}
                    />
                    <Label htmlFor="isFuture" className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Recibir alerta en la bandeja de notificaciones
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddEventOpen(false)}>Cancelar</Button>
                  <Button onClick={handleAddEvent}>
                    {editingEventId ? 'Actualizar Evento' : 'Guardar Evento'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-blue-100 shrink-0">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate uppercase">Total Ventas (Bs)</p>
                      <p className="text-xl sm:text-2xl font-bold truncate">Bs {formatBS(totals.totalBs)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-green-100 shrink-0">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate uppercase">Ganancia (Bs)</p>
                      <p className="text-xl sm:text-2xl font-bold text-green-600 truncate">Bs {formatBS(totals.profitBs)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-purple-100 shrink-0">
                      <Package className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate uppercase">Productos</p>
                      <p className="text-xl sm:text-2xl font-bold truncate">{products.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="overflow-hidden">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-yellow-100 shrink-0">
                      <AlertTriangle className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate uppercase">Stock Bajo</p>
                      <p className="text-xl sm:text-2xl font-bold truncate">{products.filter(p => p.stock < 10).length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    Resumen de Venta Actual
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Inversión (USD)</span>
                        <p className="text-lg font-semibold">${formatUSD(totals.totalCostUSD)}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Ventas (USD)</span>
                        <p className="text-lg font-semibold">${formatUSD(totals.totalUSD)}</p>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t space-y-3">
                      <div className="flex justify-between items-center bg-muted/30 p-3 rounded-lg">
                        <span className="text-sm font-bold text-muted-foreground uppercase">Total Bolívares</span>
                        <span className="font-black text-xl text-primary">Bs {formatBS(totals.totalBs)}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 px-3">
                        <span className="text-sm font-bold text-muted-foreground uppercase">Ganancia Bs</span>
                        <span className="font-bold text-green-600">Bs {formatBS(totals.profitBs)}</span>
                      </div>
                      <div className="flex justify-between items-center p-2 px-3">
                        <span className="text-sm font-bold text-muted-foreground uppercase">Margen Promedio</span>
                        <Badge variant="outline" className="font-bold border-primary/20 text-primary">
                          {totals.totalCostUSD > 0 ? formatUSD((totals.profitUSD / totals.totalCostUSD) * 100).replace(/\.00$/, '') : 0}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Estado del Inventario
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {products.slice(0, 5).map(product => (
                      <div key={product.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="text-sm font-bold truncate">{product.name}</span>
                          <span className="text-[10px] text-muted-foreground font-medium">SKU: {product.sku}</span>
                        </div>
                        <Badge 
                          className="shrink-0 h-8 flex items-center justify-center min-w-[90px] font-bold"
                          variant={product.stock < 10 ? "destructive" : product.stock < 20 ? "secondary" : "default"}
                        >
                          {product.stock} und
                        </Badge>
                      </div>
                    ))}
                    {products.length > 5 && (
                      <Button variant="ghost" className="w-full text-xs font-bold text-primary hover:text-primary/80" onClick={() => setActiveTab("inventory")}>
                        Ver todo el inventario
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pos" className="space-y-6 mt-6">
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold">Productos Disponibles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                      {products.map(product => (
                        <div key={product.id} className="p-4 border rounded-xl hover:border-primary/50 transition-all bg-card shadow-sm flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0">
                                <p className="font-bold text-base truncate">{product.name}</p>
                                <p className="text-[10px] text-muted-foreground font-medium tracking-tight">SKU: {product.sku}</p>
                              </div>
                              <Badge 
                                className="shrink-0 text-[10px] font-bold"
                                variant={product.stock < 10 ? "destructive" : "secondary"}
                              >
                                {product.stock} und
                              </Badge>
                            </div>
                            <div className="mt-4 p-3 bg-muted/20 rounded-lg flex justify-between items-center">
                              <div className="space-y-0.5">
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Precio Venta</p>
                                <div className="flex items-baseline gap-1">
                                  <p className="font-black text-lg text-green-600">${formatUSD(product.price)}</p>
                                  <p className="text-[10px] text-muted-foreground font-medium">≈ Bs {formatBS(product.price * bcvRate.rate)}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <Button
                            className="w-full mt-4 h-11 md:h-10 font-bold gap-2 shadow-sm"
                            size="default"
                            onClick={() => addToCart(product)}
                            disabled={product.stock === 0}
                          >
                            <Plus className="h-5 w-5" />
                            Agregar
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card className="sticky top-4">
                  <CardHeader className="pb-2 border-b">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg font-bold">Carrito de Venta</CardTitle>
                      <Badge variant="secondary" className="font-bold">{cart.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="max-h-[50vh] overflow-y-auto p-4 space-y-4">
                      {cart.length === 0 ? (
                        <div className="text-center py-10 space-y-2">
                          <Package className="h-10 w-10 mx-auto text-muted-foreground/30" />
                          <p className="text-sm text-muted-foreground font-medium">No hay productos en el carrito</p>
                        </div>
                      ) : (
                        cart.map(item => (
                          <div key={item.product.id} className="flex flex-col gap-3 pb-4 border-b last:border-0">
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-bold truncate leading-tight">{item.product.name}</p>
                                <p className="text-[11px] font-black text-green-600 mt-1">
                                  ${formatUSD(item.product.price * item.quantity)} 
                                  <span className="text-muted-foreground font-medium ml-1">
                                    (Bs {formatBS(item.product.price * item.quantity * bcvRate.rate)})
                                  </span>
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                                onClick={() => removeFromCart(item.product.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 md:h-8 md:w-8 shrink-0 border-primary/20"
                                onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateCartQuantity(item.product.id, parseInt(e.target.value))}
                                className="h-9 md:h-8 text-center font-bold text-sm w-full"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 md:h-8 md:w-8 shrink-0 border-primary/20"
                                onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    {cart.length > 0 && (
                      <div className="p-4 bg-muted/30 space-y-4 rounded-b-xl border-t">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            <span>Subtotal USD</span>
                            <span>${formatUSD(totals.totalUSD)}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-muted-foreground/10">
                            <span className="text-sm font-black text-primary uppercase">Total Bolívares</span>
                            <span className="text-xl font-black text-primary">Bs {formatBS(totals.totalBs)}</span>
                          </div>
                        </div>
                        <Button 
                          className="w-full h-12 md:h-11 font-black text-base shadow-lg shadow-primary/20 gap-2"
                          onClick={processSale}
                        >
                          <DollarSign className="h-5 w-5" />
                          PROCESAR VENTA
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6 mt-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Inventario con Costos
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 sm:px-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Producto</th>
                        <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden lg:table-cell">SKU</th>
                        <th className="text-right p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden sm:table-cell">Stock</th>
                        <th className="text-right p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden xl:table-cell">Costo Compra</th>
                        <th className="text-right p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden lg:table-cell">Costo Total</th>
                        <th className="text-right p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Precio Venta</th>
                        <th className="text-center p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden md:table-cell">Margen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(product => (
                        <tr key={product.id} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="p-4">
                            <div className="flex flex-col min-w-[120px]">
                              <span className="font-bold text-sm leading-tight">{product.name}</span>
                              <span className="text-[10px] text-muted-foreground lg:hidden mt-1 font-medium">SKU: {product.sku}</span>
                              <div className="flex items-center gap-2 sm:hidden mt-2">
                                <Badge variant={product.stock < 10 ? "destructive" : "secondary"} className="text-[9px] h-5 px-1.5 font-bold">
                                  Stock: {product.stock}
                                </Badge>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-muted-foreground hidden lg:table-cell font-medium text-sm">{product.sku}</td>
                          <td className="p-4 text-right hidden sm:table-cell">
                            <Badge variant={product.stock < 10 ? "destructive" : "secondary"} className="font-bold">
                              {product.stock}
                            </Badge>
                          </td>
                          <td className="p-4 text-right hidden xl:table-cell font-medium text-sm">${formatUSD(product.purchasePrice)}</td>
                          <td className="p-4 text-right hidden lg:table-cell font-bold text-sm">
                            ${formatUSD(product.purchasePrice)}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-black text-primary text-base">${formatUSD(product.price)}</span>
                              <span className="text-[9px] text-green-600 font-bold md:hidden mt-1 uppercase tracking-tighter">
                                {Number(product.profitMargin * 100).toFixed(0)}% ganancia
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-center hidden md:table-cell">
                            <Badge variant="outline" className="font-black border-primary/20 text-primary bg-primary/5">
                              {Number(product.profitMargin * 100).toFixed(0)}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales" className="space-y-6 mt-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold">Historial de Ventas</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {sales.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground font-medium">No hay ventas registradas</p>
                    </div>
                  ) : (
                    sales.map(sale => (
                      <div key={sale.id} className="p-4 border rounded-xl hover:bg-muted/30 transition-colors shadow-sm bg-card">
                        <div className="flex justify-between items-start gap-3">
                          <div className="min-w-0">
                            <p className="font-black text-sm uppercase tracking-tight truncate">{sale.saleNumber}</p>
                            <p className="text-[10px] text-muted-foreground font-medium mt-1">
                              {new Date(sale.createdAt).toLocaleString('es-VE', { 
                                day: '2-digit', 
                                month: '2-digit', 
                                year: '2-digit', 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: true 
                              })}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-black text-lg text-primary leading-tight">Bs {formatBS(sale.totalBs)}</p>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <TrendingUp className="h-3 w-3 text-green-600" />
                              <p className="text-[10px] text-green-600 font-black uppercase">
                                +Bs {formatBS(sale.realProfit)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6 mt-6">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
              <Card 
                className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-blue-500 group"
                onClick={() => handleGenerateReport("Ventas")}
              >
                <CardContent className="p-6 text-center">
                  <div className="bg-blue-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <FileText className="h-6 w-6 text-blue-500" />
                  </div>
                  <h3 className="font-bold text-sm mb-2">Ventas</h3>
                  <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                    Detalle de ventas y ganancias por producto
                  </p>
                </CardContent>
              </Card>
              <Card 
                className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-green-500 group"
                onClick={() => handleGenerateReport("Inventario")}
              >
                <CardContent className="p-6 text-center">
                  <div className="bg-green-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Package className="h-6 w-6 text-green-500" />
                  </div>
                  <h3 className="font-bold text-sm mb-2">Inventario</h3>
                  <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                    Estado actual, valores y alertas de stock
                  </p>
                </CardContent>
              </Card>
              <Card 
                className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-purple-500 group"
                onClick={() => handleGenerateReport("Financiero")}
              >
                <CardContent className="p-6 text-center">
                  <div className="bg-purple-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-6 w-6 text-purple-500" />
                  </div>
                  <h3 className="font-bold text-sm mb-2">Financiero</h3>
                  <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">
                    Resumen de ingresos y métricas globales
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold">Generar Reporte Personalizado</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-6">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Fecha Inicio</label>
                    <Input 
                      type="date" 
                      className="h-11 font-medium" 
                      value={reportDates.start}
                      onChange={(e) => setReportDates(prev => ({ ...prev, start: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Fecha Fin</label>
                    <Input 
                      type="date" 
                      className="h-11 font-medium" 
                      value={reportDates.end}
                      onChange={(e) => setReportDates(prev => ({ ...prev, end: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      className="w-full h-11 font-black text-sm shadow-lg shadow-primary/20 gap-2"
                      onClick={() => handleGenerateReport("Personalizado")}
                    >
                      <Download className="h-4 w-4" />
                      GENERAR REPORTE
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={confirmConfig.open} onOpenChange={(val) => setConfirmConfig({ ...confirmConfig, open: val })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmConfig.variant === "destructive" ? (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              )}
              {confirmConfig.title}
            </DialogTitle>
            <DialogDescription className="pt-2 text-base">
              {confirmConfig.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setConfirmConfig({ ...confirmConfig, open: false })}
            >
              Cancelar
            </Button>
            <Button 
              variant={confirmConfig.variant || "default"}
              onClick={() => {
                confirmConfig.onConfirm();
                setConfirmConfig({ ...confirmConfig, open: false });
              }}
            >
              {confirmConfig.confirmText || "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
