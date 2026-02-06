import { useState, useEffect, useMemo } from "react"
import { Bell, Check, ShoppingCart, Star, Tag, Info, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

type NotificationCategory = 'ORDERS' | 'FAVORITES' | 'PROMOTIONS' | 'SYSTEM' | 'ALL'

interface Notification {
  id: string
  type: string
  priority: 'LOW' | 'NORMAL' | 'URGENT'
  category: string
  title: string
  message: string
  isRead: boolean
  link?: string
  metadata?: string
  createdAt: string
}

interface NotificationTrayProps {
  onClose?: () => void
}

export function NotificationTray({ onClose }: NotificationTrayProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<NotificationCategory>('ALL')
  const navigate = useNavigate()

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const data = await api.getClientNotifications()
      setNotifications(data)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // En un entorno real, usaríamos WebSocket aquí.
    // Por ahora, mantenemos el polling o confiamos en las actualizaciones manuales.
  }, [])

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'ALL') return notifications
    return notifications.filter(n => n.category === activeTab)
  }, [notifications, activeTab])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markClientNotificationRead(id)
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      )
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await api.markAllClientNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const handleAction = (notification: Notification) => {
    handleMarkAsRead(notification.id)
    if (notification.link) {
      navigate(notification.link)
      if (onClose) onClose()
    }
  }

  const getIcon = (category: string) => {
    switch (category) {
      case 'ORDERS': return <ShoppingCart className="h-4 w-4" />
      case 'FAVORITES': return <Star className="h-4 w-4" />
      case 'PROMOTIONS': return <Tag className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'URGENT': return "bg-red-500/10 border-red-500/20"
      case 'NORMAL': return "bg-primary/5 border-primary/10"
      default: return "bg-muted/50 border-transparent"
    }
  }

  return (
    <div className="flex flex-col h-full max-h-[600px] w-full bg-background border rounded-xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">Bandeja de Entrada</h2>
          {unreadCount > 0 && (
            <Badge variant="default" className="rounded-full px-2 py-0.5 text-[10px] font-black">
              {unreadCount} NUEVAS
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-primary font-bold hover:bg-primary/10"
              onClick={handleMarkAllRead}
            >
              <Check className="h-3 w-3 mr-1" />
              Marcar todo
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="ALL" className="w-full flex-1 flex flex-col" onValueChange={(v) => setActiveTab(v as NotificationCategory)}>
        <div className="px-4 pt-2 bg-muted/10 border-b">
          <TabsList className="bg-transparent h-10 w-full justify-start gap-4 p-0">
            <TabsTrigger value="ALL" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 pb-2">Todo</TabsTrigger>
            <TabsTrigger value="ORDERS" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 pb-2">Pedidos</TabsTrigger>
            <TabsTrigger value="FAVORITES" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 pb-2">Favoritos</TabsTrigger>
            <TabsTrigger value="PROMOTIONS" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-1 pb-2">Ofertas</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 gap-3">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground animate-pulse">Buscando actualizaciones...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center gap-4">
              <div className="size-16 bg-muted rounded-full flex items-center justify-center">
                <Bell className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <div>
                <p className="font-bold text-foreground">Sin notificaciones</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {activeTab === 'ALL' 
                    ? "Te avisaremos cuando pase algo interesante." 
                    : `No tienes notificaciones en la categoría ${activeTab.toLowerCase()}.`}
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={cn(
                    "relative flex gap-4 p-4 transition-all hover:bg-muted/50 cursor-pointer border-l-4",
                    !notification.isRead ? "border-l-primary" : "border-l-transparent",
                    getPriorityClass(notification.priority)
                  )}
                  onClick={() => handleAction(notification)}
                >
                  <div className={cn(
                    "size-10 rounded-xl flex items-center justify-center shrink-0",
                    notification.isRead ? "bg-muted text-muted-foreground" : "bg-primary/20 text-primary"
                  )}>
                    {getIcon(notification.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className={cn(
                        "text-sm leading-none truncate",
                        !notification.isRead ? "font-bold text-foreground" : "font-medium text-muted-foreground"
                      )}>
                        {notification.title}
                      </h4>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: es })}
                      </span>
                    </div>
                    <p className={cn(
                      "text-xs line-clamp-2 leading-relaxed",
                      !notification.isRead ? "text-foreground/80" : "text-muted-foreground/70"
                    )}>
                      {notification.message}
                    </p>
                    {notification.link && (
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold px-3 border-primary/20 hover:bg-primary/10 hover:text-primary transition-colors">
                          Ver detalles
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </Tabs>

      <div className="p-3 border-t bg-muted/30 text-center">
        <Button 
          variant="link" 
          className="text-[10px] h-auto p-0 text-muted-foreground hover:text-primary font-bold uppercase tracking-wider"
          onClick={() => {
            navigate('/notifications')
            if (onClose) onClose()
          }}
        >
          Ver historial completo
        </Button>
      </div>
    </div>
  )
}
