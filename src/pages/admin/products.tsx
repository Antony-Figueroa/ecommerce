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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AdminLayout } from "@/components/layout/admin-layout"
import { ImageUpload } from "@/components/admin/image-upload"
import { api } from "@/lib/api"
import { formatUSD, cn } from "@/lib/utils"
import type { ProductImage } from "@/types"

interface Product {
  id: string
  name: string
  sku: string
  description: string
  price: number
  originalPrice: number | null
  stock: number
  inStock: boolean
  categoryId: string
  categoryName?: string
  brand: string
  format: string
  isFeatured: boolean
  isActive: boolean
  image: string
  images?: ProductImage[]
  category?: { id: string; name: string }
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
  originalPrice: number | null
  stock: number
  categoryId: string
  brand: string
  format: string
  isFeatured: boolean
  isActive: boolean
  image: string
  images: Partial<ProductImage>[]
}

interface ProductErrors {
  name?: string
  sku?: string
  price?: string
  stock?: string
  categoryId?: string
  brand?: string
  format?: string
  description?: string
  images?: string
}

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
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
    originalPrice: null,
    stock: 0,
    categoryId: "",
    brand: "",
    format: "",
    isFeatured: false,
    isActive: true,
    image: "/placeholder.jpg",
    images: [],
  })

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    fetchBrands()
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

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      description: "",
      price: 0,
      originalPrice: null,
      stock: 0,
      categoryId: "",
      brand: "",
      format: "",
      isFeatured: false,
      isActive: true,
      image: "/placeholder.jpg",
      images: [],
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
      newErrors.price = "El precio debe ser mayor a 0"
      isValid = false
    }

    if (formData.stock < 0) {
      newErrors.stock = "El stock no puede ser negativo"
      isValid = false
    }

    if (!formData.categoryId) {
      newErrors.categoryId = "Debes seleccionar una categoría"
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
    
    // Extract categoryId correctly handling both string and object
    let catId = ""
    if (typeof (product as any).categoryId === 'string' && (product as any).categoryId) {
      catId = (product as any).categoryId
    } else if (product.category?.id) {
      catId = product.category.id
    } else if ((product as any).category && typeof (product as any).category === 'string') {
      catId = (product as any).category
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
      originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
      stock: Number(product.stock) || 0,
      categoryId: String(catId || ""), // Asegurar que sea string
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
  const [stockToAdd, setStockToAdd] = useState(1)

  const handleAddStock = async () => {
    if (!productToAddStock) return
    try {
      const newStock = Number(productToAddStock.stock) + Number(stockToAdd)
      await api.updateProduct(productToAddStock.id, { stock: newStock })
      setShowAddStockDialog(false)
      setProductToAddStock(null)
      setStockToAdd(1)
      fetchProducts()
    } catch (error) {
      console.error("Error adding stock:", error)
      alert("Error al añadir stock")
    }
  }

  const toggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      await api.updateProduct(productId, { isActive: !currentStatus })
      const updatedProduct = products.find(p => p.id === productId)
      if (!currentStatus && updatedProduct) { // Si se está activando
        setProductToAddStock(updatedProduct)
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
    const matchesCategory = categoryFilter === "all" || product.categoryId === categoryFilter
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
      <AdminLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestion de Productos</h1>
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
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar productos por nombre, SKU o marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorias</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{String(cat.name || "")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Eliminados</SelectItem>
            </SelectContent>
          </Select>
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-48">
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

        {/* Products Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="aspect-square relative bg-gray-100 p-2">
                <img
                  src={product.images?.find(img => img.isMain)?.url || product.image}
                  alt={product.name}
                  className="w-full h-full object-contain"
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
                  <p className="text-lg font-bold text-green-600">
                    {formatUSD(product.price)}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 mt-2 text-sm">
                  <Badge variant="outline">{String(product.format || "N/A")}</Badge>
                  <Badge variant="outline">{String(product.category?.name || "Sin categoría")}</Badge>
                  <Badge variant={product.inStock ? "secondary" : "destructive"}>
                    Stock: {Number(product.stock)}
                  </Badge>
                  {product.stock < 10 && product.inStock && (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <Badge variant={product.isActive ? "default" : "secondary"}>
                    {product.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                  {product.isFeatured && (
                    <Badge variant="outline" className="bg-yellow-50">Destacado</Badge>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
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
              <DialogTitle>Reactivar Producto</DialogTitle>
              <DialogDescription>
                Has activado <strong>{productToAddStock?.name}</strong>. ¿Deseas añadir stock inicial? 
                (Stock actual: {productToAddStock?.stock})
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-x-2 py-4">
              <div className="grid flex-1 gap-2">
                <label htmlFor="stock" className="text-sm font-medium">Cantidad a añadir</label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={stockToAdd}
                  onChange={(e) => setStockToAdd(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <DialogFooter className="sm:justify-start">
              <Button
                type="button"
                variant="default"
                onClick={handleAddStock}
              >
                Añadir Stock y Cerrar
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowAddStockDialog(false)}
              >
                Omitir
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
                  <label className="text-sm font-medium">SKU (Opcional)</label>
                  <Input
                    value={formData.sku}
                    onChange={(e) => {
                      setFormData({ ...formData, sku: e.target.value })
                      if (errors.sku) setErrors({ ...errors, sku: undefined })
                    }}
                    placeholder="Auto-generado si se deja vacío"
                    className={errors.sku ? "border-red-500" : ""}
                  />
                  {errors.sku && <p className="text-xs text-red-500 mt-1">{errors.sku}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">Precio *</label>
                  <Input
                    type="number"
                    value={formData.price || ""}
                    onChange={(e) => {
                      setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                      if (errors.price) setErrors({ ...errors, price: undefined })
                    }}
                    placeholder="0.00"
                    className={errors.price ? "border-red-500" : ""}
                  />
                  {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">Stock *</label>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Categoria *</label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(val) => {
                      setFormData({ ...formData, categoryId: val })
                      if (errors.categoryId) setErrors({ ...errors, categoryId: undefined })
                    }}
                  >
                    <SelectTrigger className={errors.categoryId ? "border-red-500" : ""}>
                      <SelectValue placeholder="Seleccionar categoria" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{String(cat.name || "")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.categoryId && <p className="text-xs text-red-500 mt-1">{errors.categoryId}</p>}
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
                    />
                  </div>
                  {viewingProduct.images && viewingProduct.images.length > 0 && (
                    <div className="grid grid-cols-5 gap-2">
                      {viewingProduct.images.map((img) => (
                        <div key={String(img.id || img.url)} className={cn(
                          "aspect-square rounded-md overflow-hidden border",
                          img.isMain ? "border-primary" : "border-border"
                        )}>
                          <img src={img.thumbnail || img.url} alt="" className="w-full h-full object-cover" />
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
                  <p className="text-sm text-muted-foreground">Categoria</p>
                  <p className="font-medium">{String(viewingProduct.categoryName || viewingProduct.category?.name || "Sin categoría")}</p>
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
    </AdminLayout>
  )
}
