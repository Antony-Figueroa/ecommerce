import { useState, useEffect } from "react"
import { NotificationTray } from "@/components/layout/notification-tray"
import { Bell, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function NotificationsPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [muteSettings, setMuteSettings] = useState({
    ORDERS: true,
    FAVORITES: true,
    SYSTEM: true
  })

  // Cargar configuraciones del backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await api.getNotificationSettings()
        setMuteSettings({
          ORDERS: settings.orders,
          FAVORITES: settings.favorites,
          SYSTEM: settings.system
        })
      } catch (error) {
        console.error('Error al cargar configuraciones:', error)
      }
    }
    fetchSettings()
  }, [])

  const handleToggleMute = async (category: keyof typeof muteSettings) => {
    const newValue = !muteSettings[category]
    const newSettings = { ...muteSettings, [category]: newValue }
    
    // Actualización optimista
    setMuteSettings(newSettings)

    try {
      setIsLoading(true)
      await api.updateNotificationSettings({
        orders: category === 'ORDERS' ? newValue : muteSettings.ORDERS,
        favorites: category === 'FAVORITES' ? newValue : muteSettings.FAVORITES,
        system: category === 'SYSTEM' ? newValue : muteSettings.SYSTEM
      })
      
      toast({
        title: "Ajustes actualizados",
        description: "Tus preferencias de notificación han sido guardadas."
      })
    } catch (error) {
      // Revertir en caso de error
      setMuteSettings(muteSettings)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron guardar tus preferencias."
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
            <Bell className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Notificaciones</h1>
            <p className="text-muted-foreground">Gestiona tus alertas y actualizaciones del catálogo.</p>
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2 font-bold border-primary/20 hover:bg-primary/5">
              <Settings className="h-4 w-4" />
              Preferencias
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Preferencias de Notificación</DialogTitle>
              <DialogDescription>
                Elige qué tipo de notificaciones deseas recibir en tiempo real.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Pedidos</Label>
                  <p className="text-xs text-muted-foreground">Actualizaciones sobre tus compras.</p>
                </div>
                <Switch 
                  checked={muteSettings.ORDERS} 
                  onCheckedChange={() => handleToggleMute('ORDERS')}
                  disabled={isLoading}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Favoritos</Label>
                  <p className="text-xs text-muted-foreground">Alertas de stock y precio.</p>
                </div>
                <Switch 
                  checked={muteSettings.FAVORITES} 
                  onCheckedChange={() => handleToggleMute('FAVORITES')}
                  disabled={isLoading}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-3xl border border-border/50 overflow-hidden shadow-sm">
        <NotificationTray />
      </div>
    </div>
  )
}
