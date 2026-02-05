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
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AdminLayout } from "@/components/layout/admin-layout"
import { api } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-muted rounded"></div>)}
          </div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">
              {totalCustomers} usuarios registrados ({activeCustomersCount} activos)
            </p>
          </div>
          
          <Dialog open={isAddingAdmin} onOpenChange={setIsAddingAdmin}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Nuevo Administrador
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Administrador</DialogTitle>
                <DialogDescription>
                  Completa los datos para registrar un nuevo usuario con rol de administrador.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateAdmin} className="space-y-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Nombre</Label>
                  <Input
                    id="name"
                    className="col-span-3"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="username" className="text-right">Usuario</Label>
                  <Input
                    id="username"
                    className="col-span-3"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="opcional"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    className="col-span-3"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">Teléfono</Label>
                  <Input
                    id="phone"
                    className="col-span-3"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    className="col-span-3"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={8}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={newAdminLoading}>
                    {newAdminLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      "Crear Administrador"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Clientes</p>
                  <p className="text-2xl font-bold">{totalCustomers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100">
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Activos</p>
                  <p className="text-2xl font-bold">{activeCustomersCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-red-100">
                  <Users className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Desactivados</p>
                  <p className="text-2xl font-bold">{inactiveCustomersCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar clientes por nombre, email o telefono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Estado:</span>
            <div className="flex bg-muted p-1 rounded-md">
              <Button
                variant={statusFilter === "all" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setStatusFilter("all")}
              >
                Todos
              </Button>
              <Button
                variant={statusFilter === "active" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setStatusFilter("active")}
              >
                Activos
              </Button>
              <Button
                variant={statusFilter === "inactive" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setStatusFilter("inactive")}
              >
                Desactivados
              </Button>
            </div>
          </div>
        </div>

        {/* Customers Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium">Usuario</th>
                    <th className="text-left p-4 font-medium">Contacto</th>
                    <th className="text-left p-4 font-medium">Rol</th>
                    <th className="text-left p-4 font-medium">Estado</th>
                    <th className="text-left p-4 font-medium">Pedidos</th>
                    <th className="text-left p-4 font-medium">Registro</th>
                    <th className="text-right p-4 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{customer.name || "Sin nombre"}</div>
                          {customer.role === 'ADMIN' && (
                            <Shield className="h-3 w-3 text-blue-500" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {customer.username ? `@${customer.username}` : customer.id}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </div>
                          {customer.phone && (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Phone className="h-3 w-3" />
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={customer.role === 'ADMIN' ? 'default' : 'secondary'} className={customer.role === 'ADMIN' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' : ''}>
                          {customer.role}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge variant={customer.isActive ? "outline" : "secondary"} className={customer.isActive ? "border-green-500 text-green-700" : ""}>
                          {customer.isActive ? "Activo" : "Desactivado"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <ShoppingCart className="h-3 w-3" />
                          {customer._count?.sales || 0}
                        </div>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {formatDate(customer.createdAt)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            title={customer.isActive ? "Desactivar" : "Activar"}
                            onClick={() => toggleCustomerStatus(customer.id, customer.isActive)}
                          >
                            {customer.isActive ? (
                              <X className="h-4 w-4 text-red-500" />
                            ) : (
                              <Check className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No se encontraron clientes
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
