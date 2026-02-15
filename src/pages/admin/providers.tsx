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
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react"
import { AdminPageHeader } from "@/components/admin/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
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
import { useToast } from "@/hooks/use-toast"

interface Provider {
  id: string
  name: string
  country: string | null
  address: string | null
  createdAt: string
  updatedAt: string
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

  const hasChanges = () => {
    if (!editingProvider) {
      return formData.name !== "" || formData.country !== "" || formData.address !== ""
    }
    return formData.name !== (editingProvider.name || "") ||
           formData.country !== (editingProvider.country || "") ||
           formData.address !== (editingProvider.address || "")
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
    } else if (formData.country.trim().length < 2) {
      newErrors.country = "El país debe tener al menos 2 caracteres"
      isValid = false
    }

    if (!formData.address.trim()) {
      newErrors.address = "La dirección es obligatoria"
      isValid = false
    } else if (formData.address.trim().length < 5) {
      newErrors.address = "La dirección debe tener al menos 5 caracteres"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSave = async () => {
    if (!validateForm()) return

    confirmAction({
      title: editingProvider ? "¿Actualizar proveedor?" : "¿Crear proveedor?",
      description: editingProvider 
        ? `¿Estás seguro de que deseas guardar los cambios en "${formData.name}"?`
        : `¿Deseas registrar al proveedor "${formData.name}"?`,
      confirmText: editingProvider ? "Guardar cambios" : "Crear proveedor",
      onConfirm: async () => {
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
    })
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
    const provider = providers.find(p => p.id === id)
    if (!provider) return

    confirmAction({
      title: "¿Eliminar proveedor?",
      description: `¿Estás seguro de que deseas eliminar a "${provider.name}"? Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      variant: "destructive",
      onConfirm: async () => {
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
    })
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
                    className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    onClick={() => handleEdit(provider)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  {provider._count && provider._count.batches > 0 ? (
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
                            <Info className="h-3 w-3" />
                            No se puede eliminar: tiene lotes asociados
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => handleDelete(provider.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
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

      <Dialog open={showAddDialog} onOpenChange={(open) => {
        if (!open) handleCloseModal()
        else setShowAddDialog(true)
      }}>
        <DialogContent className="sm:max-w-[520px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background p-6 border-b border-primary/10">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-primary flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  {editingProvider ? <Edit className="h-6 w-6 text-primary" /> : <Plus className="h-6 w-6 text-primary" />}
                </div>
                {editingProvider ? "Editar Proveedor" : "Nuevo Proveedor"}
              </DialogTitle>
              <DialogDescription className="text-slate-500 font-medium ml-13">
                Completa los datos del proveedor para gestionar tus productos.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-6 bg-background">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1 flex items-center gap-2">
                  Nombre del Proveedor
                  <span className="text-primary">*</span>
                </label>
                <Input
                  placeholder="Ej. Distribuidora Salud C.A."
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value })
                    if (errors.name) setErrors({ ...errors, name: undefined })
                  }}
                  className={cn(
                    "h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-primary/20 rounded-xl font-medium transition-all",
                    errors.name && "border-destructive focus:border-destructive focus:ring-destructive/20 bg-destructive/5"
                  )}
                />
                {errors.name && (
                  <p className="text-[11px] font-bold text-destructive ml-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                    <AlertTriangle className="h-3 w-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1 flex items-center gap-2">
                  País de Origen
                  <span className="text-primary">*</span>
                </label>
                <Input
                  placeholder="Ej. Venezuela"
                  value={formData.country}
                  onChange={(e) => {
                    setFormData({ ...formData, country: e.target.value })
                    if (errors.country) setErrors({ ...errors, country: undefined })
                  }}
                  className={cn(
                    "h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-primary/20 rounded-xl font-medium transition-all",
                    errors.country && "border-destructive focus:border-destructive focus:ring-destructive/20 bg-destructive/5"
                  )}
                />
                {errors.country && (
                  <p className="text-[11px] font-bold text-destructive ml-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                    <AlertTriangle className="h-3 w-3" />
                    {errors.country}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1 flex items-center gap-2">
                  Dirección Fiscal
                  <span className="text-primary">*</span>
                </label>
                <Textarea
                  placeholder="Dirección completa del proveedor..."
                  value={formData.address}
                  onChange={(e) => {
                    setFormData({ ...formData, address: e.target.value })
                    if (errors.address) setErrors({ ...errors, address: undefined })
                  }}
                  className={cn(
                    "min-h-[100px] bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:border-primary focus:ring-primary/20 rounded-xl font-medium transition-all resize-none",
                    errors.address && "border-destructive focus:border-destructive focus:ring-destructive/20 bg-destructive/5"
                  )}
                />
                {errors.address && (
                  <p className="text-[11px] font-bold text-destructive ml-1 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
                    <AlertTriangle className="h-3 w-3" />
                    {errors.address}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={handleCloseModal}
                disabled={saving}
                className="flex-1 h-12 rounded-xl font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 transition-all"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSave}
                disabled={saving}
                className="flex-[2] h-12 rounded-xl font-black bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all disabled:opacity-70"
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Guardando...
                  </div>
                ) : (
                  editingProvider ? "Guardar Cambios" : "Crear Proveedor"
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
