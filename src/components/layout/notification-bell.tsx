import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import { NotificationTray } from "./notification-tray"

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  const fetchUnreadCount = async () => {
    try {
      const data = await api.getClientUnreadNotifications()
      setUnreadCount(data.length)
    } catch (error) {
      console.error("Error fetching notification count:", error)
    }
  }

  useEffect(() => {
    fetchUnreadCount()
    // Poll for count every minute
    const interval = setInterval(fetchUnreadCount, 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Refetch count when popover closes
  useEffect(() => {
    if (!isOpen) {
      fetchUnreadCount()
    }
  }, [isOpen])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative text-muted-foreground hover:text-primary bg-secondary/50 rounded-lg size-10 transition-all hover:scale-105 active:scale-95"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground font-black animate-in zoom-in duration-300"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Notificaciones</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="p-0 w-[380px] sm:w-[420px] border-none shadow-none bg-transparent">
        <NotificationTray onClose={() => setIsOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}
