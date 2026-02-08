import { useState, useEffect, useMemo } from "react"
import {
  Package,
  AlertTriangle,
  TrendingDown,
  ArrowUpDown,
  ArrowUp,
  Search,
  Plus,
  Minus,
  History,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { AdminLayout } from "@/components/layout/admin-layout"
import { formatUSD } from "@/lib/utils"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"

interface InventoryItem {
  id: string
  productName: string
  sku: string
  currentStock: number
  minStock: number
  maxStock: number
  unitCost: number
  lastRestocked: string
  category: string
  status: "normal" | "low" | "critical" | "overstock"
}

interface InventoryAdjustment {
  id: string
  productId: string
  productName: string
  type: "entry" | "exit" | "adjustment"
  quantity: number
  reason: string
  previousStock: number
  newStock: number
  createdAt: string
  createdBy: string
}

export function AdminInventoryPage() {
  const { toast } = useToast()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"stock" | "name" | "category">("stock")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [showAdjustDialog, setShowAdjustDialog] = useState(false)
  const [showHistoryDialog, setShowHistoryDialog] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null)
  const [adjustmentType, setAdjustmentType] = useState<"entry" | "exit" | "adjustment">("entry")
  const [adjustmentQuantity, setAdjustmentQuantity] = useState("")
  const [adjustmentReason, setAdjustmentReason] = useState("")

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      const [productsRes, logsRes] = await Promise.all([
        api.getAdminProducts({ limit: 100 }),
        api.getInventoryLogs({ limit: 50 })
      ])

      const mappedInventory: InventoryItem[] = productsRes.products.map((p: any) => ({
        id: p.id,
        productName: p.name,
        sku: p.sku || "N/A",
        currentStock: p.stock,
        minStock: 10,
        maxStock: 100,
        unitCost: p.price,
        lastRestocked: p.updatedAt,
        category: p.categories && p.categories.length > 0 
          ? p.categories.map((c: any) => c.name).join(", ") 
          : "Sin Categoría",
        status: p.stock === 0 ? "critical" : p.stock < 10 ? "low" : p.stock > 100 ? "overstock" : "normal"
      }))

      setInventory(mappedInventory)
      
      const mappedAdjustments: InventoryAdjustment[] = logsRes.logs.map((log: any) => ({
        id: log.id,
        productId: log.productId,
        productName: log.productName || "Producto",
        type: log.type === "ENTRY" ? "entry" : log.type === "EXIT" ? "exit" : "adjustment",
        quantity: log.quantity,
        reason: log.reason,
        previousStock: log.previousStock,
        newStock: log.newStock,
        createdAt: log.createdAt,
        createdBy: log.createdBy || "Admin"
      }))
      
      setAdjustments(mappedAdjustments)
    } catch (error) {
      console.error("Error fetching inventory:", error)
      toast({
        title: "Error de Sincronización",
        description: "No se pudo conectar con el almacén central.",
        variant: "destructive"
      })
    }
  }

  const handleAdjustment = async () => {
    if (!selectedProduct || !adjustmentQuantity || parseInt(adjustmentQuantity) <= 0) return

    const quantity = parseInt(adjustmentQuantity)
    try {
      let newStock: number
      if (adjustmentType === "entry") {
        newStock = selectedProduct.currentStock + quantity
      } else if (adjustmentType === "exit") {
        newStock = Math.max(0, selectedProduct.currentStock - quantity)
      } else {
        newStock = quantity
      }

      await api.updateProduct(selectedProduct.id, { stock: newStock })
      
      await fetchInventory()
      setShowAdjustDialog(false)
      setAdjustmentQuantity("")
      setAdjustmentReason("")
      toast({
        title: "Inventario Optimizado",
        description: `Stock de ${selectedProduct.productName} actualizado a ${newStock} unidades.`,
      })
    } catch (error) {
      console.error("Error updating stock:", error)
      toast({
        title: "Fallo en la Operación",
        description: "No se pudo procesar el ajuste de inventario.",
        variant: "destructive",
      })
    }
  }

  const filteredInventory = useMemo(() => {
    return inventory
      .filter(item =>
        item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        let comparison = 0
        if (sortBy === "stock") comparison = a.currentStock - b.currentStock
        else if (sortBy === "name") comparison = a.productName.localeCompare(b.productName)
        else if (sortBy === "category") comparison = a.category.localeCompare(b.category)
        return sortOrder === "asc" ? comparison : -comparison
      })
  }, [inventory, searchTerm, sortBy, sortOrder])

  const stats = useMemo(() => ({
    totalItems: inventory.length,
    lowStock: inventory.filter(i => i.status === "low").length,
    criticalStock: inventory.filter(i => i.status === "critical").length,
    overstock: inventory.filter(i => i.status === "overstock").length,
    totalValue: inventory.reduce((sum, i) => sum + i.currentStock * i.unitCost, 0),
  }), [inventory])

  const getStatusConfig = (status: string) => {
    const statusMap: Record<string, { label: string; class: string; icon: any }> = {
      normal: { label: "Óptimo", class: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: Activity },
      low: { label: "Alerta Baja", class: "bg-amber-50 text-amber-600 border-amber-100", icon: AlertTriangle },
      critical: { label: "Crítico", class: "bg-rose-50 text-rose-600 border-rose-100", icon: TrendingDown },
      overstock: { label: "Excedente", class: "bg-sky-50 text-sky-600 border-sky-100", icon: ArrowUp },
    }
    return statusMap[status] || { label: status, class: "bg-slate-50 text-slate-600 border-slate-100", icon: Package }
  }

  const getStockIndicatorColor = (current: number, max: number) => {
    const percentage = (current / max) * 100
    if (percentage < 20) return "bg-rose-500"
    if (percentage < 40) return "bg-amber-500"
    if (percentage > 100) return "bg-sky-500"
    return "bg-primary"
  }

  const openAdjustDialog = (product: InventoryItem, type: "entry" | "exit" | "adjustment") => {
    setSelectedProduct(product)
    setAdjustmentType(type)
    setAdjustmentQuantity("")
    setAdjustmentReason("")
    setShowAdjustDialog(true)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <AdminLayout>
      <div className="space-y-8 p-6 font-sans selection:bg-primary/20 selection:text-primary">
        {/* Header - Warm & Professional */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-800 flex items-center gap-3">
              Gestión de Inventario
              <Package className="h-7 w-7 text-primary" />
            </h1>
            <p className="text-slate-500 font-medium text-sm flex items-center gap-2">
              Supervisa y optimiza el stock de tus productos de bienestar.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="h-11 border-slate-200 text-slate-600 hover:bg-white hover:border-primary hover:text-primary font-bold text-xs uppercase tracking-wider px-6 rounded-2xl transition-all shadow-sm"
              onClick={() => setShowHistoryDialog(true)}
            >
              <History className="mr-2 h-4 w-4" />
              Historial de Ajustes
            </Button>
            <Button className="h-11 bg-primary text-white hover:bg-primary/90 font-bold text-xs uppercase tracking-wider px-8 rounded-2xl transition-all shadow-lg shadow-primary/20">
              Exportar Reporte
            </Button>
          </div>
        </div>

        {/* Stats Grid - Nature Serena Palette */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
          {[
            { label: "Total Productos", value: stats.totalItems, icon: Package, color: "slate" },
            { label: "Stock Bajo", value: stats.lowStock, icon: AlertTriangle, color: "amber" },
            { label: "Crítico", value: stats.criticalStock, icon: TrendingDown, color: "rose" },
            { label: "Sobrestock", value: stats.overstock, icon: ArrowUp, color: "sky" },
            { label: "Valor Inventario", value: `$${formatUSD(stats.totalValue)}`, icon: Activity, color: "emerald", full: true }
          ].map((stat, i) => (
            <Card key={i} className={`border-0 shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all rounded-2xl ${stat.full ? 'col-span-2 md:col-span-1' : ''}`}>
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-primary/10 transition-colors">
                    <stat.icon className="h-5 w-5 text-slate-400 group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</p>
                    <p className="text-xl font-bold text-slate-800 tracking-tight">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar por nombre, SKU o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 pl-12 bg-white/50 dark:bg-muted/10 border-slate-200 dark:border-border/50 rounded-xl shadow-sm focus:ring-primary/20 transition-all text-sm"
            />
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto scrollbar-hide pb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-muted-foreground whitespace-nowrap">Ordenar:</span>
            <div className="flex bg-slate-100/50 dark:bg-muted/20 p-1 rounded-xl border border-slate-200/50 dark:border-border/50 shadow-sm h-11 items-center px-1 shrink-0">
              <button
                onClick={() => { setSortBy("stock"); setSortOrder(sortOrder === "asc" ? "desc" : "asc") }}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-all duration-300 rounded-lg whitespace-nowrap group ${
                  sortBy === "stock" 
                    ? "bg-white dark:bg-card text-primary shadow-md scale-[1.02]" 
                    : "text-muted-foreground hover:text-primary hover:bg-white/50 dark:hover:bg-muted/50"
                }`}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                Stock
                {sortBy === "stock" && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1 bg-slate-200 dark:bg-muted text-[10px]">{sortOrder === "asc" ? "↑" : "↓"}</Badge>
                )}
              </button>
              <button
                onClick={() => { setSortBy("name"); setSortOrder(sortOrder === "asc" ? "desc" : "asc") }}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-all duration-300 rounded-lg whitespace-nowrap group ${
                  sortBy === "name" 
                    ? "bg-white dark:bg-card text-primary shadow-md scale-[1.02]" 
                    : "text-muted-foreground hover:text-primary hover:bg-white/50 dark:hover:bg-muted/50"
                }`}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                Nombre
                {sortBy === "name" && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1 bg-slate-200 dark:bg-muted text-[10px]">{sortOrder === "asc" ? "↑" : "↓"}</Badge>
                )}
              </button>
              <button
                onClick={() => { setSortBy("category"); setSortOrder(sortOrder === "asc" ? "desc" : "asc") }}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-all duration-300 rounded-lg whitespace-nowrap group ${
                  sortBy === "category" 
                    ? "bg-white dark:bg-card text-primary shadow-md scale-[1.02]" 
                    : "text-muted-foreground hover:text-primary hover:bg-white/50 dark:hover:bg-muted/50"
                }`}
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                Categoría
                {sortBy === "category" && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1 bg-slate-200 dark:bg-muted text-[10px]">{sortOrder === "asc" ? "↑" : "↓"}</Badge>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <Card className="border-0 shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-500 border-b border-slate-100">
                    <th className="text-left p-5 text-[10px] font-bold uppercase tracking-widest">Producto</th>
                    <th className="text-left p-5 text-[10px] font-bold uppercase tracking-widest">Categoría</th>
                    <th className="text-left p-5 text-[10px] font-bold uppercase tracking-widest">Nivel de Stock</th>
                    <th className="text-left p-5 text-[10px] font-bold uppercase tracking-widest">Estado</th>
                    <th className="text-right p-5 text-[10px] font-bold uppercase tracking-widest">Valor</th>
                    <th className="text-center p-5 text-[10px] font-bold uppercase tracking-widest">Acciones</th>
                  </tr>
                </thead>
                <motion.tbody 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="divide-y divide-slate-50"
                >
                  {filteredInventory.map((item) => {
                    const status = getStatusConfig(item.status)
                    return (
                      <motion.tr 
                        key={item.id} 
                        variants={itemVariants}
                        className="hover:bg-slate-50/30 transition-colors group"
                      >
                        <td className="p-5">
                          <p className="font-bold text-slate-800 tracking-tight group-hover:text-primary transition-colors">{item.productName}</p>
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">{item.sku}</p>
                        </td>
                        <td className="p-5">
                          <Badge variant="outline" className="rounded-full border-slate-100 font-bold text-[9px] uppercase tracking-widest bg-slate-50/50 text-slate-500">
                            {item.category}
                          </Badge>
                        </td>
                        <td className="p-5">
                          <div className="space-y-2 w-48">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                              <span className="text-slate-700">{item.currentStock} uds.</span>
                              <span className="text-slate-400">Máx: {item.maxStock}</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (item.currentStock / item.maxStock) * 100)}%` }}
                                className={`h-full rounded-full ${getStockIndicatorColor(item.currentStock, item.maxStock)}`}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-5">
                          <Badge className={`rounded-full border font-bold text-[9px] uppercase tracking-widest px-3 py-1 flex items-center gap-2 w-fit ${status.class}`}>
                            <status.icon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                        </td>
                        <td className="p-5 text-right">
                          <p className="font-bold text-slate-800 tracking-tight">${formatUSD(item.currentStock * item.unitCost)}</p>
                        </td>
                        <td className="p-5">
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 w-9 p-0 border-slate-200 hover:border-primary hover:text-primary rounded-xl transition-all shadow-sm"
                              onClick={() => openAdjustDialog(item, "entry")}
                              title="Aumentar Stock"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 w-9 p-0 border-slate-200 hover:border-rose-400 hover:text-rose-500 rounded-xl transition-all shadow-sm"
                              onClick={() => openAdjustDialog(item, "exit")}
                              title="Retirar Stock"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 w-9 p-0 border-slate-200 hover:border-primary hover:text-primary rounded-xl transition-all shadow-sm"
                              onClick={() => openAdjustDialog(item, "adjustment")}
                              title="Ajuste Manual"
                            >
                              <ArrowUpDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </motion.tbody>
              </table>
            </div>
            {filteredInventory.length === 0 && (
              <div className="p-16 text-center">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No se encontraron productos</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Adjustment Dialog - Warm Style */}
        <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
          <DialogContent className="rounded-3xl border-0 shadow-2xl p-8 sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-3">
                {adjustmentType === "entry" && "Entrada de Inventario"}
                {adjustmentType === "exit" && "Salida de Inventario"}
                {adjustmentType === "adjustment" && "Ajuste de Stock"}
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 font-medium pt-2">
                Actualiza los niveles de existencia para mantener el flujo de bienestar.
              </DialogDescription>
            </DialogHeader>
            {selectedProduct && (
              <div className="space-y-6 py-6">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-sm font-bold text-slate-800">{selectedProduct.productName}</p>
                  <p className="text-xs font-medium text-slate-500 mt-1">
                    Stock actual: <span className="text-primary font-bold">{selectedProduct.currentStock} unidades</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                    {adjustmentType === "entry" && "Cantidad a ingresar"}
                    {adjustmentType === "exit" && "Cantidad a retirar"}
                    {adjustmentType === "adjustment" && "Nuevo stock total"}
                  </label>
                  <Input
                    type="number"
                    value={adjustmentQuantity}
                    onChange={(e) => setAdjustmentQuantity(e.target.value)}
                    placeholder="0"
                    className="h-12 bg-white border-slate-200 focus:border-primary focus:ring-primary/10 rounded-xl text-lg font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Motivo del ajuste</label>
                  <Input
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder="Ej: Recepción de pedido, merma, corrección..."
                    className="h-12 bg-white border-slate-200 focus:border-primary focus:ring-primary/10 rounded-xl text-sm"
                  />
                </div>
              </div>
            )}
            <DialogFooter className="gap-3">
              <Button variant="outline" onClick={() => setShowAdjustDialog(false)} className="rounded-xl border-slate-200 font-bold text-xs uppercase tracking-wider h-11 px-6">
                Cancelar
              </Button>
              <Button onClick={handleAdjustment} className="rounded-xl bg-primary text-white hover:bg-primary/90 font-bold text-xs uppercase tracking-wider h-11 px-8 shadow-lg shadow-primary/20">
                Confirmar Ajuste
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* History Dialog - Warm Style */}
        <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
          <DialogContent className="rounded-3xl border-0 shadow-2xl p-0 sm:max-w-[700px] overflow-hidden">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-3">
                  Historial de Movimientos
                  <History className="h-6 w-6 text-primary" />
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500 font-medium pt-1">
                  Registro detallado de todas las operaciones de almacén recientes.
                </DialogDescription>
              </DialogHeader>
            </div>
            
            <div className="max-h-[500px] overflow-y-auto p-6 space-y-4">
              {adjustments.length > 0 ? (
                adjustments.map((adj) => (
                  <div key={adj.id} className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 hover:bg-slate-50/50 transition-colors group">
                    <div className={`p-2 rounded-xl ${
                      adj.type === 'entry' ? 'bg-emerald-50 text-emerald-500' : 
                      adj.type === 'exit' ? 'bg-rose-50 text-rose-500' : 
                      'bg-sky-50 text-sky-500'
                    }`}>
                      {adj.type === 'entry' ? <ArrowUpRight className="h-5 w-5" /> : 
                       adj.type === 'exit' ? <ArrowDownRight className="h-5 w-5" /> : 
                       <Activity className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors">{adj.productName}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(adj.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1 italic">"{adj.reason || 'Sin motivo especificado'}"</p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Cambio:</span>
                          <span className={`text-[10px] font-bold ${
                            adj.type === 'entry' ? 'text-emerald-500' : 
                            adj.type === 'exit' ? 'text-rose-500' : 
                            'text-sky-500'
                          }`}>
                            {adj.type === 'entry' ? '+' : adj.type === 'exit' ? '-' : ''}{adj.quantity} unidades
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Stock:</span>
                          <span className="text-[10px] font-bold text-slate-700">{adj.previousStock} → {adj.newStock}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Activity className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No hay registros de movimientos</p>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <Button onClick={() => setShowHistoryDialog(false)} className="rounded-xl bg-slate-800 text-white hover:bg-slate-900 font-bold text-xs uppercase tracking-wider h-11 px-8 transition-all">
                Cerrar Auditoría
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
