import { useState, useEffect } from "react"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Globe,
  MapPin,
  Truck,
  User,
  X,
  Check,
  AlertTriangle,
} from "lucide-react"
import { AdminPageHeader } from "@/components/admin/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Provider {
  id: string
  name: string
  country: string | null
  address: string | null
  createdAt: string
  updatedAt: string
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

export function AdminProvidersPage() {
  const { toast } = useToast()
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null)
  const [errors, setErrors] = useState<ProviderErrors>({})
  const [formData, setFormData] = useState<ProviderFormData>({
    name: "",
    country: "",
    address: "",
  })

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      setLoading(true)
      const data = await api.getProviders()
      setProviders(data.providers || [])
    } catch (error: any) {
      console.error("Error fetching providers:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los proveedores",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      country: "",
      address: "",
    })
    setEditingProvider(null)
    setErrors({})
  }

  const validateForm = (): boolean => {
    const newErrors: ProviderErrors = {}
    let isValid = true

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es obligatorio"
      isValid = false
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "El nombre debe tener al menos 2 caracteres"
      isValid = false
    }

    if (!formData.country.trim()) {
      newErrors.country = "El país es obligatorio"
      isValid = false
    }

    if (!formData.address.trim()) {
      newErrors.address = "La dirección es obligatoria"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)
    try {
      if (editingProvider) {
        await api.updateProvider(editingProvider.id, formData)
        toast({
          title: "Éxito",
          description: "Proveedor actualizado correctamente",
        })
      } else {
        await api.createProvider(formData)
        toast({
          title: "Éxito",
          description: "Proveedor creado correctamente",
        })
      }

      setShowAddDialog(false)
      resetForm()
      fetchProviders()
    } catch (error: any) {
      console.error("Error saving provider:", error)
      toast({
        title: "Error",
        description: error.message || "Error al guardar el proveedor",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (provider: Provider) => {
    setEditingProvider(provider)
    setFormData({
      name: provider.name || "",
      country: provider.country || "",
      address: provider.address || "",
    })
    setErrors({})
    setShowAddDialog(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este proveedor?")) return

    try {
      await api.deleteProvider(id)
      toast({
        title: "Éxito",
        description: "Proveedor eliminado correctamente",
      })
      fetchProviders()
    } catch (error: any) {
      console.error("Error deleting provider:", error)
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el proveedor",
        variant: "destructive",
      })
    }
  }

  const filteredProviders = providers.filter((provider) => {
    const matchesSearch =
      provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (provider.country && provider.country.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (provider.address && provider.address.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesSearch
  })

  if (loading && providers.length === 0) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/4"></div>
        <div className="h-64 bg-muted rounded"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Proveedores"
        subtitle={`Total: ${providers.length} proveedores registrados`}
        icon={Truck}
        action={{
          label: "Agregar Proveedor",
          onClick: () => {
            resetForm()
            setShowAddDialog(true)
          },
          icon: Plus,
        }}
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, país o dirección..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-11 bg-background border-border/60 rounded-xl shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProviders.map((provider) => (
          <Card key={provider.id} className="overflow-hidden border-border/60 hover:border-primary/50 transition-colors group">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{provider.name}</h3>
                    <p className="text-xs text-muted-foreground">Registrado el {new Date(provider.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => handleEdit(provider)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(provider.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4" />
                  <span>{provider.country || "País no especificado"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{provider.address || "Dirección no especificada"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredProviders.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <div className="inline-flex p-4 bg-muted rounded-full mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No se encontraron proveedores</h3>
            <p className="text-muted-foreground">Intenta con otros términos de búsqueda</p>
          </div>
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingProvider ? "Editar Proveedor" : "Nuevo Proveedor"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre del Proveedor</label>
              <Input
                placeholder="Ej. Distribuidora Salud C.A."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">País</label>
              <Input
                placeholder="Ej. Venezuela"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className={errors.country ? "border-red-500" : ""}
              />
              {errors.country && <p className="text-xs text-red-500">{errors.country}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Dirección</label>
              <Input
                placeholder="Ej. Av. Principal, Edif. Salud, Caracas"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className={errors.address ? "border-red-500" : ""}
              />
              {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : editingProvider ? "Guardar Cambios" : "Crear Proveedor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
