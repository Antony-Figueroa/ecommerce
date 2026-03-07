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

interface Format {
    id: string
    name: string
    description: string | null
    isActive: boolean
}

interface FormatFormData {
    name: string
    description: string
    isActive: boolean
}

export function FormatManagement() {
    const [formats, setFormats] = useState<Format[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [editingFormat, setEditingFormat] = useState<Format | null>(null)
    const [formData, setFormData] = useState<FormatFormData>({
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
        loadFormats()
    }, [])

    const loadFormats = async () => {
        setLoading(true)
        try {
            const data = await api.getFormats(false)
            setFormats(data)
        } catch (error) {
            console.error("Error al cargar formatos:", error)
            toast({
                title: "Error",
                description: "No se pudieron cargar los formatos",
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
        setEditingFormat(null)
    }

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast({ title: "Error", description: "El nombre es obligatorio", variant: "destructive" })
            return
        }

        setSaving(true)
        try {
            if (editingFormat) {
                await api.updateFormat(editingFormat.id, formData)
                toast({ title: "Éxito", description: "Formato actualizado correctamente" })
            } else {
                await api.createFormat(formData)
                toast({ title: "Éxito", description: "Formato creado correctamente" })
            }
            setShowAddDialog(false)
            resetForm()
            loadFormats()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Error al guardar el formato",
                variant: "destructive"
            })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = (format: Format) => {
        setConfirmConfig({
            open: true,
            title: "¿Eliminar formato?",
            description: `¿Estás seguro de que deseas eliminar o inactivar "${format.name}"? Si tiene productos asociados, solo se inactivará.`,
            variant: "destructive",
            confirmText: "Eliminar/Inactivar",
            onConfirm: async () => {
                try {
                    await api.deleteFormat(format.id)
                    toast({ title: "Éxito", description: "Formato eliminado o inactivado" })
                    loadFormats()
                } catch (error: any) {
                    toast({
                        title: "Error",
                        description: error.message || "Error al eliminar el formato",
                        variant: "destructive"
                    })
                } finally {
                    setConfirmConfig(prev => ({ ...prev, open: false }))
                }
            }
        })
    }

    const filteredFormats = formats.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar formatos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button onClick={() => { resetForm(); setShowAddDialog(true) }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Formato
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="h-32 bg-muted/20" />
                        </Card>
                    ))
                ) : filteredFormats.length > 0 ? (
                    filteredFormats.map((format) => (
                        <Card key={format.id} className={!format.isActive ? "opacity-60" : ""}>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-lg">{format.name}</h3>
                                    <Badge variant={format.isActive ? "default" : "secondary"}>
                                        {format.isActive ? "Activo" : "Inactivo"}
                                    </Badge>
                                </div>
                                {format.description && (
                                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                        {format.description}
                                    </p>
                                )}
                                <div className="flex justify-end gap-2 pt-2 border-t">
                                    <Button variant="ghost" size="sm" onClick={() => {
                                        setEditingFormat(format)
                                        setFormData({
                                            name: format.name,
                                            description: format.description || "",
                                            isActive: format.isActive,
                                        })
                                        setShowAddDialog(true)
                                    }}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(format)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                        No se encontraron formatos.
                    </div>
                )}
            </div>

            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingFormat ? "Editar Formato" : "Nuevo Formato"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nombre *</label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Nombre del formato (ej: Jarabe, Cápsulas)..."
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
                                id="format-isActive"
                                checked={formData.isActive}
                                onCheckedChange={(checked) => setFormData({ ...formData, isActive: !!checked })}
                            />
                            <label htmlFor="format-isActive" className="text-sm font-medium leading-none">
                                Formato activo
                            </label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {editingFormat ? "Guardar Cambios" : "Crear Formato"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
