import { useState, useEffect, useMemo } from "react"
import {
  Search,
  Users,
  X,
  Check,
  UserPlus,
  Shield,
  Loader2,
  MoreVertical,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Download,
} from "lucide-react"
import { AdminPageHeader } from "@/components/admin/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/auth-context"
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
import { cn } from "@/lib/utils"

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
  totalSpent?: number
  lastOrderAt?: string | null
}

export function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "email" | "createdAt">("createdAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [isAddingAdmin, setIsAddingAdmin] = useState(false)
  const [newAdminLoading, setNewAdminLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const { toast } = useToast()
  const { refreshUser, user: currentUser } = useAuth()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    username: "",
    phone: "",
  })

  const [confirmConfig, setConfirmConfig] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: "default" | "destructive";
    confirmText?: string;
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => { },
  })

  const confirmAction = (config: Omit<typeof confirmConfig, "open">) => {
    setConfirmConfig({ ...config, open: true })
  }

  const hasChanges = () => {
    return formData.name !== "" ||
      formData.email !== "" ||
      formData.password !== "" ||
      formData.username !== "" ||
      formData.phone !== ""
  }

  const handleCloseModal = () => {
    if (hasChanges()) {
      confirmAction({
        title: "¿Salir sin guardar?",
        description: "Tienes cambios sin guardar en el formulario. ¿Estás seguro de que deseas salir?",
        confirmText: "Salir",
        variant: "destructive",
        onConfirm: () => {
          setIsAddingAdmin(false)
          setFormData({
            name: "",
            email: "",
            password: "",
            username: "",
            phone: "",
          })
        }
      })
    } else {
      setIsAddingAdmin(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    document.title = "Gestión de Usuarios | Ana's Supplements Admin"
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

  const exportCustomersToCSV = () => {
    const headers = ["ID", "Nombre", "Email", "Teléfono", "Rol", "Activo", "Fecha Registro"]
    const rows = filteredData.all.map((customer: any) => [
      customer.id.slice(0, 8),
      customer.name || "Sin nombre",
      customer.email || "",
      customer.phone || "",
      customer.role || "customer",
      customer.isActive ? "Sí" : "No",
      new Date(customer.createdAt).toLocaleDateString("es-VE")
    ])

    const csvContent = [headers, ...rows.map((row: any) => row.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `clientes_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)

    toast({ title: "Exportación Exitosa", description: "Los clientes se han exportado correctamente." })
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()

    confirmAction({
      title: "¿Crear nuevo administrador?",
      description: `¿Estás seguro de que deseas otorgar permisos de administrador a ${formData.name || formData.email}?`,
      confirmText: "Crear Administrador",
      onConfirm: async () => {
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
    })
  }

  const toggleCustomerStatus = async (customerId: string, currentStatus: boolean) => {
    const customer = customers.find(c => c.id === customerId)
    if (!customer) return

    confirmAction({
      title: currentStatus ? "¿Desactivar cuenta?" : "¿Activar cuenta?",
      description: currentStatus
        ? `¿Estás seguro de que deseas desactivar la cuenta de ${customer.name || customer.email}? El usuario no podrá iniciar sesión.`
        : `¿Deseas activar la cuenta de ${customer.name || customer.email}?`,
      confirmText: currentStatus ? "Desactivar" : "Activar",
      variant: currentStatus ? "destructive" : "default",
      onConfirm: async () => {
        try {
          setUpdatingId(customerId)
          await api.updateCustomer(customerId, { isActive: !currentStatus })
          setCustomers(prev =>
            prev.map(c => c.id === customerId ? { ...c, isActive: !currentStatus } : c)
          )
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
        } finally {
          setUpdatingId(null)
        }
      }
    })
  }

  const changeUserRole = async (customerId: string, newRole: string) => {
    const customer = customers.find(c => c.id === customerId)
    if (!customer) return

    confirmAction({
      title: "¿Cambiar rol de usuario?",
      description: `¿Estás seguro de que deseas cambiar el rol de ${customer.name || customer.email} a ${newRole === 'ADMIN' ? 'Administrador' : 'Cliente'}?`,
      confirmText: "Cambiar Rol",
      onConfirm: async () => {
        try {
          setUpdatingId(customerId)
          // Assuming api.updateCustomer supports role update or there's a specific endpoint
          await api.updateCustomer(customerId, { role: newRole } as any)
          setCustomers(prev =>
            prev.map(c => c.id === customerId ? { ...c, role: newRole } : c)
          )
          toast({
            title: "Rol actualizado",
            description: `El usuario ahora es ${newRole === 'ADMIN' ? 'Administrador' : 'Cliente'}`,
          })

          // Si el usuario actualizado es el usuario actual, refrescar su sesión
          if (currentUser && customerId === currentUser.id) {
            await refreshUser()
          }
        } catch (error) {
          toast({
            title: "Error",
            description: "No se pudo actualizar el rol",
            variant: "destructive",
          })
        } finally {
          setUpdatingId(null)
        }
      }
    })
  }

  const filteredData = useMemo(() => {
    const searched = customers.filter((customer) => {
      return (
        customer.username?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }).filter(customer => {
      const roleMatch = roleFilter === "all" || customer.role === roleFilter
      const statusMatch = statusFilter === "all" || (statusFilter === "active" ? customer.isActive : !customer.isActive)
      return roleMatch && statusMatch
    }).sort((a, b) => {
      let comparison = 0
      if (sortBy === "name") comparison = (a.name || "").localeCompare(b.name || "")
      else if (sortBy === "email") comparison = (a.email || "").localeCompare(b.email || "")
      else if (sortBy === "createdAt") comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
      return sortOrder === "asc" ? comparison : -comparison
    })

    const active = searched.filter(c => c.isActive)
    const inactive = searched.filter(c => !c.isActive)
    const admins = searched.filter(c => c.role === 'ADMIN')
    const clients = searched.filter(c => c.role === 'CUSTOMER')

    return {
      all: searched,
      active,
      inactive,
      admins,
      clients
    }
  }, [customers, searchTerm, sortBy, sortOrder])


  if (loading) {
    return (
      <div className="animate-pulse space-y-4 p-8">
        <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-xl w-1/4"></div>
        <div className="h-96 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-border"></div>
      </div>
    )
  }

  const UserTable = ({ users, showEmptyState = true }: { users: Customer[], showEmptyState?: boolean }) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left bg-white dark:bg-card">
        <thead className="bg-[#FBFCFD] dark:bg-slate-800 border-y border-slate-100 dark:border-border/60">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Usuario</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Contacto</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Rol</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Ventas</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Estado</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Acción</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-border/40">
          {users.map((customer) => (
            <tr key={customer.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs shadow-sm",
                    customer.role === 'ADMIN' ? "bg-amber-50 text-amber-600" : "bg-primary/10 text-primary"
                  )}>
                    {customer.name?.charAt(0) || customer.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {customer.name || 'Sin nombre'}
                      {customer.role === 'ADMIN' && <Shield className="h-3 w-3 text-amber-500" />}
                    </div>
                    <div className="text-xs text-slate-400">@{customer.username || 'usuario'}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col">
                  <span className="text-sm text-slate-600 dark:text-slate-300">{customer.email}</span>
                  <span className="text-[10px] text-slate-400">{customer.phone || 'No phone'}</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant="outline" className={cn(
                  "text-[10px] uppercase font-black px-2 py-0 border",
                  customer.role === 'ADMIN' ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-primary/10 text-primary border-primary/20"
                )}>
                  {customer.role}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-bold text-slate-900 dark:text-white">
                {customer._count?.sales || 0}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                  customer.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                )}>
                  <span className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    customer.isActive ? "bg-emerald-600" : "bg-rose-600"
                  )} />
                  {customer.isActive ? 'Activo' : 'Inactivo'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full" disabled={updatingId === customer.id}>
                      {updatingId === customer.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-slate-100">
                    <DropdownMenuLabel className="text-[10px] uppercase font-black text-slate-400 font-bold tracking-widest">Acciones</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => toggleCustomerStatus(customer.id, customer.isActive)} className={customer.isActive ? "text-rose-600" : "text-emerald-600"}>
                      {customer.isActive ? (
                        <><X className="h-4 w-4 mr-2" /> Desactivar Cuenta</>
                      ) : (
                        <><Check className="h-4 w-4 mr-2" /> Activar Cuenta</>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-[10px] uppercase font-black text-slate-400 font-bold tracking-widest">Seguridad</DropdownMenuLabel>
                    {customer.role === 'ADMIN' ? (
                      <DropdownMenuItem onClick={() => changeUserRole(customer.id, 'CUSTOMER')}>
                        <Users className="h-4 w-4 mr-2" /> Hacer Cliente
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => changeUserRole(customer.id, 'ADMIN')}>
                        <ShieldCheck className="h-4 w-4 mr-2 text-amber-500" /> Hacer Admin
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && showEmptyState && (
        <div className="p-12 text-center text-slate-400">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">No se encontraron usuarios</p>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <AdminPageHeader
        title="Clientes y Usuarios"
        subtitle="Gestiona tu base de usuarios y permisos de acceso."
        icon={Users}
        action={{
          label: "Añadir Admin",
          onClick: () => setIsAddingAdmin(true),
          icon: UserPlus
        }}
        rightContent={
          <Button
            variant="outline"
            onClick={exportCustomersToCSV}
            className="h-10 px-4 rounded-xl border-slate-200 text-slate-600 font-semibold gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        }
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Clientes Totales", value: filteredData.clients.length, icon: Users, color: "blue" },
          { label: "Administradores", value: filteredData.admins.length, icon: Shield, color: "amber" },
          { label: "Usuarios Activos", value: filteredData.active.length, icon: Check, color: "emerald" },
          { label: "Inactivos", value: filteredData.inactive.length, icon: ShieldAlert, color: "rose" },
        ].map((stat, i) => (
          <Card key={i} className="rounded-2xl border border-slate-100 shadow-sm bg-white dark:bg-card dark:border-border overflow-hidden">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</h3>
              </div>
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center",
                stat.color === "blue" ? "bg-primary/10 text-primary" :
                  stat.color === "amber" ? "bg-amber-50 text-amber-600" :
                    stat.color === "emerald" ? "bg-emerald-50 text-emerald-600" :
                      "bg-rose-50 text-rose-600"
              )}>
                <stat.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-2xl border border-slate-100 shadow-sm bg-white dark:bg-card dark:border-border overflow-hidden">
        {/* Top actions */}
        <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 dark:border-border/60">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 w-full sm:w-64 bg-slate-50 border border-slate-200 focus-visible:ring-primary/20 rounded-xl text-sm transition-all dark:bg-background dark:border-border"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-10 w-32 bg-slate-50 border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los Roles</SelectItem>
                <SelectItem value="ADMIN">Administradores</SelectItem>
                <SelectItem value="CUSTOMER">Clientes</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-32 bg-slate-50 border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => { setSortBy(v as any); setSortOrder(sortOrder === "asc" ? "desc" : "asc") }}>
              <SelectTrigger className="h-10 w-40 bg-slate-50 border-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Fecha Registro</SelectItem>
                <SelectItem value="name">Nombre</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <div className="px-5 border-b border-slate-100 dark:border-border/60">
            <TabsList className="h-12 bg-transparent gap-6 p-0">
              <TabsTrigger value="all" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold text-xs uppercase tracking-widest text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">Todos</TabsTrigger>
              <TabsTrigger value="clients" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold text-xs uppercase tracking-widest text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">Clientes</TabsTrigger>
              <TabsTrigger value="admins" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold text-xs uppercase tracking-widest text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">Admins</TabsTrigger>
              <TabsTrigger value="active" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 font-bold text-xs uppercase tracking-widest text-slate-400 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white">Activos</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="m-0">
            <UserTable users={filteredData.all} />
          </TabsContent>
          <TabsContent value="clients" className="m-0">
            <UserTable users={filteredData.clients} />
          </TabsContent>
          <TabsContent value="admins" className="m-0">
            <UserTable users={filteredData.admins} />
          </TabsContent>
          <TabsContent value="active" className="m-0">
            <UserTable users={filteredData.active} />
          </TabsContent>
        </Tabs>
      </Card>

      {/* Create Admin Dialog */}
      <Dialog open={isAddingAdmin} onOpenChange={(open) => {
        if (!open) handleCloseModal()
        else setIsAddingAdmin(true)
      }}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Nuevo Administrador
            </DialogTitle>
            <DialogDescription>
              Asigna permisos totales de administración a un nuevo miembro del equipo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAdmin} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre</Label>
                <Input
                  id="name"
                  className="rounded-xl bg-muted/30"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ana Pérez"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Usuario</Label>
                <Input
                  id="username"
                  className="rounded-xl bg-muted/30"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="ana_admin"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                className="rounded-xl bg-muted/30"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@vitality.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Teléfono (Opcional)</Label>
              <Input
                id="phone"
                className="rounded-xl bg-muted/30"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0412..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contraseña Temporal</Label>
              <Input
                id="password"
                type="password"
                className="rounded-xl bg-muted/30"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
                required
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseModal} className="rounded-xl font-bold">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={newAdminLoading}
                className="rounded-xl font-bold bg-primary hover:bg-primary/90"
              >
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

      {/* Confirmation Dialog */}
      <Dialog open={confirmConfig.open} onOpenChange={(val) => setConfirmConfig({ ...confirmConfig, open: val })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmConfig.variant === "destructive" ? (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              )}
              {confirmConfig.title}
            </DialogTitle>
            <DialogDescription className="pt-2 text-base">
              {confirmConfig.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmConfig({ ...confirmConfig, open: false })}
            >
              Cancelar
            </Button>
            <Button
              variant={confirmConfig.variant || "default"}
              onClick={() => {
                confirmConfig.onConfirm();
                setConfirmConfig({ ...confirmConfig, open: false });
              }}
            >
              {confirmConfig.confirmText || "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
