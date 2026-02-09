import { useState, useEffect } from "react"
import {
  Search,
  Users,
  Mail,
  Phone,
  ShoppingCart,
  X,
  Check,
  UserPlus,
  Shield,
  Loader2,
} from "lucide-react"
import { AdminPageHeader } from "@/components/admin/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
 
import { api } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface Customer {
  id: string
  name: string
  email: string
  phone: string | null
  username?: string | null
  role: string
  isActive: boolean
  createdAt: string
  _count: {
    sales: number
  }
  // These might come from a separate report or joined in the future
  totalSpent?: number
  lastOrderAt?: string | null
}

export function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddingAdmin, setIsAddingAdmin] = useState(false)
  const [newAdminLoading, setNewAdminLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    username: "",
    phone: "",
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    document.title = "Clientes | Ana's Supplements Admin"
  }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const data = await api.getCustomers()
      setCustomers(data.customers || [])
    } catch (error) {
      console.error("Error fetching customers:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setNewAdminLoading(true)
      await api.createAdmin(formData)
      toast({
        title: "Éxito",
        description: "Administrador creado correctamente",
      })
      setIsAddingAdmin(false)
      setFormData({
        name: "",
        email: "",
        password: "",
        username: "",
        phone: "",
      })
      fetchCustomers()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al crear administrador",
        variant: "destructive",
      })
    } finally {
      setNewAdminLoading(false)
    }
  }

  const toggleCustomerStatus = async (customerId: string, currentStatus: boolean) => {
    try {
      await api.updateCustomer(customerId, { isActive: !currentStatus })
      fetchCustomers()
      toast({
        title: "Estado actualizado",
        description: `Usuario ${!currentStatus ? 'activado' : 'desactivado'} correctamente`,
      })
    } catch (error) {
      console.error("Error toggling customer status:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del usuario",
        variant: "destructive",
      })
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = 
      (customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       customer.phone?.includes(searchTerm) ||
       customer.username?.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "active" && customer.isActive) ||
      (statusFilter === "inactive" && !customer.isActive)

    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const totalCustomers = customers.length
  const activeCustomersCount = customers.filter(c => c.isActive).length
  const inactiveCustomersCount = customers.filter(c => !c.isActive).length
  console.log({ totalCustomers, activeCustomersCount, inactiveCustomersCount })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">Cargando usuarios...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        <AdminPageHeader 
          title="Gestión de Usuarios"
          subtitle="Administra los usuarios y niveles de acceso de la plataforma"
          icon={Users}
          action={{
            label: "Nuevo Administrador",
            onClick: () => setIsAddingAdmin(true),
            icon: UserPlus
          }}
        />

        <Dialog open={isAddingAdmin} onOpenChange={setIsAddingAdmin}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Administrador</DialogTitle>
              <DialogDescription>
                Los administradores tienen acceso total al panel de control.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateAdmin} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input 
                  id="name" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Ana Pérez" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Nombre de Usuario</Label>
                <Input 
                  id="username" 
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="ej: ana_admin" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input 
                  id="email" 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="admin@vitality.com" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input 
                  id="phone" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0412..." 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input 
                  id="password" 
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••" 
                  required 
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddingAdmin(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={newAdminLoading}>
                  {newAdminLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear Admin
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/10 dark:to-background">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Total Clientes</p>
                  <h3 className="text-2xl font-bold">{customers.filter(c => c.role === 'USER').length}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/10 dark:to-background">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Administradores</p>
                  <h3 className="text-2xl font-bold">{customers.filter(c => c.role === 'ADMIN').length}</h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-900/10 dark:to-background">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                  <Check className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Usuarios Activos</p>
                  <h3 className="text-2xl font-bold">{customers.filter(c => c.isActive).length}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o teléfono..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto scrollbar-hide">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
                size="sm"
              >
                Todos
              </Button>
              <Button
                variant={statusFilter === "customer" ? "default" : "outline"}
                onClick={() => setStatusFilter("customer")}
                size="sm"
              >
                Clientes
              </Button>
              <Button
                variant={statusFilter === "admin" ? "default" : "outline"}
                onClick={() => setStatusFilter("admin")}
                size="sm"
              >
                Admins
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Usuario</th>
                  <th className="px-4 py-3 text-left font-medium">Contacto</th>
                  <th className="px-4 py-3 text-left font-medium">Rol</th>
                  <th className="px-4 py-3 text-left font-medium">Estado</th>
                  <th className="px-4 py-3 text-left font-medium">Pedidos</th>
                  <th className="px-4 py-3 text-right font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {customer.name?.charAt(0) || customer.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold">{customer.name || 'Sin nombre'}</p>
                          <p className="text-xs text-muted-foreground">@{customer.username || 'usuario'}</p>
                          <p className="text-[10px] text-muted-foreground/60">{formatDate(customer.createdAt)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="text-xs">{customer.email}</span>
                        </div>
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span className="text-xs">{customer.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={customer.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {customer.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={customer.isActive ? 'outline' : 'secondary'} className={customer.isActive ? "border-green-500 text-green-700 dark:border-green-400 dark:text-green-400" : ""}>
                        {customer.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground mb-1" />
                        <span className="font-bold">{customer._count?.sales || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleCustomerStatus(customer.id, customer.isActive)}
                      >
                        {customer.isActive ? (
                          <X className="h-4 w-4 text-red-500" />
                        ) : (
                          <Check className="h-4 w-4 text-green-500" />
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No se encontraron usuarios que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
  )
}
