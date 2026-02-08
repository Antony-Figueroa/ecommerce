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
} from "lucide-react"
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
  sku?: string
  price?: string
  purchasePrice?: string
  stock?: string
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

    if (formData.price <= 0) {
      newErrors.price = "El precio de venta debe ser mayor a 0"
      isValid = false
    }

    if (formData.purchasePrice <= 0) {
      newErrors.purchasePrice = "El precio de compra es obligatorio"
      isValid = false
    }

    if (formData.stock < 0) {
      newErrors.stock = "El stock no puede ser negativo"
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
      const productData = {
        ...formData,
        slug: formData.name.toLowerCase().replace(/\s+/g, "-"),
      }

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, productData)
      } else {
        await api.createProduct(productData)
      }

      setShowAddDialog(false)
      resetForm()
      fetchProducts()
      fetchBrands()
    } catch (error: any) {
      console.error("Error saving product:", error)
      alert(error.message || "Error al guardar el producto")
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
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">
              {products.length} productos en tu catalogo
              {lowStockCount > 0 && (
                <span className="text-yellow-600 ml-2">
                  ({lowStockCount} con stock bajo, {outOfStockCount} agotados)
                </span>
              )}
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm()
              setShowAddDialog(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Producto
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar productos por nombre, SKU o marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 bg-white/50 dark:bg-muted/10 border-slate-200/50 dark:border-border/50"
            />
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto scrollbar-hide pb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-muted-foreground whitespace-nowrap">Filtrar:</span>
            <div className="flex bg-slate-100/50 dark:bg-muted/20 p-1 rounded-xl border border-slate-200/50 dark:border-border/50 shadow-sm h-11 items-center px-1.5 shrink-0">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40 border-none bg-transparent focus:ring-0 h-9 font-bold text-xs uppercase tracking-wider">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorias</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{String(cat.name || "")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="w-px h-4 bg-slate-200 dark:bg-border/50 mx-1" />

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 border-none bg-transparent focus:ring-0 h-9 font-bold text-xs uppercase tracking-wider">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Eliminados</SelectItem>
                </SelectContent>
              </Select>

              <div className="w-px h-4 bg-slate-200 dark:bg-border/50 mx-1" />

              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-36 border-none bg-transparent focus:ring-0 h-9 font-bold text-xs uppercase tracking-wider">
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

            <div className="flex items-center bg-slate-100/50 dark:bg-muted/20 p-1 rounded-xl border border-slate-200/50 dark:border-border/50 shadow-sm h-11 px-1.5 shrink-0">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 transition-all duration-300 rounded-lg ${
                  viewMode === "grid" 
                    ? "bg-white dark:bg-card text-primary shadow-sm scale-[1.05]" 
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 transition-all duration-300 rounded-lg ${
                  viewMode === "list" 
                    ? "bg-white dark:bg-card text-primary shadow-sm scale-[1.05]" 
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Products Display */}
        {viewMode === "grid" ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="aspect-square relative bg-gray-100 dark:bg-slate-800/50 p-2">
                  <img
                    src={product.images?.find(img => img.isMain)?.url || product.image}
                    alt={product.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://placehold.co/400x400/f8fafc/6366f1?text=Sin+Imagen";
                      target.onerror = null;
                    }}
                  />
                  {!product.inStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
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
                    <p className="text-lg font-bold text-primary">
                      {formatUSD(product.price)}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
                    <Badge variant="outline">{String(product.format || "N/A")}</Badge>
                    <Badge variant="outline">
                      {product.categories && product.categories.length > 0 
                        ? product.categories.map(c => c.name).join(", ") 
                        : (product as any).category?.name || "Sin categoría"}
                    </Badge>
                    <Badge variant={product.inStock ? "secondary" : "destructive"}>
                      Stock: {Number(product.stock)}
                    </Badge>
                    {product.stock < 10 && product.inStock && (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant={product.isActive ? "default" : "secondary"}>
                      {product.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                    {product.isFeatured && (
                      <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">Destacado</Badge>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
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
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Stock
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setViewingProduct(product)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleProductStatus(product.id, product.isActive)}
                    >
                      {product.isActive ? (
                        <X className="h-4 w-4 text-red-500" />
                      ) : (
                        <Check className="h-4 w-4 text-green-500" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Marca/Cat</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Precio</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className="bg-slate-100 dark:bg-slate-800 aspect-square rounded-lg size-12 flex-shrink-0 overflow-hidden">
                            <img
                              src={product.images?.find(img => img.isMain)?.url || product.image}
                              alt={product.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "https://placehold.co/100x100/f8fafc/6366f1?text=X";
                                target.onerror = null;
                              }}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{product.name}</p>
                            <p className="text-xs text-slate-400 font-medium">SKU: {product.sku}</p>
                            <div className="flex items-center gap-1 mt-1">
                              {product.isFeatured && (
                                <Badge variant="outline" className="text-[10px] h-4 px-1 bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-200">Destacado</Badge>
                              )}
                              {!product.isActive && (
                                <Badge variant="secondary" className="text-[10px] h-4 px-1">Inactivo</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            {String(typeof product.brand === 'string' ? product.brand : (product as any).brandName || (product as any).brand?.name || "Sin marca")}
                          </span>
                          <span className="text-xs text-slate-400">
                            {product.categories && product.categories.length > 0 
                              ? product.categories.map(c => c.name).join(", ") 
                              : (product as any).category?.name || "Sin categoría"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-primary">{formatUSD(product.price)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold",
                            product.stock === 0 ? "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400" :
                            product.stock < 10 ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" :
                            "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          )}>
                            {product.stock === 0 ? "Agotado" : `En Stock (${product.stock})`}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium uppercase">{product.format}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
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
                            title="Reabastecer"
                          >
                            <Package className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-primary"
                            onClick={() => setViewingProduct(product)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-blue-500"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-500"
                            onClick={() => toggleProductStatus(product.id, product.isActive)}
                          >
                            {product.isActive ? (
                              <X className="h-4 w-4" />
                            ) : (
                              <Check className="h-4 w-4 text-green-500" />
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

              <div className="grid grid-cols-4 gap-4">
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
                <div>
                  <label className="text-sm font-medium">Costo Compra *</label>
                  <Input
                    type="number"
                    value={formData.purchasePrice || ""}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0
                      const newPrice = val * formData.profitMargin
                      setFormData({ 
                        ...formData, 
                        purchasePrice: val,
                        price: Number(newPrice.toFixed(2))
                      })
                      if (errors.purchasePrice) setErrors({ ...errors, purchasePrice: undefined })
                    }}
                    placeholder="0.00"
                    className={errors.purchasePrice ? "border-red-500" : ""}
                  />
                  {errors.purchasePrice && <p className="text-xs text-red-500 mt-1">{errors.purchasePrice}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">Margen (x1.5)</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.profitMargin || ""}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0
                      const newPrice = formData.purchasePrice * val
                      setFormData({ 
                        ...formData, 
                        profitMargin: val,
                        price: Number(newPrice.toFixed(2))
                      })
                    }}
                    placeholder="1.5"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Precio Venta *</label>
                  <Input
                    type="number"
                    value={formData.price || ""}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0
                      const newMargin = formData.purchasePrice > 0 ? val / formData.purchasePrice : 1.5
                      setFormData({ 
                        ...formData, 
                        price: val,
                        profitMargin: Number(newMargin.toFixed(2))
                      })
                      if (errors.price) setErrors({ ...errors, price: undefined })
                    }}
                    placeholder="0.00"
                    className={errors.price ? "border-red-500" : ""}
                  />
                  {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
                </div>
              </div>

              {!editingProduct && (
                <div className="grid grid-cols-3 gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
                  <div className="col-span-3 text-xs font-bold uppercase text-slate-500 mb-1">Datos del Lote Inicial</div>
                  <div>
                    <label className="text-sm font-medium">Stock Inicial *</label>
                    <Input
                      type="number"
                      value={formData.stock || ""}
                      onChange={(e) => {
                        setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })
                        if (errors.stock) setErrors({ ...errors, stock: undefined })
                      }}
                      placeholder="0"
                      className={errors.stock ? "border-red-500" : ""}
                    />
                    {errors.stock && <p className="text-xs text-red-500 mt-1">{errors.stock}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Nro Lote</label>
                    <Input
                      value={formData.batchNumber}
                      onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                      placeholder="Ej: LOTE-001"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Vencimiento</label>
                    <Input
                      type="date"
                      value={formData.expirationDate}
                      onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {editingProduct && (
                <div>
                  <label className="text-sm font-medium">Stock Total</label>
                  <Input
                    type="number"
                    value={formData.stock || ""}
                    onChange={(e) => {
                      setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })
                      if (errors.stock) setErrors({ ...errors, stock: undefined })
                    }}
                    placeholder="0"
                    disabled
                    className="bg-slate-50"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1 italic">
                    Para añadir stock usa el botón de reabastecimiento en la lista.
                  </p>
                </div>
              )}

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
                  <label className="text-sm font-medium">Marca *</label>
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
                    <SelectTrigger className={errors.brand ? "border-red-500" : ""}>
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
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={customBrand}
                        onChange={(e) => setCustomBrand(e.target.value)}
                        placeholder="Escribe la marca..."
                        className="flex-1"
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
                      >
                        Añadir
                      </Button>
                    </div>
                  )}
                  {errors.brand && <p className="text-xs text-red-500 mt-1">{errors.brand}</p>}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Imágenes del producto</label>
                <ImageUpload 
                  images={formData.images} 
                  onChange={(images) => {
                    setFormData({ ...formData, images })
                    if (errors.images) setErrors({ ...errors, images: undefined })
                  }}
                />
                {errors.images && <p className="text-xs text-red-500 mt-1">{errors.images}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Formato *</label>
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
                    <SelectTrigger className={errors.format ? "border-red-500" : ""}>
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
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={customFormat}
                        onChange={(e) => setCustomFormat(e.target.value)}
                        placeholder="Escribe el formato..."
                        className="flex-1"
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
                      >
                        Añadir
                      </Button>
                    </div>
                  )}
                  {errors.format && <p className="text-xs text-red-500 mt-1">{errors.format}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">Precio original (oferta)</label>
                  <Input
                    type="number"
                    value={formData.originalPrice || ""}
                    onChange={(e) => setFormData({ ...formData, originalPrice: parseFloat(e.target.value) || null })}
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Descripcion</label>
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
                />
                {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Producto destacado</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded"
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
