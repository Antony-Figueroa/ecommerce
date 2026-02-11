import { useState, useEffect } from "react"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Package,
  X,
  Check,
  AlertTriangle,
  Grid,
  List,
  Box,
} from "lucide-react"
import { AdminPageHeader } from "@/components/admin/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageUpload } from "@/components/admin/image-upload"
import { MultiSelect } from "@/components/ui/multi-select"
import { api } from "@/lib/api"
import { formatUSD, cn } from "@/lib/utils"
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
  inStock: boolean
  categoryIds: string[]
  categoryName?: string
  brand: string
  format: string
  isFeatured: boolean
  isActive: boolean
  image: string
  images?: ProductImage[]
  categories?: { id: string; name: string }[]
  batches?: any[]
  priceHistory?: any[]
  salesCount?: number
  viewCount?: number
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
}

export function AdminProductsPage() {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
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
  const [brands, setBrands] = useState<string[]>([])
  
  const generateProductCode = () => {
    const prefix = "ANA"
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `${prefix}-${timestamp}-${random}`
  }

  const FORMAT_OPTIONS = [
    "Tabletas",
    "Capsulas",
    "Polvo",
    "Jarabe",
    "Crema",
    "Gel",
    "Inyectable",
    "Gotas",
    "Spray",
    "Sobres",
    "Gomitas",
    "Ampollas",
    "Locion",
    "Parche",
  ]
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    productCode: "",
    sku: "",
    description: "",
    price: 0,
    purchasePrice: 0,
    profitMargin: 1.5,
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
  })

  useEffect(() => {
    localStorage.setItem("adminProductsViewMode", viewMode)
  }, [viewMode])

  useEffect(() => {
    async function loadData() {
      // Optimizando carga paralela para eliminar waterfalls (async-parallel)
      await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchBrands()
      ])
    }
    loadData()
  }, [])

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
      const data = await api.getAdminProducts()
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
      profitMargin: 1.5,
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
    })
    setEditingProduct(null)
    setShowCustomBrand(false)
    setShowCustomFormat(false)
    setCustomBrand("")
    setCustomFormat("")
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

    setErrors(newErrors)
    return isValid
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)
    try {
      const { batchNumber, expirationDate, ...rest } = formData
      
      // Clean up the data before sending
      const productData = {
        ...rest,
        // Ensure price is a number
        price: Number(formData.price),
        purchasePrice: Number(formData.purchasePrice),
        profitMargin: Number(formData.profitMargin),
        stock: Number(formData.stock),
        originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
      }

      if (editingProduct) {
        // Update existing product
        await api.updateProduct(editingProduct.id, productData)
      } else {
        // Create new product
        const createData = {
          ...productData,
          ...(formData.batchNumber ? { batchNumber: formData.batchNumber } : {}),
          ...(formData.expirationDate ? { expirationDate: formData.expirationDate } : {}),
        }
        await api.createProduct(createData)
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
      
      alert(errorMessage)
    } finally {
      setSaving(false)
    }
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
      profitMargin: Number(product.profitMargin) || 1.5,
      originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
      stock: Number(product.stock) || 0,
      categoryIds: catIds,
      brand: String(brandValue || ""), // Asegurar que sea string
      format: String(formatValue || ""), // Asegurar que sea string
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
      batchNumber: "", // Limpiar campos de lote al editar
      expirationDate: "",
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
    try {
      const updateData = {
        batch: {
          batchNumber: batchFormData.batchNumber,
          expirationDate: batchFormData.expirationDate,
          purchasePrice: batchFormData.purchasePrice,
          salePrice: batchFormData.salePrice,
          stock: batchFormData.stock
        }
      }
      await api.updateProduct(productToAddStock.id, updateData)
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
      alert(error.message || "Error al añadir stock")
    }
  }

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      await api.updateProduct(productId, { isActive: !currentStatus })
      const updatedProduct = products.find(p => p.id === productId)
      if (!currentStatus && updatedProduct) { // Si se está activando
        setProductToAddStock(updatedProduct)
        setBatchFormData({
          batchNumber: `RESTOCK-${Date.now()}`,
          expirationDate: "",
          purchasePrice: Number(updatedProduct.purchasePrice),
          salePrice: Number(updatedProduct.price),
          stock: 1
        })
        setShowAddStockDialog(true)
      }
      fetchProducts()
    } catch {
    }
  }

  const deleteProduct = async (productId: string) => {
    if (!confirm("Estas seguro de eliminar este producto?")) return
    
    try {
      await api.deleteProduct(productId)
      fetchProducts()
    } catch {
    }
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || 
      (product.categoryIds && product.categoryIds.includes(categoryFilter)) || 
      (product.categories && product.categories.some(c => c.id === categoryFilter)) ||
      (product as any).categoryId === categoryFilter // compatibility with legacy data
    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "low" && product.stock < 10) ||
      (stockFilter === "out" && product.stock === 0) ||
      (stockFilter === "in" && product.stock >= 10)
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "active" && product.isActive) ||
      (statusFilter === "inactive" && !product.isActive)
    return matchesSearch && matchesCategory && matchesStock && matchesStatus
  })

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
    <div className="space-y-6" role="main" aria-label="Gestión de Productos">
        <header>
          <AdminPageHeader 
            title="Productos"
            subtitle={`Total: ${products.length} · Stock bajo: ${lowStockCount} · Agotados: ${outOfStockCount}`}
            icon={Box}
            action={{
              label: "Agregar Producto",
              onClick: () => {
                resetForm()
                setShowAddDialog(true)
              },
              icon: Plus
            }}
          />
        </header>

        {/* Filters */}
        <section className="flex flex-col md:flex-row gap-4 items-center" aria-label="Filtros y búsqueda">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Buscar productos por nombre, SKU o marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 bg-background border-border/60 rounded-xl shadow-sm focus:ring-primary/20"
              aria-label="Buscar productos por nombre, SKU o marca"
            />
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto scrollbar-hide pb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap" id="filter-label">Filtrar:</span>
            <div className="flex bg-muted/40 p-1 rounded-xl border border-border/60 shadow-sm h-11 items-center px-1.5 shrink-0" role="group" aria-labelledby="filter-label">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40 border-none bg-transparent focus:ring-0 h-9 font-bold text-xs uppercase tracking-wider" aria-label="Filtrar por categoría">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorias</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{String(cat.name || "")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="w-px h-4 bg-border/60 mx-1" aria-hidden="true" />

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 border-none bg-transparent focus:ring-0 h-9 font-bold text-xs uppercase tracking-wider" aria-label="Filtrar por estado">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Eliminados</SelectItem>
                </SelectContent>
              </Select>

              <div className="w-px h-4 bg-border/60 mx-1" aria-hidden="true" />

              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-36 border-none bg-transparent focus:ring-0 h-9 font-bold text-xs uppercase tracking-wider" aria-label="Filtrar por disponibilidad de stock">
                  <SelectValue placeholder="Stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo el stock</SelectItem>
                  <SelectItem value="in">En stock</SelectItem>
                  <SelectItem value="low">Stock bajo</SelectItem>
                  <SelectItem value="out">Agotado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border/60 shadow-sm h-11 px-1.5 shrink-0" role="group" aria-label="Modo de visualización">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 transition-all duration-300 rounded-lg ${
                  viewMode === "grid" 
                    ? "bg-white dark:bg-card text-primary shadow-sm scale-[1.05]" 
                    : "text-muted-foreground hover:text-primary"
                }`}
                aria-label="Ver en cuadrícula"
                aria-pressed={viewMode === "grid"}
              >
                <Grid className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 transition-all duration-300 rounded-lg ${
                  viewMode === "list" 
                    ? "bg-white dark:bg-card text-primary shadow-sm scale-[1.05]" 
                    : "text-muted-foreground hover:text-primary"
                }`}
                aria-label="Ver en lista"
                aria-pressed={viewMode === "list"}
              >
                <List className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>

        {/* Products Display */}
        {viewMode === "grid" ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" role="list" aria-label="Lista de productos en cuadrícula">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden border border-border/60 rounded-2xl shadow-sm hover:shadow-md transition-all" role="listitem">
                <div className="aspect-square relative bg-muted/40 p-2">
                  <img
                    src={product.images?.find(img => img.isMain)?.url || product.image}
                    alt={`Imagen de ${product.name}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://placehold.co/400x400/f8fafc/6366f1?text=Sin+Imagen";
                      target.onerror = null;
                    }}
                  />
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center" aria-label="Producto agotado">
                      <Badge variant="destructive">Agotado</Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {String(typeof product.brand === 'string' ? product.brand : (product as any).brandName || (product as any).brand?.name || "Sin marca")}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-primary" aria-label={`Precio: ${formatUSD(product.price)}`}>
                      {formatUSD(product.price)}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
                    <Badge variant="outline" aria-label={`Formato: ${product.format || "N/A"}`}>{String(product.format || "N/A")}</Badge>
                    <Badge variant="outline" aria-label={`Categorías: ${product.categories?.map(c => c.name).join(", ") || "Sin categoría"}`}>
                      {product.categories && product.categories.length > 0 
                        ? product.categories.map(c => c.name).join(", ") 
                        : (product as any).category?.name || "Sin categoría"}
                    </Badge>
                    <Badge variant={product.inStock ? "secondary" : "destructive"} aria-label={`Stock actual: ${product.stock}`}>
                      Stock: {Number(product.stock)}
                    </Badge>
                    {product.stock < 10 && product.inStock && (
                      <AlertTriangle className="h-4 w-4 text-amber-500" aria-label="Alerta: Stock bajo" />
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant={product.isActive ? "default" : "secondary"} aria-label={`Estado: ${product.isActive ? "Activo" : "Inactivo"}`}>
                      {product.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                    {product.isFeatured && (
                      <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800" aria-label="Producto destacado">Destacado</Badge>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4" role="group" aria-label={`Acciones para ${product.name}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => {
                        setProductToAddStock(product)
                        setBatchFormData({
                          batchNumber: `RESTOCK-${Date.now()}`,
                          expirationDate: "",
                          purchasePrice: Number(product.purchasePrice),
                          salePrice: Number(product.price),
                          stock: 1
                        })
                        setShowAddStockDialog(true)
                      }}
                      aria-label={`Reabastecer stock de ${product.name}`}
                    >
                      <Plus className="h-4 w-4 mr-1" aria-hidden="true" />
                      Stock
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setViewingProduct(product)}
                      aria-label={`Ver detalles de ${product.name}`}
                    >
                      <Eye className="h-4 w-4 mr-1" aria-hidden="true" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(product)}
                      aria-label={`Editar ${product.name}`}
                    >
                      <Edit className="h-4 w-4 mr-1" aria-hidden="true" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleProductStatus(product.id, product.isActive)}
                      aria-label={product.isActive ? `Desactivar ${product.name}` : `Activar ${product.name}`}
                    >
                      {product.isActive ? (
                        <X className="h-4 w-4 text-red-500" aria-hidden="true" />
                      ) : (
                        <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="overflow-hidden border border-border/60 rounded-2xl shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left" aria-label="Tabla de productos">
                <thead className="bg-muted/40 border-b border-border/60">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider" scope="col">Producto</th>
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider" scope="col">Marca/Cat</th>
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider" scope="col">Precio</th>
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider" scope="col">Stock</th>
                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right" scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className="bg-muted/40 aspect-square rounded-lg size-12 flex-shrink-0 overflow-hidden">
                            <img
                              src={product.images?.find(img => img.isMain)?.url || product.image}
                              alt=""
                              className="w-full h-full object-contain"
                              aria-hidden="true"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "https://placehold.co/100x100/f8fafc/6366f1?text=X";
                                target.onerror = null;
                              }}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground leading-tight">{product.name}</p>
                            <p className="text-xs text-muted-foreground font-medium" aria-label={`SKU: ${product.sku}`}>SKU: {product.sku}</p>
                            <div className="flex items-center gap-1 mt-1">
                              {product.isFeatured && (
                                <Badge variant="outline" className="text-[10px] h-4 px-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-200" aria-label="Destacado">Destacado</Badge>
                              )}
                              {!product.isActive && (
                                <Badge variant="secondary" className="text-[10px] h-4 px-1" aria-label="Inactivo">Inactivo</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-muted-foreground" aria-label={`Marca: ${product.brand}`}>
                            {String(typeof product.brand === 'string' ? product.brand : (product as any).brandName || (product as any).brand?.name || "Sin marca")}
                          </span>
                          <span className="text-xs text-muted-foreground" aria-label={`Categorías: ${product.categories?.map(c => c.name).join(", ") || "Sin categoría"}`}>
                            {product.categories && product.categories.length > 0 
                              ? product.categories.map(c => c.name).join(", ") 
                              : (product as any).category?.name || "Sin categoría"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-primary" aria-label={`Precio: ${formatUSD(product.price)}`}>{formatUSD(product.price)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold",
                            product.stock === 0 ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400" :
                            product.stock < 10 ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" :
                            "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          )} aria-label={`Estado de stock: ${product.stock === 0 ? "Agotado" : "En Stock"}`}>
                            {product.stock === 0 ? "Agotado" : `En Stock (${product.stock})`}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium uppercase" aria-label={`Formato: ${product.format}`}>{product.format}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2" role="group" aria-label={`Acciones para ${product.name}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-green-500"
                            onClick={() => {
                              setProductToAddStock(product)
                              setBatchFormData({
                                batchNumber: `RESTOCK-${Date.now()}`,
                                expirationDate: "",
                                purchasePrice: Number(product.purchasePrice),
                                salePrice: Number(product.price),
                                stock: 1
                              })
                              setShowAddStockDialog(true)
                            }}
                            aria-label={`Reabastecer stock de ${product.name}`}
                          >
                            <Package className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-primary"
                            onClick={() => setViewingProduct(product)}
                            aria-label={`Ver detalles de ${product.name}`}
                          >
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-blue-500"
                            onClick={() => handleEdit(product)}
                            aria-label={`Editar ${product.name}`}
                          >
                            <Edit className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-500"
                            onClick={() => toggleProductStatus(product.id, product.isActive)}
                            aria-label={product.isActive ? `Desactivar ${product.name}` : `Activar ${product.name}`}
                          >
                            {product.isActive ? (
                              <X className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {filteredProducts.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay productos</h3>
              <p className="text-muted-foreground mb-4">
                No se encontraron productos con los criterios de busqueda.
              </p>
              <Button
                onClick={() => {
                  resetForm()
                  setShowAddDialog(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar tu primer producto
              </Button>
            </CardContent>
          </Card>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Nro Lote</label>
                  <Input
                    value={batchFormData.batchNumber}
                    onChange={(e) => setBatchFormData({ ...batchFormData, batchNumber: e.target.value })}
                    placeholder="Ej: LOTE-2024"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Vencimiento</label>
                  <Input
                    type="date"
                    value={batchFormData.expirationDate}
                    onChange={(e) => setBatchFormData({ ...batchFormData, expirationDate: e.target.value })}
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
                disabled={!batchFormData.batchNumber || !batchFormData.expirationDate || batchFormData.stock <= 0}
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
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
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
                  <Select
                    value={formData.brand}
                    onValueChange={(val) => {
                      if (val === "custom") {
                        setShowCustomBrand(true)
                      } else {
                        setFormData({ ...formData, brand: val })
                        setShowCustomBrand(false)
                        if (errors.brand) setErrors({ ...errors, brand: undefined })
                      }
                    }}
                  >
                    <SelectTrigger className={errors.brand ? "border-red-500" : ""} aria-labelledby="brand-label">
                      <SelectValue placeholder="Seleccionar marca" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((brand, index) => {
                        const brandValue = typeof brand === 'string' ? brand : (brand as any).name || "";
                        if (!brandValue) return null;
                        return (
                          <SelectItem key={`${brandValue}-${index}`} value={String(brandValue)}>
                            {String(brandValue)}
                          </SelectItem>
                        );
                      })}
                      <SelectItem value="custom" className="text-primary font-medium">
                        + Nueva marca...
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
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
                            if (!brands.includes(newBrand)) {
                              setBrands(prev => [...prev, newBrand].sort())
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
                <Select
                  value={formData.format}
                  onValueChange={(val) => {
                    if (val === "custom") {
                      setShowCustomFormat(true)
                    } else {
                      setFormData({ ...formData, format: val })
                      setShowCustomFormat(false)
                      if (errors.format) setErrors({ ...errors, format: undefined })
                    }
                  }}
                >
                  <SelectTrigger className={errors.format ? "border-red-500" : ""} aria-labelledby="format-label">
                    <SelectValue placeholder="Seleccionar formato" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAT_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                    <SelectItem value="custom" className="text-primary font-medium">
                      + Otro formato...
                    </SelectItem>
                  </SelectContent>
                </Select>
                
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
                <textarea
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value })
                    if (errors.description) setErrors({ ...errors, description: undefined })
                  }}
                  placeholder="Descripcion del producto"
                  className={cn(
                    "w-full px-3 py-2 border rounded-md min-h-[100px]",
                    errors.description ? "border-red-500" : ""
                  )}
                  aria-labelledby="description-label"
                />
                {errors.description && <p className="text-xs text-red-500 mt-1" role="alert">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="rounded"
                    aria-label="Marcar como producto destacado"
                  />
                  <span className="text-sm">Producto destacado</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded"
                    aria-label="Mantener producto activo"
                  />
                  <span className="text-sm">Activo</span>
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Guardando..." : editingProduct ? "Guardar cambios" : "Crear producto"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Product Dialog */}
        {viewingProduct && (
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
                    className="flex-1"
                    onClick={() => {
                      deleteProduct(viewingProduct.id)
                      setViewingProduct(null)
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
  )
}
