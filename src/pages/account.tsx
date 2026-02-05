import { Link } from "react-router-dom"
import { ChevronRight, User, ShoppingBag, LogOut, Package, Heart, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { formatUSD } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"
import * as React from "react"
import { toast } from "@/hooks/use-toast"

interface Order {
  id: string
  saleNumber: string
  createdAt: string
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled"
  totalUSD: number
  items: any[]
}

export function AccountPage() {
  const { user, logout, refreshUser } = useAuth()
  const [orders, setOrders] = React.useState<Order[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = React.useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [editForm, setEditForm] = React.useState({
    name: "",
    phone: "",
    avatarUrl: ""
  })
  
  React.useEffect(() => {
    if (user) {
      loadOrders()
      setEditForm({
        name: user.name || "",
        phone: user.phone || "",
        avatarUrl: user.avatarUrl || ""
      })
    }
  }, [user])

  const loadOrders = async () => {
    try {
      const response = await api.getMyOrders({ limit: 5 })
      setOrders(response.sales || [])
    } catch (error) {
      console.error("Error loading orders:", error)
    } finally {
      setIsLoadingOrders(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsUpdating(true)
      await api.updateProfile(editForm)
      await refreshUser()
      setIsEditDialogOpen(false)
      toast({
        title: "Perfil actualizado",
        description: "Tus datos se han guardado correctamente."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo actualizar el perfil",
        variant: "destructive"
      })
    } finally {
      setIsUpdating(false)
    }
  }

  if (!user) return null

  const menuItems = [
    { path: "/pedidos", label: "Mis Pedidos", icon: ShoppingBag },
    { path: "/favoritos", label: "Mis Favoritos", icon: Heart },
    { path: "/perfil", label: "Mi Información", icon: User },
  ]

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      pending: { label: "Pendiente", class: "bg-yellow-100 text-yellow-800" },
      confirmed: { label: "Confirmado", class: "bg-blue-100 text-blue-800" },
      shipped: { label: "Enviado", class: "bg-purple-100 text-purple-800" },
      delivered: { label: "Entregado", class: "bg-green-100 text-green-800" },
      cancelled: { label: "Cancelado", class: "bg-red-100 text-red-800" },
    }
    return statusMap[status] || { label: status, class: "bg-gray-100 text-gray-800" }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">Inicio</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-foreground">Mi Cuenta</span>
        </nav>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {user.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt={user.name} 
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="h-8 w-8 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
                <button 
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted text-red-600 transition-colors text-left"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Cerrar Sesión</span>
                </button>
              </nav>
            </CardContent>
          </Card>
        </aside>

        <main className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Mis Pedidos Recientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingOrders ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Aún no tienes pedidos</p>
                  <Button asChild>
                    <Link to="/productos">Ver Productos</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const status = getStatusBadge(order.status)
                    return (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Package className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold">{order.saleNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString("es-MX")} • {order.items?.length || 0} productos
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge className={status.class}>{status.label}</Badge>
                          <p className="font-semibold">{formatUSD(order.totalUSD)}</p>
                          <Button variant="outline" size="sm" asChild>
                            <Link to="/pedidos">Ver Detalle</Link>
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {orders.length > 0 && (
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link to="/pedidos">Ver Todos los Pedidos</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información de la Cuenta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nombre</span>
                  <span className="font-medium">{user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Teléfono</span>
                  <span className="font-medium">{user.phone || "No especificado"}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-4"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  Editar Perfil
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Direcciones Guardadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium">Casa</p>
                    <p className="text-sm text-muted-foreground">Av. Principal #123, Col. Centro</p>
                    <p className="text-sm text-muted-foreground">Ciudad de Mexico, CP 12345</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">Agregar Dirección</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
            <DialogDescription>
              Actualiza tu información personal aquí. Haz clic en guardar cuando termines.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-4 mb-4">
              <div className="relative group">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/20">
                  {editForm.avatarUrl ? (
                    <img 
                      src={editForm.avatarUrl} 
                      alt="Avatar" 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-primary" />
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Puedes ingresar una URL de imagen para tu avatar.
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="avatarUrl">URL del Avatar</Label>
              <Input 
                id="avatarUrl" 
                value={editForm.avatarUrl} 
                onChange={(e) => setEditForm({...editForm, avatarUrl: e.target.value})}
                placeholder="https://ejemplo.com/foto.jpg"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input 
                id="name" 
                value={editForm.name} 
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                placeholder="Tu nombre"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input 
                id="phone" 
                value={editForm.phone} 
                onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                placeholder="+58 412 1234567"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
