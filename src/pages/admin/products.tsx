import { useState, useEffect, useRef } from "react"
import {
  Plus,
  Search,
  Edit,
  Package,
  X,
  AlertTriangle,
  Grid,
  List,
  Eye,
  EyeOff,
  Calculator,
  DollarSign,
  Truck,
  TrendingUp,
  Percent,
  Loader2,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { AdminPageHeader } from "@/components/admin/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { ImageUpload } from "@/components/admin/image-upload"
import { MultiSelect } from "@/components/ui/multi-select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Pagination } from "@/components/admin/pagination"
import { api } from "@/lib/api"
import { formatUSD, cn, fuzzySearch } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import type { ProductImage } from "@/types"

interface Product {
  id: string
  name: string
  productCode: string
  sku: string
  description: string
  price: number
  purchasePrice: number
  profitMargin: number
  originalPrice: number | null
  stock: number
  minStock?: number
  inStock: boolean
  categoryIds: string[]
  categoryName?: string
  brand: string
  format: string
  isFeatured: boolean
  isActive: boolean
  isOffer?: boolean
  image: string
  images?: ProductImage[]
  categories?: { id: string; name: string }[]
  batches?: any[]
  priceHistory?: any[]
  salesCount?: number
  viewCount?: number
  createdAt?: string
  _count?: {
    batches: number
    inventoryBatchItems: number
    saleItems: number
    cartItems: number
    favorites: number
    requirementItems: number
  }
}

interface ImportResult {
  success: boolean
  total: number
  created: number
  updated: number
  errors: number
  details?: {
    created: { sku: string; id: string; name: string }[]
    updated: { sku: string; id: string; name: string }[]
    errors: { row: number; sku: string; error: string }[]
  }
}

interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  image?: string | null
  icon?: string | null
  isActive: boolean
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

interface Provider {
  id: string
  name: string
  country?: string | null
  address?: string | null
}

interface ProductFormData {
  name: string
  productCode: string
  sku: string
  description: string
  price: number
  purchasePrice: number
  profitMargin: number
  originalPrice: number | null
  stock: number
  categoryIds: string[]
  brand: string
  format: string
  isFeatured: boolean
  isActive: boolean
  image: string
  images: Partial<ProductImage>[]
  batchNumber?: string
  expirationDate?: string
  supplierId?: string
}

interface ProductErrors {
  name?: string
  productCode?: string
  sku?: string
  categoryIds?: string
  brand?: string
  format?: string
  description?: string
  images?: string
  price?: string
}

export function AdminProductsPage() {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [supplierFilter, setSupplierFilter] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  const [sortBy, setSortBy] = useState<"name" | "price" | "stock" | "createdAt">("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [activeTab, setActiveTab] = useState("active")
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("adminProductsViewMode") as "grid" | "list") || "grid"
    }
    return "grid"
  })
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null)
  const [errors, setErrors] = useState<ProductErrors>({})
  const [customFormat, setCustomFormat] = useState("")
  const [showCustomFormat, setShowCustomFormat] = useState(false)
  const [customBrand, setCustomBrand] = useState("")
  const [showCustomBrand, setShowCustomBrand] = useState(false)
  const [brands, setBrands] = useState<any[]>([])
  const [formats, setFormats] = useState<any[]>([])

  // Price calculator states
  const [showCalculator, setShowCalculator] = useState(false)
  const [shippingCostPerOrder, setShippingCostPerOrder] = useState(0)
  const [calculatorQuantity, setCalculatorQuantity] = useState(1)
  const [bcvRate, setBcvRate] = useState<number>(0)
  const [loadingBcv, setLoadingBcv] = useState(false)

  // Bulk selection state
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [bulkAction, setBulkAction] = useState<"activate" | "deactivate" | "feature" | "unfeature" | "delete">("activate")

  // CSV Import states
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // States for ConfirmDialog
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
    onConfirm: () => { },
  })

  const confirmAction = (config: Omit<typeof confirmConfig, "open">) => {
    setConfirmConfig({ ...config, open: true })
  }

  // Check if form has changes
  const hasChanges = () => {
    if (editingProduct) {
      // Logic to compare formData with editingProduct
      return (
        formData.name !== String(editingProduct.name || "") ||
        formData.description !== String(editingProduct.description || "") ||
        Number(formData.price) !== Number(editingProduct.price) ||
        Number(formData.purchasePrice) !== Number(editingProduct.purchasePrice) ||
        formData.brand !== String(editingProduct.brand || "") ||
        formData.format !== String(editingProduct.format || "") ||
        formData.categoryIds.length !== (editingProduct.categoryIds?.length || 0)
      )
    }
    return (
      formData.name !== "" ||
      formData.description !== "" ||
      formData.price !== 0 ||
      formData.purchasePrice !== 0 ||
      formData.brand !== "" ||
      formData.format !== "" ||
      formData.categoryIds.length > 0
    )
  }

  const handleOpenAdd = () => {
    resetForm()
    fetchBCVRate()
    setShowAddDialog(true)
  }

  const handleCloseModal = () => {
    if (hasChanges()) {
      confirmAction({
        title: "¿Salir sin guardar?",
        description: "Tienes cambios sin guardar. Si sales ahora, perderás toda la información ingresada.",
        confirmText: "Salir sin guardar",
        variant: "destructive",
        onConfirm: () => {
          setShowAddDialog(false)
          resetForm()
        }
      })
    } else {
      setShowAddDialog(false)
      resetForm()
    }
  }

  const generateProductCode = () => {
    const prefix = "ANA"
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `${prefix}-${timestamp}-${random}`
  }
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    productCode: "",
    sku: "",
    description: "",
    price: 0,
    purchasePrice: 0,
    profitMargin: 35,
    originalPrice: null,
    stock: 0,
    categoryIds: [],
    brand: "",
    format: "",
    isFeatured: false,
    isActive: true,
    image: "/placeholder.jpg",
    images: [],
    batchNumber: "",
    expirationDate: "",
    supplierId: "",
  })

  useEffect(() => {
    localStorage.setItem("adminProductsViewMode", viewMode)
  }, [viewMode])

  useEffect(() => {
    async function loadData() {
      await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchBrands(),
        fetchFormats(),
        fetchProviders()
      ])
    }
    loadData()
  }, [])

  const fetchBCVRate = async () => {
    setLoadingBcv(true)
    try {
      const data = await api.getBCVRate()
      if (data && data.rate) {
        setBcvRate(data.rate)
      }
    } catch (error) {
      console.error("Error fetching BCV rate:", error)
    } finally {
      setLoadingBcv(false)
    }
  }

  const fetchProviders = async () => {
    try {
      const data = await api.getProviders()
      setProviders(data?.providers || [])
    } catch (error) {
      console.error("Error fetching providers:", error)
    }
  }

  const fetchFormats = async () => {
    try {
      const data = await api.getFormats()
      setFormats(data || [])
    } catch (error) {
      console.error("Error fetching formats:", error)
    }
  }

  const fetchBrands = async () => {
    try {
      const data = await api.getBrands()
      setBrands(data)
    } catch (error) {
      console.error("Error fetching brands:", error)
    }
  }

  const fetchProducts = async () => {
    try {
      const data = await api.getAdminProducts({ limit: 2000 })
      setProducts(data.products || [])
    } catch (error: any) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const data = await api.getAdminCategories()
      setCategories(data.categories || [])
    } catch (error: any) {
      console.error("Error fetching categories:", error)
    }
  }

  const handleCreateCategory = async (name: string) => {
    try {
      const result = await api.createCategory({
        name,
        isActive: true,
        sortOrder: 0
      }) as any

      // Actualizar la lista de categorías localmente
      await fetchCategories()

      return {
        label: result.name,
        value: result.id
      }
    } catch (error: any) {
      console.error("Error creating category:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la categoría",
        variant: "destructive",
      })
      return null
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      productCode: generateProductCode(),
      sku: "",
      description: "",
      price: 0,
      purchasePrice: 0,
      profitMargin: 35,
      originalPrice: null,
      stock: 0,
      categoryIds: [],
      brand: "",
      format: "",
      isFeatured: false,
      isActive: true,
      image: "/placeholder.jpg",
      images: [],
      batchNumber: "",
      expirationDate: "",
      supplierId: "",
    })
    setEditingProduct(null)
    setShowCustomBrand(false)
    setShowCustomFormat(false)
    setCustomBrand("")
    setCustomFormat("")
    setSelectedProducts([])
    setShippingCostPerOrder(0)
    setCalculatorQuantity(1)
  }

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const handleBulkAction = async (action: 'active' | 'inactive' | 'featured' | 'unfeatured' | 'delete') => {
    if (selectedProducts.length === 0) return

    confirmAction({
      title: "¿Confirmar acción masiva?",
      description: `¿Estás seguro de que deseas ejecutar esta acción en ${selectedProducts.length} productos seleccionados?`,
      confirmText: "Confirmar",
      variant: action === 'delete' ? 'destructive' : 'default',
      onConfirm: async () => {
        try {
          for (const productId of selectedProducts) {
            if (action === "delete") {
              await api.updateProduct(productId, { isActive: false })
            } else {
              const updates: any = {}
              if (action === "active") updates.isActive = true
              if (action === "inactive") updates.isActive = false
              if (action === "featured") updates.isFeatured = true
              if (action === "unfeatured") updates.isFeatured = false
              await api.updateProduct(productId, updates)
            }
          }
          toast({ title: "Éxito", description: `${selectedProducts.length} productos actualizados` })
          setSelectedProducts([])
          fetchProducts()
        } catch (error) {
          toast({ title: "Error", description: "Error al procesar acción masiva", variant: "destructive" })
        }
      }
    })
  }

  const handleCSVImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      toast({ title: "Error", description: "Por favor selecciona un archivo CSV", variant: "destructive" })
      return
    }

    setImporting(true)
    setImportResult(null)

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        toast({ title: "Error", description: "El CSV debe tener al menos una fila de encabezado y una fila de datos", variant: "destructive" })
        setImporting(false)
        return
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      
      const products: any[] = []
      const errors: string[] = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        if (values.length !== headers.length) {
          errors.push(`Fila ${i + 1}: Número de columnas incorrecto`)
          continue
        }

        const product: any = {}
        headers.forEach((header, index) => {
          const value = values[index]
          switch (header) {
            case 'sku':
              product.sku = value
              break
            case 'name':
            case 'nombre':
              product.name = value
              break
            case 'description':
            case 'descripcion':
              product.description = value
              break
            case 'price':
            case 'precio':
              product.price = value
              break
            case 'purchaseprice':
            case 'preciocompra':
            case 'cost':
            case 'costo':
              product.purchasePrice = value
              break
            case 'stock':
              product.stock = value
              break
            case 'minstock':
            case 'stockmin':
              product.minStock = value
              break
            case 'brand':
            case 'marca':
              product.brand = value
              break
            case 'format':
            case 'formato':
              product.format = value
              break
            case 'image':
            case 'imagen':
              product.image = value
              break
            case 'categorynames':
            case 'categorias':
              product.categoryNames = value
              break
            case 'categoryids':
            case 'idscategorias':
              product.categoryIds = value
              break
            case 'isactive':
            case 'activo':
              product.isActive = value
              break
            case 'isfeatured':
            case 'destacado':
              product.isFeatured = value
              break
            case 'isoffer':
            case 'oferta':
              product.isOffer = value
              break
          }
        })
        products.push(product)
      }

      if (products.length === 0) {
        toast({ title: "Error", description: "No se encontraron productos válidos para importar", variant: "destructive" })
        setImporting(false)
        return
      }

      const result = await api.importProductsCSV(products) as ImportResult
      setImportResult(result)
      
      if (result.errors === 0) {
        toast({ title: "Éxito", description: `${result.created} productos creados, ${result.updated} actualizados` })
        fetchProducts()
      } else if (result.created > 0 || result.updated > 0) {
        toast({ title: "Parcial", description: `${result.created} creados, ${result.updated} actualizados, ${result.errors} errores`, variant: "default" })
        fetchProducts()
      } else {
        toast({ title: "Error", description: "Todos los productos tuvieron errores", variant: "destructive" })
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Error al importar productos", variant: "destructive" })
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const exportProductsToCSV = () => {
    const headers = ['sku', 'name', 'description', 'price', 'purchasePrice', 'stock', 'minStock', 'brand', 'format', 'categoryNames', 'isActive', 'isFeatured', 'isOffer']
    const rows = products.map(p => [
      p.sku,
      p.name,
      p.description?.replace(/,/g, ';') || '',
      p.price,
      p.purchasePrice,
      p.stock,
      p.minStock || 5,
      p.brand,
      p.format,
      p.categories?.map(c => c.name).join('|') || '',
      p.isActive,
      p.isFeatured,
      p.isOffer,
    ])

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `productos_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    
    toast({ title: "Éxito", description: "Productos exportados exitosamente" })
  }

  const validateForm = (): boolean => {
    const newErrors: ProductErrors = {}
    let isValid = true

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es obligatorio"
      isValid = false
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "El nombre debe tener al menos 3 caracteres"
      isValid = false
    }

    if (!formData.productCode.trim()) {
      newErrors.productCode = "El código de producto es obligatorio"
      isValid = false
    }

    if (formData.categoryIds.length === 0) {
      newErrors.categoryIds = "Debes seleccionar al menos una categoría"
      isValid = false
    }

    if (!formData.brand.trim()) {
      newErrors.brand = "La marca es obligatoria"
      isValid = false
    }

    if (!formData.format.trim()) {
      newErrors.format = "El formato es obligatorio"
      isValid = false
    }

    if (!formData.description.trim()) {
      newErrors.description = "La descripción es obligatoria"
      isValid = false
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "La descripción debe tener al menos 10 caracteres"
      isValid = false
    }

    if (formData.images.length === 0) {
      newErrors.images = "Debes añadir al menos una imagen"
      isValid = false
    }

    if (Number(formData.price) > 0 && Number(formData.price) < Number(formData.purchasePrice)) {
      newErrors.price = "El precio de venta no puede ser menor al precio de compra"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSave = async () => {
    if (!validateForm()) return

    confirmAction({
      title: editingProduct ? "¿Guardar cambios?" : "¿Crear nuevo producto?",
      description: editingProduct
        ? "¿Estás seguro de que deseas actualizar la información de este producto?"
        : "¿Estás seguro de que deseas añadir este nuevo producto al catálogo?",
      confirmText: editingProduct ? "Guardar cambios" : "Crear producto",
      onConfirm: async () => {
        setSaving(true)
        try {
          const { batchNumber, expirationDate, ...rest } = formData

          // Clean up the data before sending
          const productData = {
            ...rest,
            price: Number(formData.price),
            purchasePrice: Number(formData.purchasePrice),
            profitMargin: Number(formData.profitMargin),
            stock: Number(formData.stock),
            originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
            supplierId: formData.supplierId || null,
          }

          if (editingProduct) {
            // Update existing product
            await api.updateProduct(editingProduct.id, productData)
            toast({
              title: "Producto actualizado",
              description: "Los cambios se han guardado correctamente.",
            })
          } else {
            // Create new product
            const createData = {
              ...productData,
              ...(formData.batchNumber ? { batchNumber: formData.batchNumber } : {}),
              ...(formData.expirationDate ? { expirationDate: formData.expirationDate } : {}),
            }
            await api.createProduct(createData)
            toast({
              title: "Producto creado",
              description: "El nuevo producto ha sido añadido al catálogo.",
            })
          }

          setShowAddDialog(false)
          resetForm()
          fetchProducts()
          fetchBrands()
        } catch (error: any) {
          console.error("Error saving product:", error)
          const details = error.data?.error?.details
          let errorMessage = error.message || "Error al guardar el producto"

          if (Array.isArray(details)) {
            errorMessage = `Error de validación: ${details.map((d: any) => d.message).join(", ")}`
          }

          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          })
        } finally {
          setSaving(false)
        }
      }
    })
  }

  const handleEdit = (product: Product) => {
    console.log("Editing product:", product);
    setEditingProduct(product)

    // Extract categoryIds correctly handling both array and single string (legacy)
    let catIds: string[] = []
    if (Array.isArray(product.categoryIds)) {
      catIds = product.categoryIds
    } else if (typeof (product as any).categoryId === 'string' && (product as any).categoryId) {
      catIds = [(product as any).categoryId]
    } else if (Array.isArray(product.categories)) {
      catIds = product.categories.map(c => c.id)
    } else if ((product as any).category?.id) {
      catIds = [(product as any).category.id]
    }

    const brandValue = typeof product.brand === 'string'
      ? product.brand
      : (product as any).brandName || (product as any).brand?.name || ""

    const formatValue = String(product.format || "")

    const newFormData: ProductFormData = {
      name: String(product.name || ""),
      productCode: String((product as any).productCode || (product as any).code || generateProductCode()),
      sku: String(product.sku || ""),
      description: String(product.description || ""),
      price: Number(product.price) || 0,
      purchasePrice: Number(product.purchasePrice) || 0,
      profitMargin: Number(product.profitMargin) || 35,
      originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
      stock: Number(product.stock) || 0,
      categoryIds: catIds,
      brand: String(brandValue || ""),
      format: String(formatValue || ""),
      isFeatured: !!product.isFeatured,
      isActive: !!product.isActive,
      image: String(product.image || "/placeholder.jpg"),
      images: Array.isArray(product.images)
        ? product.images.map(img => ({
          id: img.id,
          url: img.url,
          thumbnail: img.thumbnail,
          medium: img.medium,
          large: img.large,
          isMain: !!img.isMain,
          sortOrder: Number(img.sortOrder) || 0
        }))
        : [],
      batchNumber: "",
      expirationDate: "",
      supplierId: (product as any).supplierId || "",
    }

    console.log("Setting form data:", newFormData);
    setFormData(newFormData)

    // Reset custom brand/format states if they match existing options
    if (brandValue && !brands.includes(brandValue)) {
      setBrands(prev => [...new Set([...prev, brandValue])].sort())
    }

    setShowCustomBrand(false)
    setShowCustomFormat(false)
    setCustomBrand("")
    setCustomFormat("")

    fetchBCVRate()
    setShowAddDialog(true)
  }

  const [showAddStockDialog, setShowAddStockDialog] = useState(false)
  const [productToAddStock, setProductToAddStock] = useState<Product | null>(null)
  const [batchFormData, setBatchFormData] = useState({
    batchNumber: "",
    expirationDate: "",
    purchasePrice: 0,
    salePrice: 0,
    stock: 1
  })

  const handleAddStock = async () => {
    if (!productToAddStock) return

    confirmAction({
      title: "¿Registrar reabastecimiento?",
      description: `Se registrará un nuevo lote con ${batchFormData.stock} unidades para "${productToAddStock.name}".`,
      confirmText: "Registrar reabastecimiento",
      onConfirm: async () => {
        try {
          const updateData = {
            batch: {
              batchNumber: batchFormData.batchNumber,
              expirationDate: new Date().toISOString().split('T')[0], // Guardamos la fecha actual como registro
              purchasePrice: batchFormData.purchasePrice,
              salePrice: batchFormData.salePrice,
              stock: batchFormData.stock
            }
          }
          await api.updateProduct(productToAddStock.id, updateData)
          toast({
            title: "Stock actualizado",
            description: `Se han añadido ${batchFormData.stock} unidades correctamente.`,
          })
          setShowAddStockDialog(false)
          setProductToAddStock(null)
          setBatchFormData({
            batchNumber: "",
            expirationDate: "",
            purchasePrice: 0,
            salePrice: 0,
            stock: 1
          })
          fetchProducts()
        } catch (error: any) {
          console.error("Error adding stock:", error)
          toast({
            title: "Error",
            description: error.message || "Error al añadir stock",
            variant: "destructive",
          })
        }
      }
    })
  }

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    confirmAction({
      title: currentStatus ? "¿Desactivar producto?" : "¿Reactivar producto?",
      description: currentStatus
        ? `¿Estás seguro de que deseas desactivar "${product.name}"? El producto ya no será visible para los clientes.`
        : `¿Estás seguro de que deseas reactivar "${product.name}"? Deberás registrar un nuevo lote de stock para activarlo correctamente.`,
      confirmText: currentStatus ? "Desactivar" : "Reactivar",
      variant: currentStatus ? "destructive" : "default",
      onConfirm: async () => {
        try {
          await api.updateProduct(productId, { isActive: !currentStatus })
          toast({
            title: currentStatus ? "Producto desactivado" : "Producto reactivado",
            description: `"${product.name}" ha sido ${currentStatus ? 'desactivado' : 'reactivado'} correctamente.`,
          })

          if (!currentStatus) { // Si se está activando
            setProductToAddStock(product)
            setBatchFormData({
              batchNumber: `RESTOCK-${Date.now()}`,
              expirationDate: "",
              purchasePrice: Number(product.purchasePrice),
              salePrice: Number(product.price),
              stock: 1
            })
            setShowAddStockDialog(true)
          }
          fetchProducts()
        } catch (error: any) {
          toast({
            title: "Error",
            description: "No se pudo cambiar el estado del producto.",
            variant: "destructive",
          })
        }
      }
    })
  }



  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      fuzzySearch(searchTerm, product.name) ||
      fuzzySearch(searchTerm, product.sku) ||
      fuzzySearch(searchTerm, product.brand)
    const matchesCategory = categoryFilter === "all" ||
      (product.categoryIds && product.categoryIds.includes(categoryFilter)) ||
      (product.categories && product.categories.some(c => c.id === categoryFilter)) ||
      (product as any).categoryId === categoryFilter
    const matchesSupplier = supplierFilter === "all" ||
      (product as any).supplierId === supplierFilter
    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "low" && product.stock < 10) ||
      (stockFilter === "out" && product.stock === 0) ||
      (stockFilter === "in" && product.stock >= 10)

    const matchesStatus = activeTab === "all" ||
      (activeTab === "active" && product.isActive) ||
      (activeTab === "inactive" && !product.isActive)

    return matchesSearch && matchesCategory && matchesSupplier && matchesStock && matchesStatus
  }).sort((a, b) => {
    let comparison = 0
    if (sortBy === "name") comparison = a.name.localeCompare(b.name)
    else if (sortBy === "price") comparison = (a.price || 0) - (b.price || 0)
    else if (sortBy === "stock") comparison = a.stock - b.stock
    else if (sortBy === "createdAt") comparison = new Date((a as any).createdAt || 0).getTime() - new Date((b as any).createdAt || 0).getTime()
    return sortOrder === "asc" ? comparison : -comparison
  })

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const lowStockCount = products.filter(p => p.stock < 10).length
  const outOfStockCount = products.filter(p => p.stock === 0).length

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/4"></div>
        <div className="h-64 bg-muted rounded"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0" role="main" aria-label="Gestión de Productos">
      <div className="flex items-center justify-between">
        <AdminPageHeader
          title="Productos"
          subtitle="Gestiona tu catálogo de productos y existencias"
          icon={Package}
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowImportDialog(true)
            }}
            className="h-9 text-xs"
          >
            <Upload className="h-3.5 w-3.5 mr-2" />
            Importar CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportProductsToCSV}
            className="h-9 text-xs"
          >
            <Download className="h-3.5 w-3.5 mr-2" />
            Exportar
          </Button>
          <Button
            size="sm"
            onClick={() => handleOpenAdd()}
            className="h-9 text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-2" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-4 border-slate-100 dark:border-border/60 shadow-sm bg-white dark:bg-card rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 dark:bg-primary/10 rounded-xl">
              <Package className="h-5 w-5 text-slate-600 dark:text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Productos</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{products.length}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-slate-100 dark:border-border/60 shadow-sm bg-white dark:bg-card rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Stock Bajo</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{lowStockCount}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-slate-100 dark:border-border/60 shadow-sm bg-white dark:bg-card rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-xl">
              <EyeOff className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sin Existencia</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{outOfStockCount}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-slate-100 dark:border-border/60 shadow-sm bg-white dark:bg-card rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
              <Grid className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Categorías</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{categories.length}</h3>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 p-1 flex-wrap h-auto rounded-xl w-full sm:w-fit justify-start">
            <TabsTrigger value="active" className="rounded-lg px-4 py-2 text-xs font-bold whitespace-nowrap flex-1 sm:flex-none">Activos</TabsTrigger>
            <TabsTrigger value="inactive" className="rounded-lg px-4 py-2 text-xs font-bold whitespace-nowrap flex-1 sm:flex-none">Inactivos</TabsTrigger>
            <TabsTrigger value="all" className="rounded-lg px-4 py-2 text-xs font-bold whitespace-nowrap flex-1 sm:flex-none">Todos</TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 w-full sm:w-64 bg-white border border-slate-200 focus-visible:ring-primary/20 rounded-xl text-xs transition-all dark:bg-card dark:border-border"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px] h-10 rounded-xl border-slate-200 bg-white dark:bg-card dark:border-border text-xs">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-[130px] h-10 rounded-xl border-slate-200 bg-white dark:bg-card dark:border-border text-xs">
                <SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo</SelectItem>
                <SelectItem value="in">Disponible</SelectItem>
                <SelectItem value="low">Stock Bajo</SelectItem>
                <SelectItem value="out">Agotado</SelectItem>
              </SelectContent>
            </Select>

            {providers.length > 0 && (
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger className="w-[150px] h-10 rounded-xl border-slate-200 bg-white dark:bg-card dark:border-border text-xs">
                  <SelectValue placeholder="Proveedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {providers.map(provider => (
                    <SelectItem key={provider.id} value={provider.id}>{provider.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="flex bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl gap-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

          </div>
        </div>

        {selectedProducts.length > 0 && (
          <div className="bg-primary/5 border border-primary/20 dark:bg-primary/10 rounded-xl p-3 flex items-center justify-between mt-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center bg-primary text-primary-foreground text-xs font-bold size-6 rounded-full">
                {selectedProducts.length}
              </span>
              <span className="text-sm font-semibold text-primary dark:text-primary-foreground">
                productos seleccionados
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs border-primary/20 text-primary hover:bg-primary hover:text-white dark:hover:text-primary-foreground" onClick={() => handleBulkAction('featured')}>
                Destacar
              </Button>
              <Button size="sm" variant="destructive" className="h-8 text-xs bg-red-50 text-red-600 hover:bg-red-100 border-0 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40" onClick={() => handleBulkAction('delete')}>
                <EyeOff className="h-3 w-3 mr-1" />
                Desactivar Masivamente
              </Button>
            </div>
          </div>
        )}

        <TabsContent value={activeTab} className="mt-0">
          {viewMode === "list" ? (
            <Card className="rounded-2xl border border-slate-100 shadow-sm bg-white dark:bg-card dark:border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left bg-white dark:bg-card">
                  <thead className="bg-[#FBFCFD] dark:bg-slate-800 border-b border-slate-100 dark:border-border/60">
                    <tr>
                      <th className="px-6 py-4 w-12 text-center">
                        <Checkbox checked={selectedProducts.length === paginatedProducts.length && paginatedProducts.length > 0} onCheckedChange={(checked) => setSelectedProducts(checked ? paginatedProducts.map(p => p.id) : [])} />
                      </th>
                      <th
                        className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors"
                        onClick={() => { setSortBy("name"); setSortOrder(sortOrder === "asc" ? "desc" : "asc") }}
                      >
                        PRODUCTO {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">CATEGORÍA</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center">ESTADO</th>
                      <th
                        className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors text-center"
                        onClick={() => { setSortBy("stock"); setSortOrder(sortOrder === "asc" ? "desc" : "asc") }}
                      >
                        STOCK {sortBy === "stock" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th
                        className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors text-right"
                        onClick={() => { setSortBy("price"); setSortOrder(sortOrder === "asc" ? "desc" : "asc") }}
                      >
                        PRECIO {sortBy === "price" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">ACCIÓN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-border/40">
                    {paginatedProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <Checkbox
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={() => toggleProductSelection(product.id)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="bg-slate-100 dark:bg-slate-800 aspect-square rounded-lg size-10 flex-shrink-0 overflow-hidden border border-slate-200 dark:border-border group-hover:border-primary/30 transition-colors">
                              <img
                                src={product.images?.find(img => img.isMain)?.url || product.image || "/placeholder.jpg"}
                                alt=""
                                className="w-full h-full object-contain p-1"
                              />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{product.name}</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium font-mono tracking-tighter">SKU: {product.sku || 'N/A'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400 font-bold uppercase">
                          {product.categories && product.categories.length > 0
                            ? product.categories[0].name
                            : (product as any).category?.name || (product as any).categoryName || "Sin Categoría"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button onClick={() => toggleProductStatus(product.id, product.isActive)}>
                            {product.isActive ? (
                              <span className="inline-flex items-center bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-900/30 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full hover:bg-emerald-100 transition-colors">
                                Activo
                              </span>
                            ) : (
                              <span className="inline-flex items-center bg-slate-50 text-slate-500 border border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-border text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full hover:bg-slate-100 transition-colors">
                                Inactivo
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-700 dark:text-slate-300 text-center">
                          <span className={cn(
                            "px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 min-w-[30px] inline-block",
                            product.stock < 10 ? "text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400" : "text-slate-700 dark:text-slate-300"
                          )}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-slate-900 dark:text-white text-right">
                          {formatUSD(product.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg"
                              onClick={() => handleEdit(product)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn("h-8 w-8 rounded-lg", product.isActive ? "text-emerald-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20" : "text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20")}
                              onClick={() => toggleProductStatus(product.id, product.isActive)}
                              title={product.isActive ? 'Desactivar producto' : 'Reactivar producto'}
                            >
                              {product.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden border-slate-100 dark:border-border/60 group hover:shadow-lg transition-all duration-300 rounded-2xl bg-white dark:bg-card">
                  <div className="relative aspect-square bg-slate-50 dark:bg-slate-800">
                    <img
                      src={product.images?.find(img => img.isMain)?.url || product.image || "/placeholder.jpg"}
                      alt={product.name}
                      className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 flex flex-col gap-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-full bg-white/90 dark:bg-slate-900/90 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant={product.isActive ? "secondary" : "default"}
                        size="icon"
                        className={cn("h-8 w-8 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity", product.isActive ? "bg-white/90 dark:bg-slate-900/90 text-amber-500 hover:text-amber-600" : "bg-emerald-500 text-white hover:bg-emerald-600")}
                        onClick={() => toggleProductStatus(product.id, product.isActive)}
                        title={product.isActive ? 'Desactivar' : 'Reactivar'}
                      >
                        {product.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                    {product.stock < 10 && (
                      <div className="absolute top-3 left-3">
                        <Badge variant="destructive" className="font-bold text-[10px] uppercase px-2 shadow-sm animate-pulse">
                          {product.stock === 0 ? "Agotado" : "Stock Bajo"}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="mb-1">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">
                        {product.categories?.[0]?.name || (product as any).category?.name || "Catálogo"}
                      </p>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 mb-2 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {formatUSD(product.price)}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          Existencia: {product.stock}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className={cn("h-8 w-8 p-0 rounded-full", product.isActive ? "text-emerald-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-500" : "text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-500")}
                        onClick={() => toggleProductStatus(product.id, product.isActive)}
                        title={product.isActive ? 'Desactivar' : 'Reactivar'}
                      >
                        {product.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {filteredProducts.length === 0 && (
            <div className="py-20 text-center bg-white dark:bg-card rounded-2xl border border-slate-100 dark:border-border/60">
              <Package className="h-12 w-12 mx-auto text-slate-200 dark:text-slate-800 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No se encontraron productos</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto text-sm mt-1">
                Intenta ajustar tus criterios de búsqueda o filtros para encontrar lo que buscas.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {filteredProducts.length > 0 && (
        <div className="mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredProducts.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(count) => { setItemsPerPage(count); setCurrentPage(1); }}
            showItemsPerPage
          />
        </div>
      )}

      {/* Add Stock Dialog */}
      <Dialog open={showAddStockDialog} onOpenChange={setShowAddStockDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reabastecimiento / Reactivación</DialogTitle>
            <DialogDescription>
              Añade un nuevo lote para <strong>{productToAddStock?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Nro Lote</label>
                <Input
                  value={batchFormData.batchNumber}
                  onChange={(e) => setBatchFormData({ ...batchFormData, batchNumber: e.target.value })}
                  placeholder="Ej: LOTE-2024"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Costo Compra</label>
                <Input
                  type="number"
                  value={batchFormData.purchasePrice}
                  onChange={(e) => setBatchFormData({ ...batchFormData, purchasePrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Precio Venta</label>
                <Input
                  type="number"
                  value={batchFormData.salePrice}
                  onChange={(e) => setBatchFormData({ ...batchFormData, salePrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Cantidad</label>
                <Input
                  type="number"
                  value={batchFormData.stock}
                  onChange={(e) => setBatchFormData({ ...batchFormData, stock: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              variant="default"
              onClick={handleAddStock}
              disabled={!batchFormData.batchNumber || batchFormData.stock <= 0}
            >
              Registrar Lote y Stock
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAddStockDialog(false)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        if (!open) {
          handleCloseModal()
        } else {
          setShowAddDialog(true)
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Producto" : "Agregar Nuevo Producto"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? "Modifica los detalles del producto existente." : "Completa la información para agregar un nuevo producto al catálogo."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium">Nombre del producto *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    if (errors.name) setErrors({ ...errors, name: undefined })
                  }}
                  placeholder="Nombre del producto"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Código de producto *</label>
                <Input
                  value={formData.productCode}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                  placeholder="Auto-generado"
                />
                {errors.productCode && <p className="text-xs text-red-500 mt-1">{errors.productCode}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">SKU (Opcional)</label>
                <Input
                  value={formData.sku}
                  onChange={(e) => {
                    setFormData({ ...formData, sku: e.target.value })
                    if (errors.sku) setErrors({ ...errors, sku: undefined })
                  }}
                  placeholder="Auto-generado"
                  className={errors.sku ? "border-red-500" : ""}
                />
                {errors.sku && <p className="text-xs text-red-500 mt-1">{errors.sku}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Categorías *</label>
                <MultiSelect
                  options={categories.map(cat => ({ label: String(cat.name || ""), value: cat.id }))}
                  selected={formData.categoryIds}
                  onChange={(val) => {
                    setFormData({ ...formData, categoryIds: val })
                    if (errors.categoryIds) setErrors({ ...errors, categoryIds: undefined })
                  }}
                  onCreateOption={handleCreateCategory}
                  placeholder="Seleccionar categorías"
                  className={errors.categoryIds ? "border-red-500" : ""}
                />
                {errors.categoryIds && <p className="text-xs text-red-500 mt-1">{errors.categoryIds}</p>}
              </div>
              <div>
                <label className="text-sm font-medium" id="brand-label">Marca *</label>
                <MultiSelect
                  options={brands.map(brand => {
                    const brandValue = typeof brand === 'string' ? brand : (brand as any).name || "";
                    return { label: brandValue, value: brandValue }
                  }).filter(opt => opt.value)}
                  selected={formData.brand ? [formData.brand] : []}
                  onChange={(val) => {
                    const newVal = val[val.length - 1] || "" // Single select logic
                    setFormData({ ...formData, brand: newVal })
                    if (errors.brand) setErrors({ ...errors, brand: undefined })
                    setShowCustomBrand(false)
                  }}
                  onCreateOption={async (label) => {
                    try {
                      await api.createBrand({ name: label, isActive: true })
                      fetchBrands()
                    } catch (error) {
                      console.error("Error creating brand:", error)
                    }
                    setFormData({ ...formData, brand: label })
                    return { label, value: label }
                  }}
                  placeholder="Seleccionar marca"
                  className={errors.brand ? "border-red-500" : ""}
                />

                {showCustomBrand && (
                  <div className="flex gap-2 mt-2" role="group" aria-label="Añadir nueva marca">
                    <Input
                      value={customBrand}
                      onChange={(e) => setCustomBrand(e.target.value)}
                      placeholder="Escribe la marca..."
                      className="flex-1"
                      aria-label="Nombre de la nueva marca"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const submitBtn = e.currentTarget.nextElementSibling as HTMLButtonElement;
                          submitBtn?.click();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (customBrand.trim()) {
                          const newBrand = customBrand.trim()
                          setFormData({ ...formData, brand: newBrand })
                          if (!brands.some(b => (b.name || b) === newBrand)) {
                            setBrands(prev => [...prev, { name: newBrand, isActive: true }].sort((a, b) => (a.name || a).localeCompare(b.name || b)))
                          }
                          setShowCustomBrand(false)
                          setCustomBrand("")
                          if (errors.brand) setErrors({ ...errors, brand: undefined })
                        }
                      }}
                      aria-label="Confirmar nueva marca"
                    >
                      Añadir
                    </Button>
                  </div>
                )}
                {errors.brand && <p className="text-xs text-red-500 mt-1" role="alert">{errors.brand}</p>}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block" id="images-label">Imágenes del producto</label>
              <ImageUpload
                images={formData.images}
                onChange={(images) => {
                  setFormData({ ...formData, images })
                  if (errors.images) setErrors({ ...errors, images: undefined })
                }}
                aria-labelledby="images-label"
              />
              {errors.images && <p className="text-xs text-red-500 mt-1" role="alert">{errors.images}</p>}
            </div>

            <div>
              <label className="text-sm font-medium" id="format-label">Formato *</label>
              <MultiSelect
                options={formats.map(f => ({ label: f.name || f, value: f.name || f }))}
                selected={formData.format ? [formData.format] : []}
                onChange={(val) => {
                  const newVal = val[val.length - 1] || "" // Single select logic
                  setFormData({ ...formData, format: newVal })
                  if (errors.format) setErrors({ ...errors, format: undefined })
                  setShowCustomFormat(false)
                }}
                onCreateOption={async (label) => {
                  try {
                    await api.createFormat({ name: label, isActive: true })
                    fetchFormats()
                  } catch (error) {
                    console.error("Error creating format:", error)
                  }
                  setFormData({ ...formData, format: label })
                  return { label, value: label }
                }}
                placeholder="Seleccionar formato"
                className={errors.format ? "border-red-500" : ""}
              />

              {showCustomFormat && (
                <div className="flex gap-2 mt-2" role="group" aria-label="Añadir nuevo formato">
                  <Input
                    value={customFormat}
                    onChange={(e) => setCustomFormat(e.target.value)}
                    placeholder="Escribe el formato..."
                    className="flex-1"
                    aria-label="Nombre del nuevo formato"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const submitBtn = e.currentTarget.nextElementSibling as HTMLButtonElement;
                        submitBtn?.click();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (customFormat.trim()) {
                        const newFormat = customFormat.trim()
                        setFormData({ ...formData, format: newFormat })
                        setShowCustomFormat(false)
                        setCustomFormat("")
                        if (errors.format) setErrors({ ...errors, format: undefined })
                      }
                    }}
                    aria-label="Confirmar nuevo formato"
                  >
                    Añadir
                  </Button>
                </div>
              )}
              {errors.format && <p className="text-xs text-red-500 mt-1" role="alert">{errors.format}</p>}
            </div>

            <div>
              <label className="text-sm font-medium" id="description-label">Descripcion</label>
              <Textarea
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value })
                  if (errors.description) setErrors({ ...errors, description: undefined })
                }}
                placeholder="Descripcion del producto"
                className={cn(
                  "min-h-[100px]",
                  errors.description ? "border-red-500" : ""
                )}
                aria-labelledby="description-label"
              />
              {errors.description && <p className="text-xs text-red-500 mt-1" role="alert">{errors.description}</p>}
            </div>

            {/* Calculadora de Precios */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900/50 dark:to-blue-900/20 rounded-xl border border-slate-200 dark:border-slate-700/50 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-sm">Calculadora de Precios</h3>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCalculator(!showCalculator)}
                  className="text-xs"
                >
                  {showCalculator ? "Ocultar" : "Mostrar"}
                </Button>
              </div>

              {showCalculator && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Inputs de cálculo */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        Costo Producto (USD)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.purchasePrice || ""}
                        onChange={(e) => {
                          const value = e.target.value === "" ? 0 : parseFloat(e.target.value)
                          setFormData({ ...formData, purchasePrice: value })
                        }}
                        placeholder="0.00"
                        className="h-9 text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        Costo Envío Pedido
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={shippingCostPerOrder || ""}
                        onChange={(e) => {
                          const value = e.target.value === "" ? 0 : parseFloat(e.target.value)
                          setShippingCostPerOrder(value)
                        }}
                        placeholder="0.00"
                        className="h-9 text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Cantidad (Stock)</label>
                      <Input
                        type="number"
                        step="1"
                        min="1"
                        value={calculatorQuantity || ""}
                        onChange={(e) => {
                          const value = e.target.value === "" ? 1 : Math.max(1, parseInt(e.target.value))
                          setCalculatorQuantity(value)
                          setFormData({ ...formData, stock: value })
                        }}
                        placeholder="1"
                        className="h-9 text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Percent className="h-3 w-3" />
                        Margen Ganancia (%)
                      </label>
                      <Input
                        type="number"
                        step="1"
                        min="0"
                        value={formData.profitMargin || ""}
                        onChange={(e) => {
                          const value = e.target.value === "" ? 35 : parseFloat(e.target.value)
                          setFormData({ ...formData, profitMargin: value })
                        }}
                        placeholder="35"
                        className="h-9 text-sm font-bold"
                      />
                    </div>
                  </div>

                  {/* Resultado del cálculo */}
                  {formData.purchasePrice > 0 && (
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-muted-foreground">RESULTADO CALCULADO</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const costoPorUnidad = formData.purchasePrice + (shippingCostPerOrder / Math.max(1, calculatorQuantity))
                            const precioVenta = costoPorUnidad * (1 + (formData.profitMargin || 35) / 100)
                            setFormData({ ...formData, price: Math.round(precioVenta * 100) / 100 })
                            toast({ title: "Precio calculado", description: `Precio de venta: $${precioVenta.toFixed(2)}` })
                          }}
                          className="h-7 text-xs bg-primary/10 text-primary hover:bg-primary/20"
                        >
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Aplicar
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-2">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">Costo/Unidad</p>
                          <p className="font-black text-slate-900 dark:text-white">
                            ${((formData.purchasePrice || 0) + ((shippingCostPerOrder || 0) / Math.max(1, calculatorQuantity))).toFixed(2)}
                          </p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-2">
                          <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-bold">Precio Venta</p>
                          <p className="font-black text-blue-700 dark:text-blue-300">
                            ${(((formData.purchasePrice || 0) + ((shippingCostPerOrder || 0) / Math.max(1, calculatorQuantity))) * (1 + ((formData.profitMargin || 35)) / 100)).toFixed(2)}
                          </p>
                        </div>
                        {bcvRate > 0 && (
                          <>
                            <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-lg p-2">
                              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold">Precio Venta BS</p>
                              <p className="font-black text-emerald-700 dark:text-emerald-300">
                                Bs. {(((formData.purchasePrice || 0) + ((shippingCostPerOrder || 0) / Math.max(1, calculatorQuantity))) * (1 + ((formData.profitMargin || 35)) / 100) * bcvRate).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-2">
                              <p className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold">Ganancia/Unidad</p>
                              <p className="font-black text-amber-700 dark:text-amber-300">
                                Bs. {(((formData.purchasePrice || 0) + ((shippingCostPerOrder || 0) / Math.max(1, calculatorQuantity))) * ((formData.profitMargin || 35)) / 100 * bcvRate).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                      {loadingBcv && (
                        <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Cargando tasa BCV...
                        </p>
                      )}
                      {bcvRate > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-2">
                          Tasa BCV: Bs. {bcvRate.toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Campos simples de precio */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Precio de venta (USD) *</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price || ""}
                  onChange={(e) => {
                    const value = e.target.value === "" ? 0 : parseFloat(e.target.value)
                    setFormData({ ...formData, price: value })
                    if (errors.price) setErrors({ ...errors, price: undefined })
                  }}
                  placeholder="0.00"
                  className={cn("font-bold", errors.price ? "border-red-500" : "")}
                />
                {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Precio de compra (USD)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.purchasePrice || ""}
                  onChange={(e) => {
                    const value = e.target.value === "" ? 0 : parseFloat(e.target.value)
                    setFormData({ ...formData, purchasePrice: value })
                  }}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Margen de ganancia (%)</label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  value={formData.profitMargin || ""}
                  onChange={(e) => {
                    const value = e.target.value === "" ? 35 : parseFloat(e.target.value)
                    setFormData({ ...formData, profitMargin: value })
                  }}
                  placeholder="35"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Proveedor por defecto</label>
                <Select
                  value={formData.supplierId || ""}
                  onValueChange={(val) => setFormData({ ...formData, supplierId: val || "" })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Sin proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map(provider => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4 pt-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: !!checked })}
                  />
                  <label htmlFor="isFeatured" className="text-sm cursor-pointer">
                    Destacado
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
                  />
                  <label htmlFor="isActive" className="text-sm cursor-pointer">
                    Activo
                  </label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : editingProduct ? "Guardar cambios" : "Crear producto"}
            </Button>
          </DialogFooter>
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
                <Eye className="h-5 w-5 text-primary" />
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

      {/* View Product Dialog */}
      {
        viewingProduct && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle>{String(viewingProduct.name || "")}</CardTitle>
                  <p className="text-muted-foreground">
                    {typeof viewingProduct.brand === 'string' ? viewingProduct.brand : (viewingProduct as any).brandName || (viewingProduct as any).brand?.name || "Sin marca"}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setViewingProduct(null)}>
                  <X className="h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="aspect-video relative bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={viewingProduct.images?.find(img => img.isMain)?.url || viewingProduct.image}
                      alt={viewingProduct.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "https://placehold.co/600x400/f8fafc/6366f1?text=Sin+Imagen";
                        target.onerror = null;
                      }}
                    />
                  </div>
                  {viewingProduct.images && viewingProduct.images.length > 0 && (
                    <div className="grid grid-cols-5 gap-2">
                      {viewingProduct.images.map((img) => (
                        <div key={String(img.id || img.url)} className={cn(
                          "aspect-square rounded-md overflow-hidden border",
                          img.isMain ? "border-primary" : "border-border"
                        )}>
                          <img
                            src={img.thumbnail || img.url}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://placehold.co/100x100/f8fafc/6366f1?text=X";
                              target.onerror = null;
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Código de producto</p>
                    <p className="font-medium">{String((viewingProduct as any).productCode || (viewingProduct as any).code || "N/A")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">SKU</p>
                    <p className="font-medium">{String(viewingProduct.sku || "N/A")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Categorías</p>
                    <p className="font-medium">
                      {viewingProduct.categories && viewingProduct.categories.length > 0
                        ? viewingProduct.categories.map(c => c.name).join(", ")
                        : (viewingProduct as any).categoryName || (viewingProduct as any).category?.name || "Sin categoría"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Formato</p>
                    <p className="font-medium">{String(viewingProduct.format || "N/A")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Precio</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatUSD(viewingProduct.price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Stock</p>
                    <p className="font-medium">{Number(viewingProduct.stock)} unidades</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ventas</p>
                    <p className="font-medium">{Number(viewingProduct.salesCount || 0)} unidades</p>
                  </div>
                </div>

                {viewingProduct.priceHistory && viewingProduct.priceHistory.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-bold uppercase text-muted-foreground border-b pb-1">Historial de Precios y Lotes</p>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {viewingProduct.priceHistory.map((history: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-sm p-2 bg-slate-50 dark:bg-slate-800/40 rounded border border-slate-100 dark:border-slate-800">
                          <div>
                            <p className="font-medium">Lote: {history.batchNumber || 'N/A'}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(history.createdAt || Date.now()).toLocaleDateString()} - {history.batchQuantity} unidades
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">{formatUSD(Number(history.salePrice))}</p>
                            <p className="text-[10px] text-muted-foreground">Costo: {formatUSD(Number(history.purchasePrice))}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground">Descripcion</p>
                  <p className="mt-1">{String(viewingProduct.description || "Sin descripción")}</p>
                </div>

                <div className="flex gap-2">
                  <Badge variant={viewingProduct.inStock ? "secondary" : "destructive"}>
                    {viewingProduct.inStock ? "En stock" : "Agotado"}
                  </Badge>
                  {viewingProduct.isFeatured && (
                    <Badge className="bg-yellow-500">Destacado</Badge>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => {
                      setProductToAddStock(viewingProduct)
                      setBatchFormData({
                        batchNumber: `RESTOCK-${Date.now()}`,
                        expirationDate: "",
                        purchasePrice: Number(viewingProduct.purchasePrice),
                        salePrice: Number(viewingProduct.price),
                        stock: 1
                      })
                      setShowAddStockDialog(true)
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Reabastecer
                  </Button>
                  <Button className="flex-1" onClick={() => {
                    handleEdit(viewingProduct)
                    setViewingProduct(null)
                  }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar producto
                  </Button>
                  <Button
                    variant="outline"
                    className={cn("flex-1", viewingProduct.isActive ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20" : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20")}
                    onClick={() => {
                      toggleProductStatus(viewingProduct.id, viewingProduct.isActive)
                      setViewingProduct(null)
                    }}
                  >
                    {viewingProduct.isActive ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                    {viewingProduct.isActive ? 'Desactivar' : 'Reactivar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      }

      {/* Bulk Action Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Acciones Masivas
            </DialogTitle>
            <DialogDescription>
              Aplicar acción a {selectedProducts.length} productos seleccionados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-bold">Acción a realizar</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "activate", label: "Activar", color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
                  { value: "deactivate", label: "Desactivar", color: "bg-amber-50 text-amber-600 border-amber-200" },
                  { value: "feature", label: "Destacar", color: "bg-violet-50 text-violet-600 border-violet-200" },
                  { value: "unfeature", label: "Quitar Destacado", color: "bg-slate-50 text-slate-600 border-slate-200" },
                  { value: "delete", label: "Eliminar", color: "bg-red-50 text-red-600 border-red-200" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setBulkAction(opt.value as any)}
                    className={`py-2 px-3 rounded-lg border text-sm font-bold transition-all ${bulkAction === opt.value
                      ? opt.color + " ring-2 ring-offset-1 ring-primary/30"
                      : "bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300"
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>Cancelar</Button>
            <Button
              variant={bulkAction === "delete" ? "destructive" : "default"}
              onClick={() => handleBulkAction(bulkAction as any)}
            >
              Aplicar a {selectedProducts.length} productos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Importar Productos desde CSV
            </DialogTitle>
            <DialogDescription>
              Importa productos desde un archivo CSV. Los productos existentes se actualizarán por SKU.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleCSVImport}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <span className="text-sm text-slate-500">Procesando archivo...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-slate-400" />
                    <span className="text-sm text-slate-500">
                      Haz clic para seleccionar un archivo CSV
                    </span>
                  </>
                )}
              </label>
            </div>

            {importResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col items-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                    <CheckCircle className="h-8 w-8 text-emerald-600 mb-2" />
                    <span className="text-2xl font-bold text-emerald-600">{importResult.created}</span>
                    <span className="text-xs text-emerald-600">Creados</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <TrendingUp className="h-8 w-8 text-blue-600 mb-2" />
                    <span className="text-2xl font-bold text-blue-600">{importResult.updated}</span>
                    <span className="text-xs text-blue-600">Actualizados</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                    <XCircle className="h-8 w-8 text-red-600 mb-2" />
                    <span className="text-2xl font-bold text-red-600">{importResult.errors}</span>
                    <span className="text-xs text-red-600">Errores</span>
                  </div>
                </div>

                {importResult.details?.errors && importResult.details.errors.length > 0 && (
                  <div className="max-h-48 overflow-y-auto border border-red-200 dark:border-red-900/50 rounded-xl">
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-900/50">
                      <span className="text-sm font-bold text-red-600">Errores:</span>
                    </div>
                    <div className="p-2 space-y-1">
                      {importResult.details.errors.slice(0, 20).map((err, idx) => (
                        <div key={idx} className="text-xs text-slate-600 dark:text-slate-400 p-1">
                          <span className="font-bold">Fila {err.row}:</span> SKU {err.sku} - {err.error}
                        </div>
                      ))}
                      {importResult.details.errors.length > 20 && (
                        <div className="text-xs text-slate-500 p-1">
                          ... y {importResult.details.errors.length - 20} errores más
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4">
              <h4 className="text-sm font-bold mb-3">Formato del CSV</h4>
              <p className="text-xs text-slate-500 mb-3">
                El archivo debe tener las siguientes columnas en la primera fila:
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="font-mono bg-white dark:bg-slate-900 p-2 rounded border">
                  <span className="text-primary font-bold">sku</span> (requerido)
                </div>
                <div className="font-mono bg-white dark:bg-slate-900 p-2 rounded border">
                  <span className="text-primary font-bold">name</span> (requerido)
                </div>
                <div className="font-mono bg-white dark:bg-slate-900 p-2 rounded border">
                  <span className="text-slate-600">description</span>
                </div>
                <div className="font-mono bg-white dark:bg-slate-900 p-2 rounded border">
                  <span className="text-slate-600">price</span>
                </div>
                <div className="font-mono bg-white dark:bg-slate-900 p-2 rounded border">
                  <span className="text-slate-600">purchasePrice</span>
                </div>
                <div className="font-mono bg-white dark:bg-slate-900 p-2 rounded border">
                  <span className="text-slate-600">stock</span>
                </div>
                <div className="font-mono bg-white dark:bg-slate-900 p-2 rounded border">
                  <span className="text-slate-600">minStock</span>
                </div>
                <div className="font-mono bg-white dark:bg-slate-900 p-2 rounded border">
                  <span className="text-slate-600">brand</span>
                </div>
                <div className="font-mono bg-white dark:bg-slate-900 p-2 rounded border">
                  <span className="text-slate-600">format</span>
                </div>
                <div className="font-mono bg-white dark:bg-slate-900 p-2 rounded border">
                  <span className="text-slate-600">image</span>
                </div>
                <div className="font-mono bg-white dark:bg-slate-900 p-2 rounded border col-span-2">
                  <span className="text-slate-600">categoryNames</span> (separar con | para múltiples)
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowImportDialog(false)
              setImportResult(null)
            }}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  )
}
