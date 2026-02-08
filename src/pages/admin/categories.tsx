import { useState, useEffect } from "react"
import {
  Plus,
  Search,
  Edit,
  Trash2,
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
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">Cargando categorías...</p>
      </div>
    )
  }

  return (
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
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nueva categoria
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar categoria..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
              size="sm"
            >
              Todos
            </Button>
            <Button
              variant={statusFilter === "active" ? "default" : "outline"}
              onClick={() => setStatusFilter("active")}
              size="sm"
            >
              Activos
            </Button>
            <Button
              variant={statusFilter === "inactive" ? "default" : "outline"}
              onClick={() => setStatusFilter("inactive")}
              size="sm"
            >
              Inactivos
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((category) => (
          <Card key={category.id} className={!category.isActive ? "opacity-60" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-2xl">
                    {category.icon || "📦"}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.productCount} productos</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteCategory(category.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                {category.description || "Sin descripción"}
              </p>
              <div className="flex items-center justify-between">
                <Badge variant={category.isActive ? "default" : "secondary"}>
                  {category.isActive ? "Activa" : "Inactiva"}
                </Badge>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => toggleCategoryStatus(category.id, category.isActive)}
                  >
                    {category.isActive ? "Desactivar" : "Activar"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Editar categoria" : "Nueva categoria"}</DialogTitle>
            <DialogDescription>
              Completa los datos de la categoria para organizar tus productos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-4 items-center">
              <div className="col-span-1">
                <label className="text-sm font-medium mb-1 block">Icono</label>
                <EmojiPicker 
                  onSelect={(icon) => setFormData({ ...formData, icon })} 
                >
                  <Button variant="outline" className="w-full text-2xl p-0 h-12">
                    {formData.icon || "📦"}
                  </Button>
                </EmojiPicker>
              </div>
              <div className="col-span-3">
                <label className="text-sm font-medium">Nombre</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Suplementos"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Breve descripción..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Orden</label>
                <Input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0
                    setFormData({ ...formData, sortOrder: val })
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
  )
}
