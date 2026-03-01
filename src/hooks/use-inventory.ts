import { useState, useEffect, useMemo, useCallback } from "react"
import { api } from "@/lib/api"

export interface InventoryItem {
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

export interface InventoryAdjustment {
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

interface UseInventoryOptions {
  initialLimit?: number
}

interface InventoryStats {
  totalItems: number
  lowStock: number
  criticalStock: number
  overstock: number
  normalStock: number
  totalValue: number
  valueAtRisk: number
  avgStockLevel: number
  movements: number
}

export function useInventory(options: UseInventoryOptions = {}) {
  const { initialLimit = 100 } = options

  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true)
      const [productsRes, logsRes] = await Promise.all([
        api.getAdminProducts({ limit: initialLimit }),
        api.getInventoryLogs({ limit: 50 })
      ])

      const mappedInventory: InventoryItem[] = productsRes.products.map((p: any) => {
        const currentStock = p.stock || 0
        const minStock = p.minStock || 5
        const maxStock = p.maxStock || 100
        let status: InventoryItem["status"] = "normal"
        
        if (currentStock <= 0) status = "critical"
        else if (currentStock < minStock) status = "low"
        else if (currentStock > maxStock) status = "overstock"

        return {
          id: p.id,
          productName: p.name,
          sku: p.sku || p.productCode || "N/A",
          currentStock,
          minStock,
          maxStock,
          unitCost: Number(p.purchasePrice) || 0,
          lastRestocked: p.updatedAt || "",
          category: p.categories?.[0]?.name || "Sin categoría",
          status
        }
      })

      const mappedAdjustments: InventoryAdjustment[] = (logsRes.logs || []).map((log: any) => ({
        id: log.id,
        productId: log.productId,
        productName: log.productName || "Producto",
        type: log.changeType as "entry" | "exit" | "adjustment",
        quantity: Math.abs(log.changeAmount),
        reason: log.reason || "",
        previousStock: log.previousStock,
        newStock: log.newStock,
        createdAt: log.createdAt,
        createdBy: log.userName || "Sistema"
      }))

      setInventory(mappedInventory)
      setAdjustments(mappedAdjustments)
      setError(null)
    } catch (err) {
      setError("Error al cargar inventario")
      console.error("Error fetching inventory:", err)
    } finally {
      setLoading(false)
    }
  }, [initialLimit])

  const updateProductStock = useCallback(async (productId: string, newStock: number) => {
    await api.updateProductStock(productId, newStock)
    await fetchInventory()
  }, [fetchInventory])

  const stats = useMemo((): InventoryStats => {
    const totalItems = inventory.length
    const lowStock = inventory.filter(i => i.status === "low").length
    const criticalStock = inventory.filter(i => i.status === "critical").length
    const overstock = inventory.filter(i => i.status === "overstock").length
    const normalStock = inventory.filter(i => i.status === "normal").length
    const totalValue = inventory.reduce((sum, i) => sum + i.currentStock * i.unitCost, 0)
    const valueAtRisk = inventory
      .filter(i => i.status === "critical" || i.status === "low")
      .reduce((sum, i) => sum + i.currentStock * i.unitCost, 0)
    const avgStockLevel = totalItems
      ? inventory.reduce((sum, i) => sum + (i.currentStock / i.maxStock) * 100, 0) / totalItems
      : 0
    const movements = adjustments.length
    
    return { totalItems, lowStock, criticalStock, overstock, normalStock, totalValue, valueAtRisk, avgStockLevel, movements }
  }, [inventory, adjustments])

  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  return {
    inventory,
    adjustments,
    loading,
    error,
    stats,
    fetchInventory,
    updateProductStock
  }
}

export function useInventoryFilters(inventory: InventoryItem[]) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"stock" | "name" | "category">("stock")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  const filteredInventory = useMemo(() => {
    return inventory
      .filter(item => {
        const matchesSearch = 
          item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === "all" || item.status === statusFilter
        return matchesSearch && matchesStatus
      })
      .sort((a, b) => {
        let comparison = 0
        if (sortBy === "stock") comparison = a.currentStock - b.currentStock
        else if (sortBy === "name") comparison = a.productName.localeCompare(b.productName)
        else if (sortBy === "category") comparison = a.category.localeCompare(b.category)
        return sortOrder === "asc" ? comparison : -comparison
      })
  }, [inventory, searchTerm, sortBy, sortOrder, statusFilter])

  const paginatedInventory = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredInventory.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredInventory, currentPage])

  const totalPages = Math.ceil(filteredInventory.length / ITEMS_PER_PAGE)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, sortBy, sortOrder, statusFilter])

  return {
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    ITEMS_PER_PAGE,
    filteredInventory,
    paginatedInventory,
    totalPages
  }
}
