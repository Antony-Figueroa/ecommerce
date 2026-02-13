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
  CheckCircle2,
  Trash2,
  Edit2,
} from "lucide-react"
import { AdminPageHeader } from "@/components/admin/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { formatUSD, formatBS, cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { MultiSelect } from "@/components/ui/multi-select"
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

  interface Provider {
  id: string
  name: string
  country: string | null
  address: string | null
  createdAt?: string
  updatedAt?: string
  _count?: {
    batches: number
  }
}

interface ProviderFormData {
  name: string
  country: string
  address: string
}

interface ProviderErrors {
  name?: string
  country?: string
  address?: string
}

interface BatchProductItem {
  productId: string
  productName: string
  productCode?: string
  quantity: number
  soldQuantity: number
  unitCostUSD: number
  unitSaleUSD: number
  entryDate: string
  discounted?: boolean
  discountPercent?: number
  // Nuevos campos para gestión de inventario mejorada
  unitCostBCV?: number
  unitSaleBCV?: number
  profitUSD?: number
  profitBCV?: number
  markupPercent?: number
}

interface Batch {
  id: string
  code: string
  providerId?: string
  providerName?: string
  createdAt: string
  notes?: string
  products: BatchProductItem[]
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
  const [products, setProducts] = useState<any[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [showBatchDialog, setShowBatchDialog] = useState(false)
  const [showProviderDialog, setShowProviderDialog] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null)
  const [batchForm, setBatchForm] = useState({ code: "", providerId: "", notes: "" })
  const [batchItems, setBatchItems] = useState<BatchProductItem[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  // Helper para calcular precios y ganancias
  const calculateItemMetrics = (item: Partial<BatchProductItem>, rate: number) => {
    const costUSD = Number(item.unitCostUSD) || 0
    const saleUSD = Number(item.unitSaleUSD) || 0
    const qty = Number(item.quantity) || 0
    
    const costBCV = costUSD * rate
    const saleBCV = saleUSD * rate
    const profitUSD = (saleUSD - costUSD) * qty
    const profitBCV = profitUSD * rate
    const markup = costUSD > 0 ? ((saleUSD - costUSD) / costUSD) * 100 : 0

    return {
      unitCostBCV: costBCV,
      unitSaleBCV: saleBCV,
      profitUSD,
      profitBCV,
      markupPercent: markup
    }
  }
  const [providerForm, setProviderForm] = useState<ProviderFormData>({ name: "", country: "", address: "" })
  const [providerErrors, setProviderErrors] = useState<ProviderErrors>({})
  const [savingProvider, setSavingProvider] = useState(false)
  const [bcvRate, setBcvRate] = useState(0)
  
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null)
  const [showEditBatchDialog, setShowEditBatchDialog] = useState(false)
  const [editBatchForm, setEditBatchForm] = useState({ providerId: "", notes: "" })
  const [editBatchItems, setEditBatchItems] = useState<BatchProductItem[]>([])
  const [isUpdatingBatch, setIsUpdatingBatch] = useState(false)

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

  const hasBatchChanges = () => {
    return batchForm.code !== "" || batchForm.providerId !== "" || batchForm.notes !== "" || batchItems.length > 0
  }

  const hasProviderChanges = () => {
    return providerForm.name !== "" || providerForm.country !== "" || providerForm.address !== ""
  }

  const hasAdjustChanges = () => {
    return adjustmentQuantity !== "" || adjustmentReason !== ""
  }

  const handleCloseBatchModal = () => {
    if (hasBatchChanges()) {
      confirmAction({
        title: "¿Salir sin guardar?",
        description: "Tienes cambios sin guardar en el lote. ¿Estás seguro de que deseas salir?",
        confirmText: "Salir",
        variant: "destructive",
        onConfirm: () => {
          setShowBatchDialog(false)
          setBatchForm({ code: "", providerId: "", notes: "" })
          setBatchItems([])
        }
      })
    } else {
      setShowBatchDialog(false)
    }
  }

  const handleCloseProviderModal = () => {
    if (hasProviderChanges()) {
      confirmAction({
        title: "¿Salir sin guardar?",
        description: "Tienes cambios sin guardar en el proveedor. ¿Estás seguro de que deseas salir?",
        confirmText: "Salir",
        variant: "destructive",
        onConfirm: () => {
          setShowProviderDialog(false)
          setProviderForm({ name: "", country: "", address: "" })
          setProviderErrors({})
        }
      })
    } else {
      setShowProviderDialog(false)
      setProviderErrors({})
    }
  }

  const batchStorageKey = "adminBatchesLocal"
  const providerStorageKey = "adminProvidersLocal"

  const generateId = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID()
    }
    return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`
  }

  const readLocalData = <T,>(key: string, fallback: T): T => {
    if (typeof window === "undefined") return fallback
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return fallback
      return JSON.parse(raw) as T
    } catch {
      return fallback
    }
  }

  const writeLocalData = (key: string, value: any) => {
    if (typeof window === "undefined") return
    localStorage.setItem(key, JSON.stringify(value))
  }

  useEffect(() => {
    fetchInventory()
    fetchBatches()
    fetchProviders()
    fetchBcvRate()
  }, [])

  useEffect(() => {
    document.title = "Inventario | Ana's Supplements Admin"
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
      setProducts(productsRes.products || [])
      
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

  const fetchBatches = async () => {
    try {
      const res = await api.getBatches({ limit: 100 })
      const mappedBatches: Batch[] = (res.batches || []).map((b: any) => ({
        id: b.id,
        code: b.code,
        providerId: b.providerId,
        providerName: b.provider?.name,
        createdAt: b.createdAt,
        notes: b.notes,
        products: (b.items || []).map((i: any) => ({
          productId: i.productId,
          productName: i.product?.name || "Producto desconocido",
          productCode: i.product?.sku || i.product?.productCode,
          quantity: i.quantity,
          soldQuantity: i.soldQuantity,
          unitCostUSD: i.unitCostUSD,
          unitSaleUSD: i.unitSaleUSD,
          entryDate: i.entryDate,
          discounted: i.discounted,
          discountPercent: i.discountPercent,
        }))
      }))
      setBatches(mappedBatches)
      writeLocalData(batchStorageKey, mappedBatches)
    } catch (error) {
      const local = readLocalData<Batch[]>(batchStorageKey, [])
      setBatches(local)
    }
  }

  const fetchProviders = async () => {
    try {
      const res = await api.getProviders()
      setProviders(res.providers || [])
      writeLocalData(providerStorageKey, res.providers || [])
    } catch (error) {
      const local = readLocalData<Provider[]>(providerStorageKey, [])
      setProviders(local)
    }
  }

  const fetchBcvRate = async () => {
    try {
      const res = await api.getBCVStatus()
      const rate = Number(res?.currentRate?.rate) || 0
      setBcvRate(rate)
    } catch (error) {
      setBcvRate(0)
    }
  }

  const handleCloseAdjustModal = () => {
    if (hasAdjustChanges()) {
      confirmAction({
        title: "¿Salir sin guardar?",
        description: "Tienes cambios sin guardar en el ajuste. ¿Estás seguro de que deseas salir?",
        confirmText: "Salir",
        variant: "destructive",
        onConfirm: () => {
          setShowAdjustDialog(false)
          setAdjustmentQuantity("")
          setAdjustmentReason("")
          setSelectedProduct(null)
        }
      })
    } else {
      setShowAdjustDialog(false)
      setSelectedProduct(null)
    }
  }

  const validateProviderForm = (): boolean => {
    const newErrors: ProviderErrors = {}
    let isValid = true

    if (!providerForm.name.trim()) {
      newErrors.name = "El nombre es obligatorio"
      isValid = false
    } else if (providerForm.name.trim().length < 2) {
      newErrors.name = "El nombre debe tener al menos 2 caracteres"
      isValid = false
    }

    if (!providerForm.country.trim()) {
      newErrors.country = "El país es obligatorio"
      isValid = false
    } else if (providerForm.country.trim().length < 2) {
      newErrors.country = "El país debe tener al menos 2 caracteres"
      isValid = false
    }

    if (!providerForm.address.trim()) {
      newErrors.address = "La dirección es obligatoria"
      isValid = false
    } else if (providerForm.address.trim().length < 5) {
      newErrors.address = "La dirección debe tener al menos 5 caracteres"
      isValid = false
    }

    setProviderErrors(newErrors)
    return isValid
  }

  const handleCreateProvider = async () => {
    if (!validateProviderForm()) return
    
    confirmAction({
      title: "¿Registrar nuevo proveedor?",
      description: `¿Estás seguro de que deseas registrar al proveedor "${providerForm.name}"?`,
      confirmText: "Crear proveedor",
      onConfirm: async () => {
        setSavingProvider(true)
        try {
          const payload = {
            name: providerForm.name.trim(),
            country: providerForm.country.trim(),
            address: providerForm.address.trim(),
          }
          await api.createProvider(payload)
          toast({
            title: "Éxito",
            description: "Proveedor creado correctamente",
          })
          setProviderForm({ name: "", country: "", address: "" })
          setProviderErrors({})
          setShowProviderDialog(false)
          fetchProviders()
        } catch (error: any) {
          console.error("Error saving provider:", error)
          const localProviders = readLocalData<Provider[]>(providerStorageKey, [])
          const newProvider: Provider = {
            id: generateId(),
            name: providerForm.name.trim(),
            country: providerForm.country.trim(),
            address: providerForm.address.trim(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          const updated = [...localProviders, newProvider]
          writeLocalData(providerStorageKey, updated)
          setProviders(updated)
          
          setProviderForm({ name: "", country: "", address: "" })
          setProviderErrors({})
          setShowProviderDialog(false)
          toast({
            title: "Proveedor guardado localmente",
            description: "No se pudo sincronizar con el servidor, pero el proveedor se guardó localmente.",
          })
        } finally {
          setSavingProvider(false)
        }
      }
    })
  }

  const handleCreateBatch = async () => {
    if (!batchForm.code.trim()) {
      toast({
        title: "Error",
        description: "El código de lote es obligatorio.",
        variant: "destructive"
      })
      return
    }

    if (batchItems.length === 0) {
      toast({
        title: "Error",
        description: "Debes añadir al menos un producto al lote.",
        variant: "destructive"
      })
      return
    }

    // Validar que todos los items tengan cantidad > 0
    const invalidItems = batchItems.filter(item => (Number(item.quantity) || 0) <= 0)
    if (invalidItems.length > 0) {
      toast({
        title: "Error",
        description: "Todos los productos deben tener una cantidad mayor a 0.",
        variant: "destructive"
      })
      return
    }

    confirmAction({
      title: "¿Crear nuevo lote?",
      description: `¿Estás seguro de que deseas registrar el lote "${batchForm.code}" con ${batchItems.length} productos?`,
      confirmText: "Crear Lote",
      onConfirm: async () => {
        const payload = {
          code: batchForm.code.trim(),
          providerId: batchForm.providerId || undefined,
          notes: batchForm.notes.trim() || undefined,
          products: batchItems.map(item => ({
            productId: item.productId,
            quantity: Number(item.quantity) || 0,
            unitCostUSD: Number(item.unitCostUSD) || 0,
            unitSaleUSD: Number(item.unitSaleUSD) || 0,
            entryDate: item.entryDate,
            discounted: !!item.discounted,
            discountPercent: Number(item.discountPercent) || 0,
          }))
        }
        
        try {
          await api.createBatch(payload)
          toast({
            title: "Lote creado",
            description: "El lote fue registrado correctamente en el servidor.",
          })
          setShowBatchDialog(false)
          setBatchForm({ code: "", providerId: "", notes: "" })
          setBatchItems([])
          // Recargar datos para ver los cambios
          await Promise.all([
            fetchBatches(),
            fetchInventory()
          ])
        } catch (error: any) {
          console.error("Error al crear lote:", error)
          
          // Solo guardamos localmente si el error parece ser de red o servidor caído
          const isNetworkError = !error.status || error.message?.includes("fetch") || error.message?.includes("Network");
          
          if (isNetworkError) {
            const localBatches = readLocalData<Batch[]>(batchStorageKey, [])
            const providerName = providers.find(p => p.id === batchForm.providerId)?.name
            const newBatch: Batch = {
              id: generateId(),
              code: batchForm.code.trim(),
              providerId: batchForm.providerId || undefined,
              providerName,
              createdAt: new Date().toISOString(),
              notes: batchForm.notes.trim() || undefined,
              products: batchItems.map(item => ({
                ...item,
                quantity: Number(item.quantity) || 0,
                soldQuantity: 0,
                unitCostUSD: Number(item.unitCostUSD) || 0,
                unitSaleUSD: Number(item.unitSaleUSD) || 0,
              }))
            }
            const updated = [newBatch, ...localBatches]
            writeLocalData(batchStorageKey, updated)
            setBatches(updated)
            
            toast({
              title: "Lote guardado localmente",
              description: "No se pudo sincronizar con el servidor, pero el lote se guardó de forma local.",
              variant: "destructive"
            })
            
            setShowBatchDialog(false)
            setBatchForm({ code: "", providerId: "", notes: "" })
            setBatchItems([])
          } else {
            // Error de validación o del servidor (4xx, 5xx)
            toast({
              title: "Error al crear lote",
              description: error.message || "Ocurrió un error inesperado en el servidor.",
              variant: "destructive"
            })
          }
        }
      }
    })
  }

  const handleUpdateBatch = async () => {
    if (!editingBatch) return

    // Validar que si hay productos, todos tengan cantidad > 0
    const hasSales = editingBatch.products?.some(p => p.soldQuantity > 0)
    if (!hasSales && editBatchItems.length === 0) {
      toast({
        title: "Error",
        description: "Debes añadir al menos un producto al lote.",
        variant: "destructive"
      })
      return
    }

    if (!hasSales) {
      const invalidItems = editBatchItems.filter(item => (Number(item.quantity) || 0) <= 0)
      if (invalidItems.length > 0) {
        toast({
          title: "Error",
          description: "Todos los productos deben tener una cantidad mayor a 0.",
          variant: "destructive"
        })
        return
      }
    }

    setIsUpdatingBatch(true)
    try {
      const payload: any = {
        providerId: editBatchForm.providerId || undefined,
        notes: editBatchForm.notes.trim() || undefined
      }

      // Solo enviar productos si el lote no tiene ventas
      if (!hasSales) {
        payload.products = editBatchItems.map(item => ({
          productId: item.productId,
          quantity: Number(item.quantity) || 0,
          unitCostUSD: Number(item.unitCostUSD) || 0,
          unitSaleUSD: Number(item.unitSaleUSD) || 0,
          entryDate: item.entryDate,
          discounted: !!item.discounted,
          discountPercent: Number(item.discountPercent) || 0,
        }))
      }

      await api.updateBatch(editingBatch.id, payload)

      toast({
        title: "Lote actualizado",
        description: "Los cambios se guardaron correctamente.",
      })

      setShowEditBatchDialog(false)
      setEditingBatch(null)
      setEditBatchItems([])
      
      // Recargar todo para sincronizar stock
      await Promise.all([
        fetchBatches(),
        fetchInventory()
      ])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el lote.",
        variant: "destructive"
      })
    } finally {
      setIsUpdatingBatch(false)
    }
  }

  const handleSelectEditProducts = (selectedIds: string[]) => {
    // Mantener los items que ya estaban y añadir los nuevos
    const currentIds = editBatchItems.map(item => item.productId)
    
    // Items a mantener (que siguen seleccionados)
    const itemsToKeep = editBatchItems.filter(item => selectedIds.includes(item.productId))
    
    // Nuevos items a añadir
    const newIds = selectedIds.filter(id => !currentIds.includes(id))
    const newItems = newIds.map(id => {
      const product = products.find(p => p.id === id)
      const baseItem = {
        productId: id,
        productName: product?.name || "",
        productCode: product?.sku || product?.code || "",
        quantity: 1,
        soldQuantity: 0,
        unitCostUSD: product?.purchasePrice || 0,
        unitSaleUSD: product?.price || 0,
        entryDate: new Date().toISOString().split("T")[0],
      }
      const metrics = calculateItemMetrics(baseItem, bcvRate)
      return { ...baseItem, ...metrics }
    })

    setEditBatchItems([...itemsToKeep, ...newItems])
  }

  const updateEditBatchItem = (index: number, patch: Partial<BatchProductItem>) => {
    setEditBatchItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        const updatedItem = { ...item, ...patch }
        const metrics = calculateItemMetrics(updatedItem, bcvRate)
        return { ...updatedItem, ...metrics }
      }
      return item
    }))
  }

  const removeEditBatchItem = (index: number) => {
    setEditBatchItems(prev => prev.filter((_, idx) => idx !== index))
  }

  const handleSelectProducts = (selectedIds: string[]) => {
    // Mantener los items que ya estaban y añadir los nuevos
    const currentIds = batchItems.map(item => item.productId)
    
    // Items a mantener (que siguen seleccionados)
    const itemsToKeep = batchItems.filter(item => selectedIds.includes(item.productId))
    
    // Nuevos items a añadir
    const newIds = selectedIds.filter(id => !currentIds.includes(id))
    const newItems = newIds.map(id => {
      const product = products.find(p => p.id === id)
      const baseItem = {
        productId: id,
        productName: product?.name || "",
        productCode: product?.sku || product?.code || "",
        quantity: 1,
        soldQuantity: 0,
        unitCostUSD: product?.price || 0, // Por defecto el precio actual como costo? O mejor 0
        unitSaleUSD: (product?.price || 0) * 1.3, // 30% por encima por defecto
        entryDate: new Date().toISOString().split("T")[0],
      }
      const metrics = calculateItemMetrics(baseItem, bcvRate)
      return { ...baseItem, ...metrics }
    })

    setBatchItems([...itemsToKeep, ...newItems])
  }

  const updateBatchItem = (index: number, patch: Partial<BatchProductItem>) => {
    setBatchItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        const updatedItem = { ...item, ...patch }
        const metrics = calculateItemMetrics(updatedItem, bcvRate)
        return { ...updatedItem, ...metrics }
      }
      return item
    }))
  }

  const removeBatchItem = (index: number) => {
    setBatchItems(prev => prev.filter((_, idx) => idx !== index))
  }

  const updateSelectedBatchItem = (index: number, patch: Partial<BatchProductItem>) => {
    if (!selectedBatch) return
    const updatedProducts = selectedBatch.products.map((item, idx) => idx === index ? { ...item, ...patch } : item)
    const updatedBatch = { ...selectedBatch, products: updatedProducts }
    setSelectedBatch(updatedBatch)
    setBatches(prev => prev.map(batch => batch.id === updatedBatch.id ? updatedBatch : batch))
    const localBatches = readLocalData<Batch[]>(batchStorageKey, [])
    if (localBatches.length > 0) {
      const updatedLocal = localBatches.map(batch => batch.id === updatedBatch.id ? updatedBatch : batch)
      writeLocalData(batchStorageKey, updatedLocal)
    }
  }

  const toggleDiscount = (index: number) => {
    if (!selectedBatch) return
    const current = selectedBatch.products[index]
    const action = !current.discounted ? "aplicar" : "quitar"
    
    confirmAction({
      title: `¿${action.charAt(0).toUpperCase() + action.slice(1)} descuento?`,
      description: `¿Estás seguro de que deseas ${action} el descuento para "${current.productName}"?`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1) + " Descuento",
      onConfirm: () => {
        updateSelectedBatchItem(index, {
          discounted: !current.discounted,
          discountPercent: current.discounted ? 0 : (current.discountPercent || 10)
        })
        toast({
          title: "Descuento actualizado",
          description: `Se ha ${current.discounted ? "quitado" : "aplicado"} el descuento a ${current.productName}.`,
        })
      }
    })
  }

  const selectedBatchTotals = useMemo(() => {
    if (!selectedBatch) return null
    let totalCost = 0
    let totalRevenue = 0
    let totalProfit = 0
    selectedBatch.products.forEach(item => {
      const unitCost = (Number(item.unitCostUSD) || 0)
      const sold = Number(item.soldQuantity) || 0
      const discount = item.discounted ? (Number(item.discountPercent) || 0) / 100 : 0
      const saleUnit = (Number(item.unitSaleUSD) || 0) * (1 - discount)
      const costSold = unitCost * sold
      const revenue = saleUnit * sold
      totalCost += costSold
      totalRevenue += revenue
      totalProfit += revenue - costSold
    })
    const profitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0
    return {
      totalCost,
      totalRevenue,
      totalProfit,
      profitPercent,
      totalRevenueBs: totalRevenue * (Number(bcvRate) || 0),
    }
  }, [selectedBatch, bcvRate])

  const handleAdjustment = async () => {
    if (!selectedProduct || !adjustmentQuantity || parseInt(adjustmentQuantity) <= 0) return

    const quantity = parseInt(adjustmentQuantity)
    const typeLabel = adjustmentType === "entry" ? "entrada" : adjustmentType === "exit" ? "salida" : "ajuste"

    confirmAction({
      title: `¿Confirmar ${typeLabel}?`,
      description: `¿Estás seguro de que deseas realizar una ${typeLabel} de ${quantity} unidades para "${selectedProduct.productName}"?`,
      confirmText: "Confirmar Ajuste",
      variant: adjustmentType === "exit" ? "destructive" : "default",
      onConfirm: async () => {
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
    })
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, sortBy, sortOrder])

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

  const paginatedInventory = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredInventory.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredInventory, currentPage])

  const totalPages = Math.ceil(filteredInventory.length / ITEMS_PER_PAGE)

  const stats = useMemo(() => {
    const totalItems = inventory.length
    const lowStock = inventory.filter(i => i.status === "low").length
    const criticalStock = inventory.filter(i => i.status === "critical").length
    const overstock = inventory.filter(i => i.status === "overstock").length
    const totalValue = inventory.reduce((sum, i) => sum + i.currentStock * i.unitCost, 0)
    const coverageRatio = totalItems
      ? inventory.reduce((sum, i) => sum + (i.minStock ? i.currentStock / i.minStock : 0), 0) / totalItems
      : 0
    const movements = adjustments.length
    return { totalItems, lowStock, criticalStock, overstock, totalValue, coverageRatio, movements }
  }, [inventory, adjustments])

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
    <div className="space-y-8 p-6 font-sans selection:bg-primary/20 selection:text-primary">
        <AdminPageHeader 
          title="Gestión de Inventario"
          subtitle="Control operativo de stock, rotación y cobertura"
          icon={Package}
          action={{
            label: "Historial de Ajustes",
            onClick: () => setShowHistoryDialog(true),
            icon: History
          }}
        />

        {/* Gestión por Lotes */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Gestión por Lotes</p>
              <p className="text-lg font-bold text-slate-800">Lotes, proveedores y reporte detallado</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowBatchDialog(true)} className="font-bold">
                Nuevo Lote
              </Button>
              <Button variant="outline" onClick={() => setShowProviderDialog(true)} className="font-bold">
                Proveedores
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-800">Listado de lotes</p>
                  <span className="text-xs text-slate-400">{batches.length} total</span>
                </div>
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {batches.map(batch => (
                    <div key={batch.id} className="relative group">
                      <button
                        onClick={() => setSelectedBatch(batch)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          selectedBatch?.id === batch.id ? "border-primary bg-primary/5" : "border-slate-200 hover:border-primary/40"
                        }`}
                        aria-label={`Seleccionar lote ${batch.code} del proveedor ${batch.providerName || "desconocido"}`}
                        aria-pressed={selectedBatch?.id === batch.id}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-slate-800">{batch.code}</p>
                          <span className="text-[10px] uppercase tracking-widest text-slate-400 absolute bottom-4 right-4">
                            {new Date(batch.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Proveedor: {batch.providerName || "Sin proveedor"}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 mb-2">
                          Productos: {batch.products?.length || 0}
                        </p>
                      </button>

                      {/* Acciones del lote */}
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingBatch(batch)
                            setEditBatchForm({
                              providerId: batch.providerId || "",
                              notes: batch.notes || ""
                            })
                            // Mapear los items del lote para la edición, incluyendo métricas
                            const mappedItems = (batch.products || []).map(p => {
                              const metrics = calculateItemMetrics(p, bcvRate)
                              return { ...p, ...metrics }
                            })
                            setEditBatchItems(mappedItems)
                            setShowEditBatchDialog(true)
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>

                        {batch.products?.some(p => p.soldQuantity > 0) ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-not-allowed">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground/30"
                                    disabled
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="bg-destructive text-destructive-foreground border-none">
                                <p className="text-xs font-bold flex items-center gap-1">
                                  No se puede eliminar: tiene unidades vendidas
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              confirmAction({
                                title: "¿Eliminar lote?",
                                description: `¿Estás seguro de que deseas eliminar el lote "${batch.code}"? Esta acción no se puede deshacer y revertirá el stock de los productos.`,
                                confirmText: "Eliminar",
                                variant: "destructive",
                                onConfirm: async () => {
                                  try {
                                    await api.deleteBatch(batch.id)
                                    toast({
                                      title: "Lote eliminado",
                                      description: "El lote fue eliminado y el stock revertido.",
                                    })
                                    if (selectedBatch?.id === batch.id) {
                                      setSelectedBatch(null)
                                    }
                                    await Promise.all([
                                      fetchBatches(),
                                      fetchInventory()
                                    ])
                                  } catch (error: any) {
                                    toast({
                                      title: "Error",
                                      description: error.message || "No se pudo eliminar el lote.",
                                      variant: "destructive",
                                    })
                                  }
                                }
                              })
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {batches.length === 0 && (
                    <div className="p-8 text-center text-sm text-slate-400">
                      No hay lotes registrados.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-800">Reporte del lote</p>
                  <span className="text-xs text-slate-400">{selectedBatch?.code || "Selecciona un lote"}</span>
                </div>
                {selectedBatch ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[10px] uppercase tracking-widest text-slate-400">Costo vendido (USD)</p>
                        <p className="text-lg font-bold text-slate-800">{formatUSD(selectedBatchTotals?.totalCost || 0)}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[10px] uppercase tracking-widest text-slate-400">Ventas (USD)</p>
                        <p className="text-lg font-bold text-slate-800">{formatUSD(selectedBatchTotals?.totalRevenue || 0)}</p>
                        <p className="text-[10px] text-slate-400">Bs: {formatBS(selectedBatchTotals?.totalRevenueBs || 0)}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[10px] uppercase tracking-widest text-slate-400">Ganancia (USD)</p>
                        <p className="text-lg font-bold text-emerald-600">{formatUSD(selectedBatchTotals?.totalProfit || 0)}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[10px] uppercase tracking-widest text-slate-400">Ganancia %</p>
                        <p className="text-lg font-bold text-emerald-600">{(selectedBatchTotals?.profitPercent || 0).toFixed(2)}%</p>
                      </div>
                    </div>
                    <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                      {selectedBatch.products.map((item, index) => {
                        const unsold = Math.max(0, (Number(item.quantity) || 0) - (Number(item.soldQuantity) || 0))
                        const entry = item.entryDate ? new Date(item.entryDate).getTime() : Date.now()
                        const ageDays = Math.max(0, Math.floor((Date.now() - entry) / (1000 * 60 * 60 * 24)))
                        const discount = item.discounted ? (Number(item.discountPercent) || 0) : 0
                        const unitCost = (Number(item.unitCostUSD) || 0)
                        const saleUnit = (Number(item.unitSaleUSD) || 0) * (1 - discount / 100)
                        const soldUnits = Number(item.soldQuantity) || 0
                        const revenue = saleUnit * soldUnits
                        const costSold = unitCost * soldUnits
                        const profit = revenue - costSold
                        const profitPercent = costSold > 0 ? (profit / costSold) * 100 : 0
                        return (
                          <div key={`${item.productId}-${index}`} className="p-4 rounded-xl border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-bold text-slate-800">{item.productName}</p>
                                <p className="text-xs text-slate-400">Código: {item.productCode || "N/A"}</p>
                              </div>
                              <Button variant="outline" size="sm" className="h-8" onClick={() => toggleDiscount(index)}>
                                {item.discounted ? "Quitar descuento" : "Enviar a descuento"}
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
                              <div>Cantidad: <span className="font-bold text-slate-700">{item.quantity}</span></div>
                              <div>Vendido: <span className="font-bold text-slate-700">{item.soldQuantity}</span></div>
                              <div>No vendido: <span className="font-bold text-slate-700">{unsold}</span></div>
                              <div>Antigüedad: <span className={`${ageDays > 90 ? "text-amber-600 font-bold" : "text-slate-700 font-bold"}`}>{ageDays} días</span></div>
                              <div>Costo U: <span className="font-bold text-slate-700">{formatUSD(item.unitCostUSD)}</span></div>
                              <div>Precio U: <span className="font-bold text-slate-700">{formatUSD(item.unitSaleUSD)}</span></div>
                              <div>Ingreso: <span className="font-bold text-slate-700">{item.entryDate}</span></div>
                              <div>Venta USD: <span className="font-bold text-slate-700">{formatUSD(revenue)}</span></div>
                              <div>Venta Bs: <span className="font-bold text-slate-700">{formatBS(revenue * (Number(bcvRate) || 0))}</span></div>
                              <div>Ganancia: <span className="font-bold text-emerald-600">{formatUSD(profit)}</span></div>
                              <div>Ganancia %: <span className="font-bold text-emerald-600">{profitPercent.toFixed(2)}%</span></div>
                            </div>
                            {item.discounted && (
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-500">Descuento %</span>
                                <Input
                                  type="number"
                                  value={discount}
                                  onChange={(e) => updateSelectedBatchItem(index, { discountPercent: parseFloat(e.target.value) || 0 })}
                                  className="h-8 w-24"
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <div className="p-10 text-center text-sm text-slate-400">
                    Selecciona un lote para ver su reporte.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats Grid - Nature Serena Palette */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-6">
          {[
            { label: "Total Productos", value: stats.totalItems, icon: Package },
            { label: "Stock Bajo", value: stats.lowStock, icon: AlertTriangle },
            { label: "Crítico", value: stats.criticalStock, icon: TrendingDown },
            { label: "Sobrestock", value: stats.overstock, icon: ArrowUp },
            { label: "Cobertura Promedio", value: `${stats.coverageRatio.toFixed(1)}x`, icon: ArrowUpRight },
            { label: "Movimientos Recientes", value: stats.movements, icon: Activity }
          ].map((stat, i) => (
            <Card key={i} className="border border-border/60 shadow-sm bg-white dark:bg-card overflow-hidden group hover:shadow-md transition-all rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-muted rounded-xl group-hover:bg-primary/10 transition-colors">
                    <stat.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-bold text-foreground tracking-tight">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <Input
              placeholder="Buscar por nombre, SKU o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 pl-12 bg-background border-border/60 rounded-xl shadow-sm focus:ring-primary/20 transition-all text-sm"
              aria-label="Buscar productos en el inventario"
            />
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto scrollbar-hide pb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap" id="sort-label">Ordenar:</span>
            <div className="flex bg-muted/40 p-1 rounded-xl border border-border/60 shadow-sm h-11 items-center px-1 shrink-0" role="group" aria-labelledby="sort-label">
              <button
                onClick={() => { setSortBy("stock"); setSortOrder(sortOrder === "asc" ? "desc" : "asc") }}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-all duration-300 rounded-lg whitespace-nowrap group ${
                  sortBy === "stock" 
                    ? "bg-white dark:bg-card text-primary shadow-md scale-[1.02]" 
                    : "text-muted-foreground hover:text-primary hover:bg-white/70"
                }`}
                aria-label={`Ordenar por stock ${sortOrder === "asc" ? "descendente" : "ascendente"}`}
                aria-pressed={sortBy === "stock"}
              >
                <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                Stock
                {sortBy === "stock" && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1 bg-muted text-[10px]" aria-hidden="true">{sortOrder === "asc" ? "↑" : "↓"}</Badge>
                )}
              </button>
              <button
                onClick={() => { setSortBy("name"); setSortOrder(sortOrder === "asc" ? "desc" : "asc") }}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-all duration-300 rounded-lg whitespace-nowrap group ${
                  sortBy === "name" 
                    ? "bg-white dark:bg-card text-primary shadow-md scale-[1.02]" 
                    : "text-muted-foreground hover:text-primary hover:bg-white/70"
                }`}
                aria-label={`Ordenar por nombre ${sortOrder === "asc" ? "descendente" : "ascendente"}`}
                aria-pressed={sortBy === "name"}
              >
                <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                Nombre
                {sortBy === "name" && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1 bg-muted text-[10px]" aria-hidden="true">{sortOrder === "asc" ? "↑" : "↓"}</Badge>
                )}
              </button>
              <button
                onClick={() => { setSortBy("category"); setSortOrder(sortOrder === "asc" ? "desc" : "asc") }}
                className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-all duration-300 rounded-lg whitespace-nowrap group ${
                  sortBy === "category" 
                    ? "bg-white dark:bg-card text-primary shadow-md scale-[1.02]" 
                    : "text-muted-foreground hover:text-primary hover:bg-white/70"
                }`}
                aria-label={`Ordenar por categoría ${sortOrder === "asc" ? "descendente" : "ascendente"}`}
                aria-pressed={sortBy === "category"}
              >
                <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                Categoría
                {sortBy === "category" && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1 bg-muted text-[10px]" aria-hidden="true">{sortOrder === "asc" ? "↑" : "↓"}</Badge>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <Card className="border border-border/60 shadow-sm bg-white dark:bg-card rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full" role="grid" aria-label="Tabla de inventario de productos">
                <thead>
                  <tr className="bg-muted/40 text-muted-foreground border-b border-border/60">
                    <th scope="col" className="text-left p-5 text-[10px] font-bold uppercase tracking-widest">Producto</th>
                    <th scope="col" className="text-left p-5 text-[10px] font-bold uppercase tracking-widest">Categoría</th>
                    <th scope="col" className="text-left p-5 text-[10px] font-bold uppercase tracking-widest">Nivel de Stock</th>
                    <th scope="col" className="text-left p-5 text-[10px] font-bold uppercase tracking-widest">Estado</th>
                    <th scope="col" className="text-right p-5 text-[10px] font-bold uppercase tracking-widest">Valor</th>
                    <th scope="col" className="text-center p-5 text-[10px] font-bold uppercase tracking-widest">Acciones</th>
                  </tr>
                </thead>
                <motion.tbody 
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="divide-y divide-border/40"
                  aria-live="polite"
                  aria-busy={false}
                >
                  {paginatedInventory.map((item) => {
                    const status = getStatusConfig(item.status)
                    return (
                      <motion.tr 
                        key={item.id} 
                        variants={itemVariants}
                        className="hover:bg-muted/30 transition-colors group"
                      >
                        <td className="p-5">
                          <p className="font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">{item.productName}</p>
                          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5">{item.sku}</p>
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
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={item.currentStock} aria-valuemin={0} aria-valuemax={item.maxStock} aria-label={`Nivel de stock: ${item.currentStock} de ${item.maxStock}`}>
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
                            <status.icon className="h-3 w-3" aria-hidden="true" />
                            {status.label}
                          </Badge>
                        </td>
                        <td className="p-5 text-right">
                          <p className="font-bold text-slate-800 tracking-tight">${formatUSD(item.currentStock * item.unitCost)}</p>
                        </td>
                        <td className="p-5">
                          <div className="flex justify-center gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 w-9 p-0 border-slate-200 hover:border-primary hover:text-primary rounded-xl transition-all shadow-sm"
                                    onClick={() => openAdjustDialog(item, "entry")}
                                    aria-label={`Aumentar stock de ${item.productName}`}
                                  >
                                    <Plus className="h-4 w-4" aria-hidden="true" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Aumentar Stock</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 w-9 p-0 border-slate-200 hover:border-rose-400 hover:text-rose-500 rounded-xl transition-all shadow-sm"
                                    onClick={() => openAdjustDialog(item, "exit")}
                                    aria-label={`Retirar stock de ${item.productName}`}
                                  >
                                    <Minus className="h-4 w-4" aria-hidden="true" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Retirar Stock</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 w-9 p-0 border-slate-200 hover:border-primary hover:text-primary rounded-xl transition-all shadow-sm"
                                    onClick={() => openAdjustDialog(item, "adjustment")}
                                    aria-label={`Ajuste manual de ${item.productName}`}
                                  >
                                    <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Ajuste Manual</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </motion.tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border/60 bg-muted/20">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Página <span className="text-foreground">{currentPage}</span> de <span className="text-foreground">{totalPages}</span>
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="h-8 rounded-lg font-bold text-[10px] uppercase tracking-widest"
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 rounded-lg font-bold text-[10px] uppercase tracking-widest"
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}

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
        <Dialog open={showAdjustDialog} onOpenChange={(open) => {
          if (!open) handleCloseAdjustModal()
          else setShowAdjustDialog(true)
        }}>
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
                  <label htmlFor="adjustment-quantity" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">
                    {adjustmentType === "entry" && "Cantidad a ingresar"}
                    {adjustmentType === "exit" && "Cantidad a retirar"}
                    {adjustmentType === "adjustment" && "Nuevo stock total"}
                  </label>
                  <Input
                    id="adjustment-quantity"
                    type="number"
                    value={adjustmentQuantity}
                    onChange={(e) => setAdjustmentQuantity(e.target.value)}
                    placeholder="0"
                    className="h-12 bg-white border-slate-200 focus:border-primary focus:ring-primary/10 rounded-xl text-lg font-bold"
                    aria-required="true"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="adjustment-reason" className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Motivo del ajuste</label>
                  <Input
                    id="adjustment-reason"
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder="Ej: Recepción de pedido, merma, corrección..."
                    className="h-12 bg-white border-slate-200 focus:border-primary focus:ring-primary/10 rounded-xl text-sm"
                    aria-required="true"
                  />
                </div>
              </div>
            )}
            <DialogFooter className="gap-3">
              <Button variant="outline" onClick={handleCloseAdjustModal} className="rounded-xl border-slate-200 font-bold text-xs uppercase tracking-wider h-11 px-6">
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
            
            <ScrollArea className="max-h-[500px]">
              <div className="p-6 space-y-4">
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
            </ScrollArea>
            
            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-end">
              <Button onClick={() => setShowHistoryDialog(false)} className="rounded-xl bg-slate-800 text-white hover:bg-slate-900 font-bold text-xs uppercase tracking-wider h-11 px-8 transition-all">
                Cerrar Auditoría
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showBatchDialog} onOpenChange={(open) => {
          if (!open) handleCloseBatchModal()
          else setShowBatchDialog(true)
        }}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Registrar lote</DialogTitle>
              <DialogDescription>
                Carga un lote con múltiples productos y cantidades.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="batch-code" className="text-sm font-medium">Código de lote/factura *</label>
                  <Input
                    id="batch-code"
                    value={batchForm.code}
                    onChange={(e) => setBatchForm({ ...batchForm, code: e.target.value })}
                    placeholder="Ej: LOTE-2026-001"
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="batch-provider" className="text-sm font-medium">Proveedor</label>
                  <Select
                    value={batchForm.providerId}
                    onValueChange={(val) => setBatchForm({ ...batchForm, providerId: val })}
                  >
                    <SelectTrigger id="batch-provider" aria-label="Seleccionar proveedor">
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((provider) => (
                        <div key={provider.id} className="flex items-center justify-between group">
                          <SelectItem value={provider.id} className="flex-1">
                            {provider.name}
                          </SelectItem>
                          {provider._count && provider._count.batches > 0 ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="px-2 opacity-50 cursor-not-allowed">
                                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="bg-destructive text-destructive-foreground border-none">
                                  <p className="text-[10px] font-bold">No se puede eliminar: tiene lotes asociados</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                confirmAction({
                                  title: "¿Eliminar proveedor?",
                                  description: `¿Estás seguro de que deseas eliminar al proveedor "${provider.name}"? Esta acción no se puede deshacer.`,
                                  confirmText: "Eliminar",
                                  variant: "destructive",
                                  onConfirm: async () => {
                                    try {
                                      await api.deleteProvider(provider.id)
                                      toast({
                                        title: "Proveedor eliminado",
                                        description: "El proveedor fue eliminado correctamente.",
                                      })
                                      fetchProviders()
                                    } catch (error) {
                                      toast({
                                        title: "Error",
                                        description: "No se pudo eliminar el proveedor.",
                                        variant: "destructive",
                                      })
                                    }
                                  }
                                })
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button variant="outline" onClick={() => setShowProviderDialog(true)} className="w-full" aria-label="Crear nuevo proveedor">
                    Nuevo proveedor
                  </Button>
                </div>
              </div>

              <div>
                <label htmlFor="batch-notes" className="text-sm font-medium">Notas</label>
                <Textarea
                  id="batch-notes"
                  value={batchForm.notes}
                  onChange={(e) => setBatchForm({ ...batchForm, notes: e.target.value })}
                  placeholder="Detalles de la factura o notas internas"
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold">Seleccionar productos registrados</p>
                </div>
                <MultiSelect
                  options={products.map(p => ({ label: p.name, value: p.id }))}
                  selected={batchItems.map(item => item.productId)}
                  onChange={handleSelectProducts}
                  placeholder="Buscar productos..."
                />
                
                {batchItems.length > 0 && (
                  <div className="mt-6 space-y-4">
                    <p className="text-sm font-bold border-b pb-2">Detalle de productos en lote</p>
                    <div className="grid grid-cols-1 gap-4">
                      {batchItems.map((item, index) => (
                        <div key={`${item.productId}-${index}`} className="p-4 border rounded-2xl bg-slate-50/50 space-y-4 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Package className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">{item.productName}</p>
                                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">SKU: {item.productCode || 'N/A'}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => removeBatchItem(index)} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Cantidad</label>
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateBatchItem(index, { quantity: parseInt(e.target.value) || 0 })}
                                className="h-10 bg-white border-slate-200 rounded-xl font-bold"
                              />
                            </div>
                            
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Costo ($)</label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.unitCostUSD}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0
                                  updateBatchItem(index, { 
                                    unitCostUSD: val,
                                    unitSaleUSD: val * 1.3 // Sugerir 30% al cambiar costo
                                  })
                                }}
                                className="h-10 bg-white border-slate-200 rounded-xl font-bold"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Costo (BCV)</label>
                              <div className="h-10 px-3 flex items-center bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-600">
                                {formatBS(item.unitCostBCV || 0)}
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Venta ($)</label>
                              <Input
                                type="number"
                                step="0.01"
                                value={item.unitSaleUSD}
                                onChange={(e) => updateBatchItem(index, { unitSaleUSD: parseFloat(e.target.value) || 0 })}
                                className="h-10 bg-white border-primary/20 focus:border-primary rounded-xl font-bold text-primary"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Ganancia ($)</label>
                              <div className="h-10 px-3 flex items-center bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-black text-emerald-600">
                                +{formatUSD(item.profitUSD || 0)}
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Ganancia (BCV)</label>
                              <div className="h-10 px-3 flex items-center bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-black text-emerald-600">
                                +{formatBS(item.profitBCV || 0)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-4">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Margen sugerido: <span className="text-slate-600">30%</span>
                              </span>
                              <span className={cn(
                                "text-[10px] font-bold uppercase tracking-widest",
                                (item.markupPercent || 0) >= 30 ? "text-emerald-600" : "text-amber-600"
                              )}>
                                Margen actual: {(item.markupPercent || 0).toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Fecha ingreso:</label>
                              <Input
                                type="date"
                                value={item.entryDate}
                                onChange={(e) => updateBatchItem(index, { entryDate: e.target.value })}
                                className="h-8 w-36 bg-white border-slate-200 rounded-lg text-xs font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseBatchModal}>
                Cancelar
              </Button>
              <Button onClick={handleCreateBatch}>
                Guardar lote
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Batch Dialog */}
        <Dialog open={showEditBatchDialog} onOpenChange={setShowEditBatchDialog}>
          <DialogContent className={cn(
            "max-h-[90vh] overflow-y-auto transition-all duration-300",
            editingBatch?.products?.some(p => p.soldQuantity > 0) ? "sm:max-w-[500px]" : "sm:max-w-[900px]"
          )}>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-blue-500" />
                Editar Lote: {editingBatch?.code}
              </DialogTitle>
              <DialogDescription>
                {editingBatch?.products?.some(p => p.soldQuantity > 0) 
                  ? "Actualiza el proveedor o las notas del lote."
                  : "Actualiza los datos del lote y sus productos."
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Proveedor</label>
                  <Select
                    value={editBatchForm.providerId}
                    onValueChange={(val) => setEditBatchForm({ ...editBatchForm, providerId: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notas</label>
                  <Textarea
                    value={editBatchForm.notes}
                    onChange={(e) => setEditBatchForm({ ...editBatchForm, notes: e.target.value })}
                    placeholder="Notas adicionales sobre el lote..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>

              {editingBatch?.products?.some(p => p.soldQuantity > 0) ? (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-amber-700 leading-tight">
                    <strong>Nota:</strong> Este lote ya tiene ventas registradas. Solo se permite editar el proveedor y las notas para mantener la integridad del inventario.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold">Editar productos del lote</p>
                  </div>
                  
                  <MultiSelect
                    options={products.map(p => ({ label: p.name, value: p.id }))}
                    selected={editBatchItems.map(item => item.productId)}
                    onChange={handleSelectEditProducts}
                    placeholder="Buscar productos..."
                  />

                  <div className="space-y-4">
                    {editBatchItems.map((item, index) => (
                      <div key={`${item.productId}-${index}`} className="p-4 border rounded-2xl bg-slate-50/50 space-y-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                              <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{item.productName}</p>
                              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">SKU: {item.productCode || 'N/A'}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeEditBatchItem(index)} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Cantidad</label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateEditBatchItem(index, { quantity: parseInt(e.target.value) || 0 })}
                              className="h-10 bg-white border-slate-200 rounded-xl font-bold"
                            />
                          </div>
                          
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Costo ($)</label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unitCostUSD}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0
                                updateEditBatchItem(index, { 
                                  unitCostUSD: val,
                                  unitSaleUSD: val * 1.3
                                })
                              }}
                              className="h-10 bg-white border-slate-200 rounded-xl font-bold"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Costo (BCV)</label>
                            <div className="h-10 px-3 flex items-center bg-slate-100/80 border border-slate-200 rounded-xl text-xs font-bold text-slate-600">
                              {formatBS(item.unitCostBCV || 0)}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Venta ($)</label>
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unitSaleUSD}
                              onChange={(e) => updateEditBatchItem(index, { unitSaleUSD: parseFloat(e.target.value) || 0 })}
                              className="h-10 bg-white border-primary/20 focus:border-primary rounded-xl font-bold text-primary"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Ganancia ($)</label>
                            <div className="h-10 px-3 flex items-center bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-black text-emerald-600">
                              +{formatUSD(item.profitUSD || 0)}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Ganancia (BCV)</label>
                            <div className="h-10 px-3 flex items-center bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-black text-emerald-600">
                              +{formatBS(item.profitBCV || 0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditBatchDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleUpdateBatch} 
                disabled={isUpdatingBatch}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isUpdatingBatch ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showProviderDialog} onOpenChange={(open) => {
          if (!open) handleCloseProviderModal()
          else setShowProviderDialog(true)
        }}>
          <DialogContent className="sm:max-w-[520px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 border-b border-primary/10">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black text-primary flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  Nuevo Proveedor
                </DialogTitle>
                <DialogDescription className="text-slate-500 font-medium ml-13">
                  Completa los datos del proveedor para gestionar tus productos.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="p-6 space-y-6 bg-background">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                    Nombre del Proveedor
                    <span className="text-primary">*</span>
                  </label>
                  <Input
                    placeholder="Ej. Distribuidora Salud C.A."
                    value={providerForm.name}
                    onChange={(e) => {
                      setProviderForm({ ...providerForm, name: e.target.value })
                      if (providerErrors.name) setProviderErrors({ ...providerErrors, name: undefined })
                    }}
                    className={cn(
                      "h-12 bg-slate-50 border-slate-200 focus:border-primary focus:ring-primary/20 rounded-xl font-medium transition-all",
                      providerErrors.name && "border-destructive focus:border-destructive focus:ring-destructive/20 bg-destructive/5"
                    )}
                  />
                  {providerErrors.name && (
                    <p className="text-[11px] font-bold text-destructive ml-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                      <AlertTriangle className="h-3 w-3" />
                      {providerErrors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                    País de Origen
                    <span className="text-primary">*</span>
                  </label>
                  <Input
                    placeholder="Ej. Venezuela"
                    value={providerForm.country}
                    onChange={(e) => {
                      setProviderForm({ ...providerForm, country: e.target.value })
                      if (providerErrors.country) setProviderErrors({ ...providerErrors, country: undefined })
                    }}
                    className={cn(
                      "h-12 bg-slate-50 border-slate-200 focus:border-primary focus:ring-primary/20 rounded-xl font-medium transition-all",
                      providerErrors.country && "border-destructive focus:border-destructive focus:ring-destructive/20 bg-destructive/5"
                    )}
                  />
                  {providerErrors.country && (
                    <p className="text-[11px] font-bold text-destructive ml-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                      <AlertTriangle className="h-3 w-3" />
                      {providerErrors.country}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                    Dirección Fiscal
                    <span className="text-primary">*</span>
                  </label>
                  <Textarea
                    placeholder="Dirección completa del proveedor..."
                    value={providerForm.address}
                    onChange={(e) => {
                      setProviderForm({ ...providerForm, address: e.target.value })
                      if (providerErrors.address) setProviderErrors({ ...providerErrors, address: undefined })
                    }}
                    className={cn(
                      "min-h-[100px] bg-slate-50 border-slate-200 focus:border-primary focus:ring-primary/20 rounded-xl font-medium transition-all resize-none",
                      providerErrors.address && "border-destructive focus:border-destructive focus:ring-destructive/20 bg-destructive/5"
                    )}
                  />
                  {providerErrors.address && (
                    <p className="text-[11px] font-bold text-destructive ml-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                      <AlertTriangle className="h-3 w-3" />
                      {providerErrors.address}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  variant="outline" 
                  onClick={handleCloseProviderModal}
                  className="flex-1 h-12 rounded-xl font-bold border-slate-200 hover:bg-slate-50 text-slate-600 transition-all"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateProvider}
                  disabled={savingProvider}
                  className="flex-[2] h-12 rounded-xl font-black bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all disabled:opacity-70"
                >
                  {savingProvider ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Guardando...
                    </div>
                  ) : (
                    "Guardar Proveedor"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
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
      </div>
  )
}
