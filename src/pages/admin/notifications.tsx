import { useState, useEffect } from "react"
import {
  Bell,
  Check,
  CheckCircle2,
  Filter,
  MoreHorizontal,
  RefreshCcw,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Info,
  ShoppingBag,
  User,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AdminLayout } from "@/components/layout/admin-layout"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  isRead: boolean
  createdAt: string
  link?: string
}

interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export function AdminNotificationsPage() {
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all")
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  })

  useEffect(() => {
    fetchNotifications()
  }, [pagination?.page, filter])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await api.getAdminAllNotifications({
        page: pagination?.page || 1,
        limit: pagination?.limit || 20,
      })
      
      console.log("Notifications API Response:", res)

      // El API puede devolver un array directo o un objeto con { notifications, pagination }
      const fetchedNotifications = Array.isArray(res) ? res : (res.notifications || [])
      
      // Aplicar filtro local si es necesario
      let filtered = [...fetchedNotifications]
      if (filter === 'unread') filtered = filtered.filter((n: any) => !n.isRead)
      if (filter === 'read') filtered = filtered.filter((n: any) => n.isRead)

      setNotifications(filtered)
      
      if (res.pagination) {
        setPagination(res.pagination)
      } else if (Array.isArray(res)) {
        // Si es un array, construir una paginación ficticia o básica
        setPagination({
          total: res.length,
          page: 1,
          limit: res.length,
          totalPages: 1
        })
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las notificaciones",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.markAdminNotificationRead(id)
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      )
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo marcar como leída",
        variant: "destructive",
      })
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await api.markAllAdminNotificationsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      toast({
        title: "Éxito",
        description: "Todas las notificaciones marcadas como leídas",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron marcar todas como leídas",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.deleteAdminNotification(id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      toast({
        title: "Eliminado",
        description: "Notificación eliminada correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la notificación",
        variant: "destructive",
      })
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "order":
        return <ShoppingBag className="h-5 w-5 text-blue-500" />
      case "user":
        return <User className="h-5 w-5 text-purple-500" />
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const filteredNotifications = notifications.filter(
    n =>
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.message.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <AdminLayout title="Historial de Notificaciones">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col md:flex-row items-center gap-4 flex-1">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar notificaciones..."
                className="pl-10 h-11 bg-white/50 dark:bg-muted/10 border-slate-200/50 dark:border-border/50"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto scrollbar-hide pb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-muted-foreground whitespace-nowrap">Estado:</span>
              <div className="flex bg-slate-100/50 dark:bg-muted/20 p-1 rounded-xl border border-slate-200/50 dark:border-border/50 shadow-sm h-11 items-center px-1.5 shrink-0">
                <button
                  onClick={() => setFilter("all")}
                  className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-all duration-300 rounded-lg whitespace-nowrap group ${
                    filter === "all" 
                      ? "bg-white dark:bg-card text-primary shadow-md scale-[1.02]" 
                      : "text-muted-foreground hover:text-primary hover:bg-white/50 dark:hover:bg-muted/50"
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFilter("unread")}
                  className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-all duration-300 rounded-lg whitespace-nowrap group ${
                    filter === "unread" 
                      ? "bg-white dark:bg-card text-primary shadow-md scale-[1.02]" 
                      : "text-muted-foreground hover:text-primary hover:bg-white/50 dark:hover:bg-muted/50"
                  }`}
                >
                  No leídas
                </button>
                <button
                  onClick={() => setFilter("read")}
                  className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-all duration-300 rounded-lg whitespace-nowrap group ${
                    filter === "read" 
                      ? "bg-white dark:bg-card text-primary shadow-md scale-[1.02]" 
                      : "text-muted-foreground hover:text-primary hover:bg-white/50 dark:hover:bg-muted/50"
                  }`}
                >
                  Leídas
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 md:flex-none h-11 rounded-xl border-slate-200/50 dark:border-border/50 bg-white/50 dark:bg-muted/10 font-bold text-xs uppercase tracking-wider"
              onClick={handleMarkAllRead}
              disabled={!notifications.some(n => !n.isRead)}
            >
              <Check className="mr-2 h-4 w-4" />
              Marcar todas como leídas
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11 rounded-xl border-slate-200/50 dark:border-border/50 bg-white/50 dark:bg-muted/10"
              onClick={fetchNotifications}
              disabled={loading}
            >
              <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">
                Historial Completo
              </CardTitle>
              <Badge variant="secondary">
                {pagination.total} total
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {loading ? (
                <div className="flex h-40 items-center justify-center">
                  <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center text-center">
                  <Bell className="mb-2 h-8 w-8 text-muted-foreground opacity-20" />
                  <p className="text-muted-foreground">No se encontraron notificaciones</p>
                </div>
              ) : (
                filteredNotifications.map(notification => (
                  <div
                    key={notification.id}
                    className={cn(
                      "group flex items-start gap-4 rounded-lg p-4 transition-colors border-b last:border-0",
                      notification.isRead
                        ? "bg-transparent opacity-80"
                        : "bg-primary/5 hover:bg-primary/10"
                    )}
                  >
                    <div className="mt-1 shrink-0">
                      {getIcon(notification.type || 'info')}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className={cn(
                          "text-sm font-semibold leading-none",
                          !notification.isRead && "text-primary"
                        )}>
                          {notification.title}
                        </p>
                        <span className="text-xs font-medium text-muted-foreground bg-secondary/30 px-2 py-1 rounded">
                          {format(new Date(notification.createdAt), "PPPp", { locale: es })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <Check className="h-4 w-4" />
                          <span className="sr-only">Marcar como leída</span>
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDelete(notification.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </div>

            {pagination?.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: (prev?.page || 1) - 1 }))}
                  disabled={(pagination?.page || 1) === 1 || loading}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Anterior
                </Button>
                <div className="text-sm font-medium">
                  Página {pagination?.page || 1} de {pagination?.totalPages || 1}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: (prev?.page || 1) + 1 }))}
                  disabled={(pagination?.page || 1) === (pagination?.totalPages || 1) || loading}
                >
                  Siguiente
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
