import { useState, useEffect } from "react"
import { 
  Save, 
  History, 
  AlertTriangle, 
  RotateCcw,
  Loader2,
  Settings,
  CheckCircle2,
  Database,
  ShieldCheck,
  Trash2,
  Clock,
  Download,
  FileCode,
  HardDrive
} from "lucide-react"
import { AdminPageHeader } from "@/components/admin/page-header"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
 
interface Setting {
  id: string
  key: string
  value: string
  type: string
  group: string
  label: string
  description: string | null
  updatedAt: string
}

interface SettingHistory {
  id: string
  oldValue: string
  newValue: string
  reason: string | null
  createdAt: string
  user: {
    name: string | null
    email: string
  }
}

export function AdminSettingsPage() {
  const [settingsGrouped, setSettingsGrouped] = useState<Record<string, Setting[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modifiedSettings, setModifiedSettings] = useState<Record<string, string>>({})
  const [historyKey, setHistoryKey] = useState<string | null>(null)
  const [history, setHistory] = useState<SettingHistory[]>([])
  const [updateReason, setUpdateReason] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)
  
  // Backup States
  const [backups, setBackups] = useState<any[]>([])
  const [loadingBackups, setLoadingBackups] = useState(false)
  const [showBackupAuth, setShowBackupAuth] = useState(false)
  const [backupPassword, setBackupPassword] = useState("")
  const [backupAction, setBackupAction] = useState<{
    type: 'create' | 'restore' | 'delete',
    filename?: string
  } | null>(null)
  const [processingBackup, setProcessingBackup] = useState(false)
  
  const { toast } = useToast()

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
    return Object.keys(modifiedSettings).length > 0 || updateReason !== ""
  }

  const handleCloseConfirmModal = () => {
    if (hasChanges()) {
      confirmAction({
        title: "¿Descartar cambios?",
        description: "Tienes cambios sin guardar. ¿Estás seguro de que deseas salir?",
        confirmText: "Descartar y Salir",
        variant: "destructive",
        onConfirm: () => {
          setModifiedSettings({})
          setUpdateReason("")
          setShowConfirm(false)
        }
      })
    } else {
      setShowConfirm(false)
    }
  }

  const handleCloseHistoryModal = () => {
    setHistoryKey(null)
  }

  useEffect(() => {
    fetchSettings()
    fetchBackups()
  }, [])

  useEffect(() => {
    document.title = "Configuración | Ana's Supplements Admin"
  }, [])

  const fetchBackups = async () => {
    try {
      setLoadingBackups(true)
      const data = await api.getBackups()
      setBackups(data)
    } catch (error) {
      console.error("Error fetching backups:", error)
    } finally {
      setLoadingBackups(false)
    }
  }

  const handleBackupAuth = (type: 'create' | 'restore' | 'delete', filename?: string) => {
    setBackupAction({ type, filename })
    setShowBackupAuth(true)
    setBackupPassword("")
  }

  const executeBackupAction = async () => {
    if (!backupAction || !backupPassword) return

    setProcessingBackup(true)
    try {
      if (backupAction.type === 'create') {
        await api.createBackup(backupPassword)
        toast({
          title: "Éxito",
          description: "Respaldo creado correctamente",
        })
      } else if (backupAction.type === 'restore' && backupAction.filename) {
        await api.restoreBackup(backupAction.filename, backupPassword)
        toast({
          title: "Éxito",
          description: "Base de datos restaurada correctamente. El sistema puede requerir reiniciar la sesión.",
        })
      } else if (backupAction.type === 'delete' && backupAction.filename) {
        await api.deleteBackup(backupAction.filename, backupPassword)
        toast({
          title: "Éxito",
          description: "Respaldo eliminado correctamente",
        })
      }
      
      setShowBackupAuth(false)
      setBackupAction(null)
      setBackupPassword("")
      fetchBackups()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al procesar la acción de respaldo",
        variant: "destructive"
      })
    } finally {
      setProcessingBackup(false)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const data = await api.getSettings()
      setSettingsGrouped(data as any)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar las configuraciones",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (key: string, value: string) => {
    setModifiedSettings(prev => ({ ...prev, [key]: value }))
  }

  const getSettingValue = (setting: Setting) => {
    return modifiedSettings[setting.key] !== undefined 
      ? modifiedSettings[setting.key] 
      : setting.value
  }

  const handleSaveClick = () => {
    if (Object.keys(modifiedSettings).length === 0) return
    setShowConfirm(true)
  }

  const handleConfirmSave = async () => {
    confirmAction({
      title: "¿Guardar cambios?",
      description: `Se aplicarán ${Object.keys(modifiedSettings).length} cambios en la configuración global.`,
      confirmText: "Guardar Cambios",
      onConfirm: async () => {
        setSaving(true)
        try {
          const updates = Object.entries(modifiedSettings).map(([key, value]) => ({
            key,
            value,
            reason: updateReason
          }))

          await api.updateSettingsBulk(updates)
          
          toast({
            title: "Éxito",
            description: "Configuraciones actualizadas correctamente",
          })
          
          setModifiedSettings({})
          setUpdateReason("")
          setShowConfirm(false)
          fetchSettings()
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.message || "Error al actualizar configuraciones",
            variant: "destructive"
          })
        } finally {
          setSaving(false)
        }
      }
    })
  }

  const viewHistory = async (key: string) => {
    setHistoryKey(key)
    try {
      const data = await api.getSettingHistory(key)
      setHistory(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar el historial",
        variant: "destructive"
      })
    }
  }

  const handleRevert = async (historyId: string) => {
    confirmAction({
      title: "¿Revertir configuración?",
      description: "¿Estás seguro de que deseas revertir esta configuración a este valor anterior?",
      confirmText: "Revertir",
      onConfirm: async () => {
        try {
          await api.revertSetting(historyId)
          toast({
            title: "Éxito",
            description: "Configuración revertida correctamente",
          })
          fetchSettings()
          if (historyKey) viewHistory(historyKey)
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.message || "Error al revertir",
            variant: "destructive"
          })
        }
      }
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">Cargando configuración...</p>
      </div>
    )
  }

  const groups = Object.keys(settingsGrouped)

  return (
    <>
      <div className="space-y-6">
        <AdminPageHeader 
          title="Configuración"
          subtitle="Gestiona los parámetros globales del sistema"
          icon={Settings}
          action={{
            label: "Guardar Cambios",
            onClick: handleSaveClick,
            icon: Save
          }}
        />

        <Tabs defaultValue={groups[0] || "general"} className="w-full">
          <TabsList className="inline-flex w-max md:w-auto bg-slate-100/50 dark:bg-muted/20 p-1.5 rounded-xl border border-slate-200/50 dark:border-border/50 shadow-sm mb-6">
            {groups.map(group => (
              <TabsTrigger 
                key={group} 
                value={group}
                className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:scale-[1.02] rounded-lg group"
              >
                <span className="whitespace-nowrap">{group.charAt(0).toUpperCase() + group.slice(1)}</span>
              </TabsTrigger>
            ))}
            <TabsTrigger 
              value="backups"
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition-all duration-300 data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-md data-[state=active]:scale-[1.02] rounded-lg group"
            >
              <Database className="h-4 w-4 mr-1" />
              <span className="whitespace-nowrap">Respaldos</span>
            </TabsTrigger>
          </TabsList>

          {groups.map(group => (
            <TabsContent key={group} value={group} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {settingsGrouped[group].map(setting => (
                  <Card key={setting.id} className="border-border/50 shadow-sm hover:shadow-md transition-all group">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <CardTitle className="text-lg font-bold flex items-center gap-2">
                            {setting.label}
                            {modifiedSettings[setting.key] !== undefined && (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100/80 border-none text-[10px]">
                                Modificado
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="text-xs font-medium">
                            {setting.description}
                          </CardDescription>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => viewHistory(setting.key)}
                          title="Ver historial"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={setting.key} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                            Valor
                          </Label>
                          <span className="text-[10px] font-mono text-muted-foreground/50">
                            {setting.key}
                          </span>
                        </div>
                        
                        {setting.type === 'boolean' ? (
                          <div className="flex items-center gap-4 p-3 bg-secondary/30 rounded-lg border border-border/50">
                            <input 
                              type="checkbox"
                              id={setting.key}
                              checked={getSettingValue(setting) === 'true'}
                              onChange={(e) => handleInputChange(setting.key, e.target.checked ? 'true' : 'false')}
                              className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor={setting.key} className="font-bold cursor-pointer">
                              {getSettingValue(setting) === 'true' ? 'Activado' : 'Desactivado'}
                            </Label>
                          </div>
                        ) : setting.type === 'number' ? (
                          <Input 
                            id={setting.key}
                            type="number"
                            value={getSettingValue(setting)}
                            onChange={(e) => handleInputChange(setting.key, e.target.value)}
                            className="font-bold bg-secondary/20 focus:bg-background transition-all"
                          />
                        ) : (
                          <Input 
                            id={setting.key}
                            value={getSettingValue(setting)}
                            onChange={(e) => handleInputChange(setting.key, e.target.value)}
                            className="font-bold bg-secondary/20 focus:bg-background transition-all"
                          />
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2 pb-4 flex justify-between items-center text-[10px] text-muted-foreground border-t border-border/50 mt-2">
                      <span className="italic">
                        Actualizado: {new Date(setting.updatedAt).toLocaleDateString()}
                      </span>
                      <Badge variant="outline" className="text-[9px] font-bold uppercase py-0 px-1.5 h-4">
                        {setting.type}
                      </Badge>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}

          <TabsContent value="backups" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                      <Database className="h-6 w-6 text-primary" />
                      Gestión de Respaldos
                    </CardTitle>
                    <CardDescription>
                      Crea y restaura copias de seguridad de la base de datos. Requiere contraseña de administrador.
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => handleBackupAuth('create')}
                    className="font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Crear Nuevo Respaldo
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingBackups ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground font-medium">Obteniendo respaldos...</p>
                  </div>
                ) : backups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-xl bg-muted/30">
                    <HardDrive className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground font-medium">No se han encontrado respaldos</p>
                    <p className="text-xs text-muted-foreground/60">Los respaldos creados aparecerán aquí</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {backups.map((backup) => (
                      <div 
                        key={backup.filename}
                        className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card hover:bg-secondary/10 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <FileCode className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">{backup.filename}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="flex items-center text-[10px] text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />
                                {new Date(backup.createdAt).toLocaleString()}
                              </span>
                              <span className="flex items-center text-[10px] text-muted-foreground font-mono">
                                <HardDrive className="h-3 w-3 mr-1" />
                                {formatSize(backup.size)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 text-[10px] font-bold border-primary/20 hover:bg-primary/5 hover:text-primary"
                            onClick={() => handleBackupAuth('restore', backup.filename)}
                          >
                            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                            Restaurar
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleBackupAuth('delete', backup.filename)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-muted/30 border-t border-border/50 px-6 py-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-500">Advertencia de Seguridad</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      La restauración de un respaldo reemplazará completamente la base de datos actual. 
                      Asegúrate de haber creado un respaldo reciente antes de proceder con una restauración. 
                      Esta acción es irreversible una vez completada.
                    </p>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogo de Autenticación para Respaldos */}
        <Dialog open={showBackupAuth} onOpenChange={setShowBackupAuth}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Validación de Administrador
              </DialogTitle>
              <DialogDescription>
                Esta acción requiere confirmar tu identidad con la contraseña especial de administrador.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-4">
              <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase">Confirmar Operación</p>
                  <p className="text-[11px] text-amber-700/80 dark:text-amber-500/80 leading-relaxed font-medium">
                    {backupAction?.type === 'create' ? "Estás a punto de crear una copia de seguridad del estado actual del sistema." : 
                     backupAction?.type === 'restore' ? "ATENCIÓN: Se sobrescribirán todos los datos actuales con la versión del respaldo seleccionado." :
                     "Se eliminará permanentemente este archivo de respaldo."}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backup-password text-xs font-bold uppercase tracking-wider">Contraseña de Administrador</Label>
                <Input 
                  id="backup-password"
                  type="password"
                  placeholder="Ingrese contraseña maestra..."
                  value={backupPassword}
                  onChange={(e) => setBackupPassword(e.target.value)}
                  className="bg-secondary/20 focus:bg-background font-bold"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && backupPassword && !processingBackup) {
                      executeBackupAction();
                    }
                  }}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setShowBackupAuth(false)} disabled={processingBackup}>
                Cancelar
              </Button>
              <Button 
                onClick={executeBackupAction} 
                disabled={!backupPassword || processingBackup}
                variant={backupAction?.type === 'delete' ? "destructive" : "default"}
                className="font-bold min-w-[120px]"
              >
                {processingBackup ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    {backupAction?.type === 'create' && <Download className="h-4 w-4 mr-2" />}
                    {backupAction?.type === 'restore' && <RotateCcw className="h-4 w-4 mr-2" />}
                    {backupAction?.type === 'delete' && <Trash2 className="h-4 w-4 mr-2" />}
                    {backupAction?.type === 'create' ? "Crear" : backupAction?.type === 'restore' ? "Restaurar" : "Eliminar"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialogo de Confirmación de Cambios */}
        <Dialog open={showConfirm} onOpenChange={(open) => {
          if (!open) handleCloseConfirmModal()
          else setShowConfirm(true)
        }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Confirmar Cambios
              </DialogTitle>
              <DialogDescription>
                Se aplicarán {Object.keys(modifiedSettings).length} cambios en la configuración.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-4">
              <ScrollArea className="max-h-48 border rounded-lg p-3 bg-muted/30">
                {Object.entries(modifiedSettings).map(([key, value]) => {
                  const setting = groups.flatMap(g => settingsGrouped[g]).find(s => s.key === key)
                  return (
                    <div key={key} className="flex flex-col gap-1 border-b border-border/50 last:border-0 pb-2 mb-2 last:mb-0">
                      <span className="text-xs font-bold text-primary">{setting?.label}</span>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground line-through">{setting?.value}</span>
                        <RotateCcw className="h-2 w-2 text-muted-foreground" />
                        <span className="font-bold">{value}</span>
                      </div>
                    </div>
                  )
                })}
              </ScrollArea>

              <div className="space-y-2">
                <Label htmlFor="reason" className="text-xs font-bold uppercase text-muted-foreground">
                  Motivo (opcional)
                </Label>
                <Textarea 
                  id="reason"
                  placeholder="Explica brevemente por qué realizas este cambio..."
                  value={updateReason}
                  onChange={(e) => setUpdateReason(e.target.value)}
                  className="bg-secondary/20 focus:bg-background h-20 resize-none"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={handleCloseConfirmModal}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmSave} disabled={saving} className="font-bold">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : "Confirmar Cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialogo de Historial */}
        <Dialog open={!!historyKey} onOpenChange={(open) => {
          if (!open) handleCloseHistoryModal()
          else setHistoryKey(historyKey)
        }}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Historial de Cambios
              </DialogTitle>
              <DialogDescription>
                Registro de modificaciones para: <span className="font-bold text-primary">{historyKey}</span>
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="h-[400px] pr-4 my-4">
              <div className="space-y-4">
                {history.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground italic">
                    No hay historial disponible.
                  </div>
                ) : (
                  history.map((entry) => (
                    <div key={entry.id} className="relative pl-6 border-l-2 border-primary/20 pb-4 last:pb-0">
                      <div className="absolute left-[-5px] top-0 h-2 w-2 rounded-full bg-primary" />
                      <div className="bg-secondary/20 rounded-lg p-3 border border-border/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-primary">
                            {new Date(entry.createdAt).toLocaleString()}
                          </span>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-6 text-[9px] font-bold"
                            onClick={() => handleRevert(entry.id)}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" /> Revertir
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs mb-2">
                          <span className="text-muted-foreground line-through opacity-50">{entry.oldValue}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-bold">{entry.newValue}</span>
                        </div>
                        
                        {entry.reason && (
                          <p className="text-[10px] text-muted-foreground italic mb-2 bg-background/50 p-1.5 rounded">
                            "{entry.reason}"
                          </p>
                        )}

                        <div className="flex items-center gap-1.5 pt-1.5 border-t border-border/30">
                          <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                            {entry.user.name?.charAt(0) || 'U'}
                          </div>
                          <span className="text-[9px] font-medium text-muted-foreground">
                            {entry.user.name || entry.user.email}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button variant="secondary" onClick={handleCloseHistoryModal}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Sistema Centralizado de Confirmación */}
        <Dialog open={confirmConfig.open} onOpenChange={(open) => setConfirmConfig(prev => ({ ...prev, open }))}>
          <DialogContent className="sm:max-w-[400px] border-none shadow-2xl p-0 overflow-hidden rounded-2xl">
            <div className={cn(
              "h-2 w-full",
              confirmConfig.variant === "destructive" ? "bg-red-500" : "bg-primary"
            )} />
            
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={cn(
                  "p-3 rounded-xl",
                  confirmConfig.variant === "destructive" ? "bg-red-50" : "bg-primary/10"
                )}>
                  {confirmConfig.variant === "destructive" ? (
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  ) : (
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground leading-none">
                    {confirmConfig.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Confirmación de acción
                  </p>
                </div>
              </div>

              <div className="bg-muted/30 rounded-xl p-4 mb-6 border border-border/50">
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {confirmConfig.description}
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-11 font-bold rounded-xl border-border/50 hover:bg-muted/50"
                  onClick={() => setConfirmConfig(prev => ({ ...prev, open: false }))}
                >
                  Cancelar
                </Button>
                <Button
                  variant={confirmConfig.variant === "destructive" ? "destructive" : "default"}
                  className={cn(
                    "flex-1 h-11 font-bold rounded-xl shadow-lg transition-all active:scale-95",
                    confirmConfig.variant !== "destructive" && "bg-primary hover:bg-primary/90 shadow-primary/20"
                  )}
                  onClick={() => {
                    confirmConfig.onConfirm();
                    setConfirmConfig(prev => ({ ...prev, open: false }));
                  }}
                >
                  {confirmConfig.confirmText || "Confirmar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
