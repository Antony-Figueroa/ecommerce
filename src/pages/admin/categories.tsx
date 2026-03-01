import { useState, useEffect } from "react"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  LayoutGrid,
  AlertTriangle,
  CheckCircle2,
  X,
} from "lucide-react"
import { AdminPageHeader } from "@/components/admin/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
  const { toast } = useToast()

  const confirmAction = (config: Omit<typeof confirmConfig, "open">) => {
    setConfirmConfig({ ...config, open: true })
  }

  const hasChanges = () => {
    if (!editingCategory) {
      return formData.name !== "" || 
             formData.description !== "" || 
             formData.icon !== "" || 
             formData.sortOrder !== 0
    }

    return formData.name !== editingCategory.name ||
           formData.description !== (editingCategory.description || "") ||
           formData.icon !== (editingCategory.icon || "") ||
           formData.sortOrder !== editingCategory.sortOrder
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

    confirmAction({
      title: editingCategory ? "¿Actualizar categoría?" : "¿Crear categoría?",
      description: editingCategory 
        ? `¿Estás seguro de que deseas guardar los cambios en "${formData.name}"?`
        : `¿Deseas crear la nueva categoría "${formData.name}"?`,
      confirmText: editingCategory ? "Guardar cambios" : "Crear categoría",
      onConfirm: async () => {
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
    })
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
    const category = categories.find(c => c.id === categoryId)
    if (!category) return

    confirmAction({
      title: "¿Eliminar categoría?",
      description: `¿Estás seguro de que deseas eliminar la categoría "${category.name}"? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      variant: "destructive",
      onConfirm: async () => {
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
    })
  }

  const toggleCategoryStatus = async (categoryId: string, currentStatus: boolean) => {
    const category = categories.find(c => c.id === categoryId)
    if (!category) return

    confirmAction({
      title: currentStatus ? "¿Desactivar categoría?" : "¿Activar categoría?",
      description: currentStatus 
        ? `¿Estás seguro de que deseas desactivar "${category.name}"? Los productos de esta categoría podrían no ser visibles.`
        : `¿Deseas activar la categoría "${category.name}"?`,
      confirmText: currentStatus ? "Desactivar" : "Activar",
      variant: currentStatus ? "destructive" : "default",
      onConfirm: async () => {
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
    })
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
      <AdminPageHeader 
        title="Categorías"
        subtitle={`${categories.length} categorías configuradas en tu tienda`}
        icon={LayoutGrid}
        action={{
          label: "Nueva Categoría",
          onClick: () => {
            resetForm()
            setShowAddDialog(true)
          },
          icon: Plus
        }}
      />

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
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | "active" | "inactive")}>
              <SelectTrigger className="w-[140px] h-9 text-xs font-bold uppercase tracking-wider">
                <SelectValue placeholder="Filtrar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs font-bold">Todos</SelectItem>
                <SelectItem value="active" className="text-xs font-bold">Activos</SelectItem>
                <SelectItem value="inactive" className="text-xs font-bold">Inactivos</SelectItem>
              </SelectContent>
            </Select>
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
                  {category.productCount > 0 ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-not-allowed">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground/50"
                              disabled
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-destructive text-destructive-foreground border-none">
                          <p className="text-xs font-bold flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            No se puede eliminar: tiene productos asociados
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => deleteCategory(category.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
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
                  {category.isActive && category.productCount > 0 ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <Button 
                              variant="outline" 
                              size="sm"
                              disabled
                            >
                              Desactivar
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>No se puede desactivar porque tiene productos asociados</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toggleCategoryStatus(category.id, category.isActive)}
                    >
                      {category.isActive ? "Desactivar" : "Activar"}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        if (!open) handleCloseModal()
        else setShowAddDialog(true)
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{editingCategory ? "Editar categoria" : "Nueva categoria"}</DialogTitle>
              <Button variant="ghost" size="icon" onClick={handleCloseModal}>
                <X className="h-4 w-4" />
              </Button>
            </div>
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
            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
              />
              <label htmlFor="isActive" className="text-sm cursor-pointer">
                Categoria activa
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : editingCategory ? "Guardar cambios" : "Crear categoria"}
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
