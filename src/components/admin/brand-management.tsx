import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, Loader2, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Brand {
    id: string
    name: string
    description: string | null
    isActive: boolean
}

interface BrandFormData {
    name: string
    description: string
    isActive: boolean
}

export function BrandManagement() {
    const [brands, setBrands] = useState<Brand[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
    const [formData, setFormData] = useState<BrandFormData>({
        name: "",
        description: "",
        isActive: true,
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
        onConfirm: () => { },
    })
    const { toast } = useToast()

    useEffect(() => {
        loadBrands()
    }, [])

    const loadBrands = async () => {
        setLoading(true)
        try {
            const data = await api.getBrands(false) // Traer todas, activas e inactivas
            setBrands(data)
        } catch (error) {
            console.error("Error al cargar marcas:", error)
            toast({
                title: "Error",
                description: "No se pudieron cargar las marcas",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            isActive: true,
        })
        setEditingBrand(null)
    }

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" })
            return
        }

        setSaving(true)
        try {
            if (editingBrand) {
                await api.updateBrand(editingBrand.id, formData)
                toast({ title: "Éxito", description: "Marca actualizada correctamente" })
            } else {
                await api.createBrand(formData)
                toast({ title: "Éxito", description: "Marca creada correctamente" })
            }
            setShowAddDialog(false)
            resetForm()
            loadBrands()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Error al guardar la marca",
                variant: "destructive"
            })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = (brand: Brand) => {
        setConfirmConfig({
            open: true,
            title: "¿Eliminar marca?",
            description: `¿Estás seguro de que deseas eliminar o inactivar "${brand.name}"? Si tiene productos asociados, solo se inactivará.`,
            variant: "destructive",
            confirmText: "Eliminar/Inactivar",
            onConfirm: async () => {
                try {
                    await api.deleteBrand(brand.id)
                    toast({ title: "Éxito", description: "Marca eliminada o inactivada" })
                    loadBrands()
                } catch (error: any) {
                    toast({
                        title: "Error",
                        description: error.message || "Error al eliminar la marca",
                        variant: "destructive"
                    })
                } finally {
                    setConfirmConfig(prev => ({ ...prev, open: false }))
                }
            }
        })
    }

    const filteredBrands = brands.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar marcas..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button onClick={() => { resetForm(); setShowAddDialog(true) }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Marca
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="h-32 bg-muted/20" />
                        </Card>
                    ))
                ) : filteredBrands.length > 0 ? (
                    filteredBrands.map((brand) => (
                        <Card key={brand.id} className={!brand.isActive ? "opacity-60" : ""}>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-lg">{brand.name}</h3>
                                    <Badge variant={brand.isActive ? "default" : "secondary"}>
                                        {brand.isActive ? "Activa" : "Inactiva"}
                                    </Badge>
                                </div>
                                {brand.description && (
                                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                        {brand.description}
                                    </p>
                                )}
                                <div className="flex justify-end gap-2 pt-2 border-t">
                                    <Button variant="ghost" size="sm" onClick={() => {
                                        setEditingBrand(brand)
                                        setFormData({
                                            name: brand.name,
                                            description: brand.description || "",
                                            isActive: brand.isActive,
                                        })
                                        setShowAddDialog(true)
                                    }}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(brand)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                        No se encontraron marcas.
                    </div>
                )}
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingBrand ? "Editar Marca" : "Nueva Marca"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nombre *</label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Nombre de la marca..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Descripción</label>
                            <Input
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Descripción (opcional)..."
                            />
                        </div>
                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox
                                id="brand-isActive"
                                checked={formData.isActive}
                                onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
                            />
                            <label htmlFor="brand-isActive" className="text-sm font-medium leading-none">
                                Marca activa
                            </label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {editingBrand ? "Guardar Cambios" : "Crear Marca"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog */}
            <Dialog open={confirmConfig.open} onOpenChange={(open) => setConfirmConfig(prev => ({ ...prev, open }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {confirmConfig.variant === "destructive" && <AlertTriangle className="h-5 w-5 text-destructive" />}
                            {confirmConfig.title}
                        </DialogTitle>
                        <DialogDescription>{confirmConfig.description}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmConfig(prev => ({ ...prev, open: false }))}>
                            Cancelar
                        </Button>
                        <Button variant={confirmConfig.variant} onClick={confirmConfig.onConfirm}>
                            {confirmConfig.confirmText || "Confirmar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
