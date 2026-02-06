import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"

export function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const data = await api.getClientUnreadNotifications()
      setNotifications(data)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Refresh every 5 minutes for clients
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markClientNotificationRead(id)
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await api.markAllClientNotificationsRead()
      setNotifications([])
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) return `Hace ${diffMins} min`
    if (diffHours < 24) return `Hace ${diffHours} h`
    return `Hace ${diffDays} d`
  }

  const unreadCount = notifications.length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative text-muted-foreground hover:text-primary bg-secondary/50 rounded-lg size-10"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground font-black"
            >
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notificaciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notificaciones
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-auto px-2 py-1 text-xs text-primary font-bold"
              onClick={handleMarkAllRead}
            >
              Marcar todas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">Cargando...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No tienes notificaciones nuevas
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem 
                key={notification.id} 
                className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                onClick={() => handleMarkAsRead(notification.id)}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm font-bold text-foreground">
                    {notification.title}
                  </span>
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {notification.message}
                </p>
                <span className="text-[10px] text-muted-foreground/60">
                  {formatTime(notification.createdAt)}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
