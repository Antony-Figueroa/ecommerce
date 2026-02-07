import { Link } from "react-router-dom"
import { Package, ShoppingBag, User, Camera, Eye, EyeOff, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
  const { user, refreshUser } = useAuth()
  const [orders, setOrders] = React.useState<Order[]>([])
  const [isLoadingOrders, setIsLoadingOrders] = React.useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [isUpdating, setIsUpdating] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false)
  const [editForm, setEditForm] = React.useState({
    name: "",
    phone: "",
    avatarUrl: "",
    address: "",
    password: "",
    currentPassword: ""
  })
  
  React.useEffect(() => {
    if (user) {
      loadOrders()
      setEditForm({
        name: user.name || "",
        phone: user.phone || "",
        avatarUrl: user.avatarUrl || "",
        address: user.address || "",
        password: "",
        currentPassword: ""
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
      // Solo enviamos la contraseña si se ha modificado
      const updateData = { ...editForm }
      if (!updateData.password) {
        delete (updateData as any).password
      }
      await api.updateProfile(updateData)
      await refreshUser()
      setEditForm(prev => ({ ...prev, password: "", currentPassword: "" }))
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
    <div className="space-y-6">
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
                <div className="flex flex-col gap-1 pt-2">
                  <span className="text-muted-foreground text-sm">Dirección de Entrega</span>
                  <span className="font-medium text-sm">{user.address || "No especificada"}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-4"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  Editar Perfil y Dirección
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2" asChild>
                  <Link to="/pedidos">
                    <Package className="h-4 w-4" />
                    Ver mis pedidos
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => setIsEditDialogOpen(true)}>
                  <Lock className="h-4 w-4" />
                  Cambiar contraseña
                </Button>
              </CardContent>
            </Card>
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
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const icon = document.createElement('div');
                          icon.className = 'flex items-center justify-center w-full h-full';
                          icon.innerHTML = '<svg class=\"h-12 w-12 text-primary\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2\"></path><circle cx=\"12\" cy=\"7\" r=\"4\"></circle></svg>';
                          parent.appendChild(icon);
                        }
                      }}
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

            <div className="grid gap-2">
              <Label htmlFor="address">Dirección de Entrega</Label>
              <Input 
                id="address" 
                value={editForm.address} 
                onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                placeholder="Calle, Edificio, Ciudad, Estado"
              />
            </div>

            <Separator className="my-2" />
            <p className="text-sm font-semibold text-muted-foreground">Seguridad</p>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="currentPassword">Contraseña Actual</Label>
                <span className="text-[10px] text-muted-foreground">Requerida para cambiar contraseña</span>
              </div>
              <div className="relative">
                <Input 
                  id="currentPassword" 
                  type={showCurrentPassword ? "text" : "password"}
                  value={editForm.currentPassword} 
                  onChange={(e) => setEditForm({...editForm, currentPassword: e.target.value})}
                  placeholder="Tu contraseña actual"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Nueva Contraseña</Label>
                <span className="text-[10px] text-muted-foreground">Opcional</span>
              </div>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  value={editForm.password} 
                  onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                  placeholder="Nueva contraseña"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Mínimo 8 caracteres, una mayúscula y un número.
              </p>
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
