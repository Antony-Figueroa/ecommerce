import { useState, useEffect } from "react"
import { 
  Save, 
  History, 
  AlertTriangle, 
  RotateCcw,
  Loader2,
  Settings
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
  const [showConfirm, setShowConfirm] = useState(false)
  const [updateReason, setUpdateReason] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchSettings()
  }, [])

  useEffect(() => {
    document.title = "Configuración | Ana's Supplements Admin"
  }, [])

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

        <Tabs defaultValue={groups[0]} className="w-full">
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
        </Tabs>

        {/* Dialogo de Confirmación */}
        <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
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
              <Button variant="ghost" onClick={() => setShowConfirm(false)}>
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
        <Dialog open={!!historyKey} onOpenChange={(open) => !open && setHistoryKey(null)}>
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
              <Button variant="secondary" onClick={() => setHistoryKey(null)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  )
}
