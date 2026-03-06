import { useState, useEffect, useMemo } from "react"
import { Bell, Check, ShoppingCart, Star, Info, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useNavigate } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

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
  variant?: 'client' | 'admin'
}

export function NotificationTray({ onClose, variant = 'client' }: NotificationTrayProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('ALL')
  const navigate = useNavigate()

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const data: any = variant === 'admin'
        ? await api.getAdminUnreadNotifications()
        : await api.getClientNotifications()

      const notificationsArray = Array.isArray(data) ? data : (data?.notifications || [])
      setNotifications(notificationsArray)
    } catch (error) {
      console.error("Error fetching notifications:", error)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [variant])

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'ALL') return notifications
    return notifications.filter(n => n.category === activeTab)
  }, [notifications, activeTab])

  const unreadCount = notifications.filter(n => !n.isRead).length

  const handleMarkAsRead = async (id: string) => {
    try {
      if (variant === 'admin') {
        await api.markAdminNotificationRead(id)
      } else {
        await api.markClientNotificationRead(id)
      }
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      )
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      if (variant === 'admin') {
        await api.markAllAdminNotificationsRead()
      } else {
        await api.markAllClientNotificationsRead()
      }
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const handleAction = async (notification: Notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id)
    }

    if (notification.link) {
      let finalLink = notification.link;
      if (finalLink.includes('/profile/orders/')) {
        const orderId = finalLink.split('/').pop();
        if (orderId) finalLink = `/pedidos?id=${orderId}`;
      }
      navigate(finalLink)
      if (onClose) onClose()
    }
  }

  const getIcon = (category: string) => {
    switch (category) {
      case 'ORDERS':
      case 'order': return <ShoppingCart className="h-4 w-4" />
      case 'FAVORITES': return <Star className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'URGENT':
      case 'error': return "border-l-red-500 bg-red-500/5 dark:bg-red-500/10"
      case 'NORMAL':
      case 'warning': return "border-l-amber-500 bg-amber-500/5 dark:bg-amber-500/10"
      case 'success': return "border-l-green-500 bg-green-500/5 dark:bg-green-500/10"
      default: return "border-l-slate-200 dark:border-l-slate-800"
    }
  }

  return (
    <div className="flex flex-col h-[500px] sm:h-[600px] w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl overflow-hidden font-display">
      <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {variant === 'admin' ? 'Panel de Control' : 'Notificaciones'}
          </h2>
          {unreadCount > 0 && (
            <span className="bg-primary text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-primary font-bold hover:bg-primary/10 transition-colors"
              onClick={handleMarkAllRead}
            >
              <Check className="h-3 w-3 mr-1" />
              Marcar todo
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="ALL" className="w-full flex-1 flex flex-col" onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start gap-1 border-b border-border/40 pb-px px-6 bg-transparent h-12">
          <TabsTrigger value="ALL" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 h-full">Todo</TabsTrigger>
          {variant === 'client' && (
            <>
              <TabsTrigger value="ORDERS" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 h-full">Pedidos</TabsTrigger>
              <TabsTrigger value="FAVORITES" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 h-full">Favoritos</TabsTrigger>
            </>
          )}
        </TabsList>

        <ScrollArea className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 gap-4">
              <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 animate-pulse uppercase tracking-wider">Cargando...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center gap-6 h-full">
              <div className="size-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center shadow-inner">
                <Bell className="h-10 w-10 text-slate-400 dark:text-slate-500" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-slate-900 dark:text-white">Sin novedades</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-[200px] mx-auto leading-relaxed">
                  Todo está al día por aquí.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "relative flex gap-4 p-5 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer border-l-4",
                    !notification.isRead ? "border-l-primary" : "border-l-transparent",
                    getPriorityClass(notification.priority || (notification as any).type)
                  )}
                  onClick={() => handleAction(notification)}
                >
                  <div className={cn(
                    "size-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-colors",
                    notification.isRead
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                      : "bg-primary/20 text-primary"
                  )}>
                    {getIcon(notification.category || (notification as any).type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <h4 className={cn(
                        "text-sm leading-tight truncate",
                        !notification.isRead
                          ? "font-extrabold text-slate-900 dark:text-white"
                          : "font-bold text-slate-500 dark:text-slate-400"
                      )}>
                        {notification.title}
                      </h4>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 whitespace-nowrap uppercase tracking-tighter">
                        {notification.createdAt ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: es }) : ''}
                      </span>
                    </div>
                    <p className={cn(
                      "text-xs line-clamp-2 leading-relaxed",
                      !notification.isRead
                        ? "text-slate-600 dark:text-slate-300 font-medium"
                        : "text-slate-400 dark:text-slate-500"
                    )}>
                      {notification.message}
                    </p>
                    {notification.link && (
                      <div className="mt-4 flex gap-2">
                        <Button
                          size="sm"
                          className="h-8 text-[11px] font-bold px-4 bg-primary text-slate-900 hover:bg-primary/90 transition-all shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(notification);
                          }}
                        >
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

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-center">
        <Button
          variant="link"
          className="text-xs h-auto p-0 text-slate-500 dark:text-slate-400 hover:text-primary font-extrabold uppercase tracking-widest transition-colors"
          onClick={() => {
            navigate(variant === 'admin' ? '/admin/notifications' : '/notifications')
            if (onClose) onClose()
          }}
        >
          {variant === 'admin' ? 'Ver centro de notificaciones' : 'Ver todo el historial'}
        </Button>
      </div>
    </div>
  )
}
