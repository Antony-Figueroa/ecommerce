import { useState, useEffect } from "react"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Package,
  Smile,
  Loader2,
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
import { api } from "@/lib/api"
import { EmojiPicker } from "@/components/shared/emoji-picker"
import { useToast } from "@/hooks/use-toast"

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image: string | null
  icon: string | null
  isActive: boolean
  sortOrder: number
  productCount: number
}

interface CategoryFormData {
  name: string
  description: string
  image: string
  icon: string
  isActive: boolean
  sortOrder: number
}

interface CategoryErrors {
  name?: string
  sortOrder?: string
}

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    description: "",
    image: "",
    icon: "",
    isActive: true,
    sortOrder: 0,
  })
  const [errors, setErrors] = useState<CategoryErrors>({})
  const { toast } = useToast()

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        // Optimizando carga paralela para eliminar waterfalls (async-parallel)
        const [categoriesRes] = await Promise.all([
          api.getAdminCategories()
        ])
        setCategories(categoriesRes.categories || [])
      } catch (error) {
        console.error("Error fetching categories:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las categorías",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      image: "",
      icon: "",
      isActive: true,
      sortOrder: 0,
    })
    setEditingCategory(null)
    setErrors({})
  }

  const validateForm = (): boolean => {
    const newErrors: CategoryErrors = {}
    let isValid = true

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es obligatorio"
      isValid = false
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "El nombre debe tener al menos 2 caracteres"
      isValid = false
    }

    if (formData.sortOrder < 0) {
      newErrors.sortOrder = "El orden no puede ser negativo"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSave = async () => {
    if (!validateForm()) return
    setSaving(true)
    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, formData)
        toast({
          title: "Éxito",
          description: "Categoría actualizada correctamente",
        })
      } else {
        await api.createCategory(formData)
        toast({
          title: "Éxito",
          description: "Categoría creada correctamente",
        })
      }
      setShowAddDialog(false)
      resetForm()
      // Recargar datos usando el mismo patrón optimizado
      const data = await api.getAdminCategories()
      setCategories(data.categories || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al guardar la categoría",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || "",
      image: category.image || "",
      icon: category.icon || "",
      isActive: category.isActive,
      sortOrder: category.sortOrder,
    })
    setShowAddDialog(true)
  }

  const deleteCategory = async (categoryId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta categoría?")) return
    
    try {
      await api.deleteCategory(categoryId)
      toast({
        title: "Éxito",
        description: "Categoría eliminada correctamente",
      })
      const data = await api.getAdminCategories()
      setCategories(data.categories || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar la categoría",
        variant: "destructive"
      })
    }
  }

  const toggleCategoryStatus = async (categoryId: string, currentStatus: boolean) => {
    try {
      await api.toggleCategoryStatus(categoryId, !currentStatus)
      toast({
        title: "Éxito",
        description: `Categoría ${!currentStatus ? 'activada' : 'desactivada'} correctamente`,
      })
      const data = await api.getAdminCategories()
      setCategories(data.categories || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al cambiar el estado",
        variant: "destructive"
      })
    }
  }

  const filteredCategories = categories.filter((category) => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "active" && category.isActive) ||
      (statusFilter === "inactive" && !category.isActive)
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <AdminLayout title="Categorías">
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-muted-foreground font-medium">Cargando categorías...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Categorías">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">
              {categories.length} categorias en tu tienda
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                resetForm()
                setShowAddDialog(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Categoria
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar categorias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Mostrar:</span>
            <div className="flex bg-muted p-1 rounded-md">
              <Button
                variant={statusFilter === "all" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setStatusFilter("all")}
              >
                Todas
              </Button>
              <Button
                variant={statusFilter === "active" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setStatusFilter("active")}
              >
                Activas
              </Button>
              <Button
                variant={statusFilter === "inactive" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setStatusFilter("inactive")}
              >
                Eliminadas
              </Button>
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCategories.map((category) => (
            <Card key={category.id} className="overflow-hidden">
              <div className="aspect-[2/1] relative bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                {category.image ? (
                  <img 
                    src={category.image} 
                    alt={category.name} 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "https://placehold.co/600x300/f1f5f9/64748b?text=Categoría";
                      target.onerror = null;
                    }}
                  />
                ) : (
                  <span className="text-6xl">{category.icon || "📁"}</span>
                )}
                <Badge className="absolute top-2 right-2" variant={category.isActive ? "default" : "secondary"}>
                  {category.isActive ? "Activa" : "Inactiva"}
                </Badge>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.slug}</p>
                  </div>
                  <Badge variant="outline">
                    <Package className="h-3 w-3 mr-1" />
                    {category.productCount} productos
                  </Badge>
                </div>
                
                {category.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {category.description}
                  </p>
                )}

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(category)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleCategoryStatus(category.id, category.isActive)}>
                    {category.isActive ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => deleteCategory(category.id)}
                    disabled={category.productCount > 0}
                    title={category.productCount > 0 ? "No se puede eliminar una categoría con productos asociados" : "Eliminar categoría"}
                  >
                    <Trash2 className={`h-4 w-4 ${category.productCount > 0 ? 'text-muted-foreground' : 'text-red-500'}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No hay categorias</h3>
              <p className="text-muted-foreground mb-4">Agrega tu primera categoria para organizar productos.</p>
              <Button onClick={() => { resetForm(); setShowAddDialog(true) }}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Categoria
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Editar Categoria" : "Agregar Nueva Categoria"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? "Modifica los datos de la categoria existente."
                  : "Completa los datos para crear una nueva categoria."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <label className="text-sm font-medium">Nombre *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    if (errors.name) setErrors({ ...errors, name: undefined })
                  }}
                  placeholder="Nombre de la categoria"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Descripcion</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripcion de la categoria"
                  className="w-full px-3 py-2 border rounded-md min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Icono (emoji)</label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="💊"
                      className="flex-1"
                    />
                    <EmojiPicker onSelect={(emoji) => setFormData({ ...formData, icon: emoji })}>
                      <Button variant="outline" size="icon" type="button" className="shrink-0">
                        <Smile className="h-4 w-4" />
                      </Button>
                    </EmojiPicker>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Orden</label>
                  <Input
                    type="number"
                    value={formData.sortOrder || ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      setFormData({ ...formData, sortOrder: isNaN(val) ? 0 : val })
                      if (errors.sortOrder) setErrors({ ...errors, sortOrder: undefined })
                    }}
                    placeholder="0"
                    className={errors.sortOrder ? "border-red-500" : ""}
                  />
                  {errors.sortOrder && <p className="text-xs text-red-500 mt-1">{errors.sortOrder}</p>}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">URL de imagen</label>
                <Input
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Categoria activa</span>
              </label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Guardando..." : editingCategory ? "Guardar cambios" : "Crear categoria"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
