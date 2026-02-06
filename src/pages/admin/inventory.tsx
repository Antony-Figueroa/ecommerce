import { useState, useEffect } from "react"
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

/*
const demoInventory: InventoryItem[] = [
  { id: "1", productName: "Paracetamol 500mg", sku: "PAR-001", currentStock: 45, minStock: 20, maxStock: 100, unitCost: 5.50, lastRestocked: "2026-02-01", category: "Analgesicos", status: "normal" },
  { id: "2", productName: "Ibuprofeno 400mg", sku: "IBU-002", currentStock: 8, minStock: 15, maxStock: 80, unitCost: 8.75, lastRestocked: "2026-01-20", category: "Analgesicos", status: "low" },
  { id: "3", productName: "Amoxicilina 500mg", sku: "AMO-003", currentStock: 3, minStock: 10, maxStock: 50, unitCost: 12.00, lastRestocked: "2026-01-15", category: "Antibioticos", status: "critical" },
  { id: "4", productName: "Vitamina C 1000mg", sku: "VIT-004", currentStock: 120, minStock: 30, maxStock: 100, unitCost: 15.00, lastRestocked: "2026-02-05", category: "Vitaminas", status: "overstock" },
  { id: "5", productName: "Omeprazol 20mg", sku: "OME-005", currentStock: 25, minStock: 20, maxStock: 80, unitCost: 9.50, lastRestocked: "2026-02-02", category: "Gastrointestinal", status: "normal" },
  { id: "6", productName: "Metformina 500mg", sku: "MET-006", currentStock: 12, minStock: 15, maxStock: 60, unitCost: 7.25, lastRestocked: "2026-01-25", category: "Diabetes", status: "low" },
  { id: "7", productName: "Aspirina 100mg", sku: "ASP-007", currentStock: 0, minStock: 10, maxStock: 50, unitCost: 4.00, lastRestocked: "2026-01-10", category: "Analgesicos", status: "critical" },
]

const demoAdjustments: InventoryAdjustment[] = [
  { id: "1", productId: "1", productName: "Paracetamol 500mg", type: "entry", quantity: 50, reason: "Reposición semanal", previousStock: 45, newStock: 95, createdAt: "2026-02-10 10:30", createdBy: "Admin" },
  { id: "2", productId: "2", productName: "Ibuprofeno 400mg", type: "exit", quantity: 12, reason: "Venta directa", previousStock: 20, newStock: 8, createdAt: "2026-02-10 09:15", createdBy: "Admin" },
  { id: "3", productId: "3", productName: "Amoxicilina 500mg", type: "adjustment", quantity: -2, reason: "Inventario físico", previousStock: 5, newStock: 3, createdAt: "2026-02-09 16:45", createdBy: "Admin" },
]
*/

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
        minStock: 10, // Default min stock
        maxStock: 100, // Default max stock
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
    }
  }

  const handleAdjustment = async () => {
    if (!selectedProduct || !adjustmentQuantity || parseInt(adjustmentQuantity) <= 0) return

    const quantity = parseInt(adjustmentQuantity)
    try {
      // In a real scenario, we would have a specific inventory adjustment API
      // For now, we'll update the product stock directly
      let newStock: number
      if (adjustmentType === "entry") {
        newStock = selectedProduct.currentStock + quantity
      } else if (adjustmentType === "exit") {
        newStock = Math.max(0, selectedProduct.currentStock - quantity)
      } else {
        newStock = quantity
      }

      await api.updateProduct(selectedProduct.id, { stock: newStock })
      
      // Refresh inventory
      await fetchInventory()
      setShowAdjustDialog(false)
      setAdjustmentQuantity("")
      setAdjustmentReason("")
      toast({
        title: "Inventario actualizado",
        description: "El stock se ha actualizado correctamente",
      })
    } catch (error) {
      console.error("Error updating stock:", error)
      toast({
        title: "Error",
        description: "Error al actualizar el stock",
        variant: "destructive",
      })
    }
  }

  const filteredInventory = inventory
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

  const stats = {
    totalItems: inventory.length,
    lowStock: inventory.filter(i => i.status === "low").length,
    criticalStock: inventory.filter(i => i.status === "critical").length,
    overstock: inventory.filter(i => i.status === "overstock").length,
    totalValue: inventory.reduce((sum, i) => sum + i.currentStock * i.unitCost, 0),
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      normal: { label: "Normal", class: "bg-green-100 text-green-800" },
      low: { label: "Stock Bajo", class: "bg-yellow-100 text-yellow-800" },
      critical: { label: "Critico", class: "bg-red-100 text-red-800" },
      overstock: { label: "Sobrestock", class: "bg-blue-100 text-blue-800" },
    }
    return statusMap[status] || { label: status, class: "bg-gray-100 text-gray-800" }
  }

  const getStockIndicator = (current: number, _min: number, max: number) => {
    const percentage = (current / max) * 100
    if (percentage < 20) return "bg-red-500"
    if (percentage < 40) return "bg-yellow-500"
    if (percentage > 100) return "bg-blue-500"
    return "bg-green-500"
  }

  const openAdjustDialog = (product: InventoryItem, type: "entry" | "exit" | "adjustment") => {
    setSelectedProduct(product)
    setAdjustmentType(type)
    setAdjustmentQuantity("")
    setAdjustmentReason("")
    setShowAdjustDialog(true)
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

  return (
    <AdminLayout title="Inventario">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">Monitorea y gestiona el inventario de tu farmacia</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowHistoryDialog(true)}>
              <History className="h-4 w-4 mr-2" />
              Historial
            </Button>
            <Button>
              <Package className="h-4 w-4 mr-2" />
              Generar Reporte
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-gray-100">
                  <Package className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total SKUs</p>
                  <p className="text-2xl font-bold">{stats.totalItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-yellow-100">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stock Bajo</p>
                  <p className="text-2xl font-bold">{stats.lowStock}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-red-100">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Critico</p>
                  <p className="text-2xl font-bold">{stats.criticalStock}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100">
                  <ArrowUp className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sobrestock</p>
                  <p className="text-2xl font-bold">{stats.overstock}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100">
                  <DollarIcon className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor de Inventario</p>
                  <p className="text-2xl font-bold">${formatUSD(stats.totalValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Sort */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por producto, SKU o categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" onClick={() => { setSortBy("stock"); setSortOrder(sortOrder === "asc" ? "desc" : "asc") }}>
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Ordenar por stock
          </Button>
        </div>

        {/* Inventory Table */}
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium">Producto</th>
                  <th className="text-left p-4 font-medium">SKU</th>
                  <th className="text-left p-4 font-medium">Categoria</th>
                  <th className="text-left p-4 font-medium">Stock</th>
                  <th className="text-left p-4 font-medium">Estado</th>
                  <th className="text-right p-4 font-medium">Valor</th>
                  <th className="text-center p-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item) => {
                  const status = getStatusBadge(item.status)
                  return (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <p className="font-medium">{item.productName}</p>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{item.sku}</td>
                      <td className="p-4">
                        <Badge variant="outline">{item.category}</Badge>
                      </td>
                      <td className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.currentStock}</span>
                            <span className="text-sm text-muted-foreground">/ {item.maxStock}</span>
                          </div>
                          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getStockIndicator(item.currentStock, item.minStock, item.maxStock)}`}
                              style={{ width: `${Math.min(100, (item.currentStock / item.maxStock) * 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">Min: {item.minStock}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={status.class}>{status.label}</Badge>
                      </td>
                      <td className="p-4 text-right">
                        <p className="font-semibold">${formatUSD(item.currentStock * item.unitCost)}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAdjustDialog(item, "entry")}
                            title="Entrada de stock"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Entrada
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAdjustDialog(item, "exit")}
                            title="Salida de stock"
                          >
                            <Minus className="h-3 w-3 mr-1" />
                            Salida
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Adjustment Dialog */}
        <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {adjustmentType === "entry" && "Entrada de Stock"}
                {adjustmentType === "exit" && "Salida de Stock"}
                {adjustmentType === "adjustment" && "Ajuste de Inventario"}
              </DialogTitle>
              <DialogDescription>
                {adjustmentType === "entry" && "Ingresa la cantidad de unidades a agregar al inventario."}
                {adjustmentType === "exit" && "Ingresa la cantidad de unidades a retirar del inventario."}
                {adjustmentType === "adjustment" && "Ingresa el nuevo stock total para este producto."}
              </DialogDescription>
            </DialogHeader>
            {selectedProduct && (
              <div className="space-y-4 py-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-medium">{selectedProduct.productName}</p>
                  <p className="text-sm text-muted-foreground">
                    Stock actual: <span className="font-bold">{selectedProduct.currentStock}</span> unidades
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">
                    {adjustmentType === "entry" && "Cantidad a agregar"}
                    {adjustmentType === "exit" && "Cantidad a restar"}
                    {adjustmentType === "adjustment" && "Nuevo stock total"}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={adjustmentQuantity || ""}
                    onChange={(e) => setAdjustmentQuantity(e.target.value)}
                    placeholder="0"
                    className="mt-1"
                  />
{adjustmentType !== "adjustment" && adjustmentQuantity && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Nuevo stock: {adjustmentType === "entry"
                          ? selectedProduct.currentStock + (parseInt(adjustmentQuantity) || 0)
                          : Math.max(0, selectedProduct.currentStock - (parseInt(adjustmentQuantity) || 0))
                        }
                      </p>
                    )}
                </div>

                <div>
                  <label className="text-sm font-medium">Motivo / Razón</label>
                  <Input
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder={
                      adjustmentType === "entry" ? "Reposición, compra, devolución..." :
                      adjustmentType === "exit" ? "Venta directa, daño, robo..." :
                      "Inventario físico, corrección..."
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdjustDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAdjustment}>
                {adjustmentType === "entry" && "Agregar Stock"}
                {adjustmentType === "exit" && "Restar Stock"}
                {adjustmentType === "adjustment" && "Aplicar Ajuste"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* History Dialog */}
        <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Historial de Ajustes</DialogTitle>
              <DialogDescription>
                Visualiza todos los movimientos de inventario realizados.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {adjustments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay ajustes registrados</p>
              ) : (
                <div className="space-y-3">
                  {adjustments.map((adjustment) => (
                    <div key={adjustment.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{adjustment.productName}</p>
                            <Badge variant={
                              adjustment.type === "entry" ? "default" :
                              adjustment.type === "exit" ? "destructive" : "secondary"
                            }>
                              {adjustment.type === "entry" && <Plus className="h-3 w-3 mr-1" />}
                              {adjustment.type === "exit" && <Minus className="h-3 w-3 mr-1" />}
                              {adjustment.type === "entry" ? "Entrada" : adjustment.type === "exit" ? "Salida" : "Ajuste"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{adjustment.reason}</p>
                          <p className="text-xs text-muted-foreground mt-1">{formatDate(adjustment.createdAt)} • {adjustment.createdBy}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${adjustment.quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                            {adjustment.quantity > 0 ? "+" : ""}{adjustment.quantity}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {adjustment.previousStock} → {adjustment.newStock}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}

function DollarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}
