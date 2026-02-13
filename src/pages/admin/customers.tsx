import { useState, useEffect, useMemo } from "react"
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
  MoreVertical,
  UserCog,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import { AdminPageHeader } from "@/components/admin/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
  const [isAddingAdmin, setIsAddingAdmin] = useState(false)
  const [newAdminLoading, setNewAdminLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const { toast } = useToast()

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
    onConfirm: () => {},
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
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm) ||
        customer.username?.toLowerCase().includes(searchTerm.toLowerCase())
      )
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
  }, [customers, searchTerm])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Cargando usuarios...</p>
      </div>
    )
  }

  const UserTable = ({ users, title, description, showEmptyState = true }: { users: Customer[], title?: string, description?: string, showEmptyState?: boolean }) => (
    <Card className="border-none shadow-none bg-transparent">
      {(title || description) && (
        <CardHeader className="px-0 pt-0 pb-4">
          {title && <CardTitle className="text-lg font-bold flex items-center gap-2">
            {title === "Usuarios Inactivos" ? <AlertCircle className="h-5 w-5 text-destructive" /> : <Users className="h-5 w-5 text-primary" />}
            {title}
            <Badge variant="secondary" className="ml-2">{users.length}</Badge>
          </CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Usuario</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Contacto</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Rol</th>
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-center font-semibold text-muted-foreground">Pedidos</th>
                <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((customer) => (
                <tr key={customer.id} className={cn(
                  "hover:bg-muted/30 transition-colors group",
                  !customer.isActive && "opacity-75 grayscale-[0.5]"
                )}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center font-bold shadow-sm transition-transform group-hover:scale-105",
                        customer.role === 'ADMIN' ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-primary/10 text-primary"
                      )}>
                        {customer.name?.charAt(0) || customer.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground leading-none mb-1">
                          {customer.name || 'Sin nombre'}
                          {customer.role === 'ADMIN' && <Shield className="h-3 w-3 inline ml-1 text-amber-500" />}
                        </span>
                        <span className="text-xs text-muted-foreground">@{customer.username || 'usuario'}</span>
                        <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1 mt-1">
                          <Clock className="h-2.5 w-2.5" /> {formatDate(customer.createdAt)}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                        <Mail className="h-3.5 w-3.5" />
                        <span className="text-xs truncate max-w-[150px]">{customer.email}</span>
                      </div>
                      {customer.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                          <Phone className="h-3.5 w-3.5" />
                          <span className="text-xs">{customer.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Badge 
                      variant={customer.role === 'ADMIN' ? 'default' : 'secondary'}
                      className={cn(
                        "font-medium",
                        customer.role === 'ADMIN' && "bg-amber-500 hover:bg-amber-600 text-white border-none shadow-sm"
                      )}
                    >
                      {customer.role === 'ADMIN' ? 'Administrador' : 'Cliente'}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "font-semibold",
                        customer.isActive 
                          ? "border-green-500/50 text-green-600 bg-green-50/50 dark:bg-green-500/10 dark:text-green-400" 
                          : "border-destructive/50 text-destructive bg-destructive/50 dark:bg-destructive/10 dark:text-destructive-foreground"
                      )}
                    >
                      <span className={cn("h-1.5 w-1.5 rounded-full mr-1.5", customer.isActive ? "bg-green-500" : "bg-destructive")} />
                      {customer.isActive ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col items-center justify-center">
                      <div className="flex items-center gap-1.5 font-bold text-foreground">
                        <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
                        {customer._count?.sales || 0}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" disabled={updatingId === customer.id}>
                            {updatingId === customer.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Gestión</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {customer.isActive && customer._count?.sales > 0 ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="w-full">
                                    <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed">
                                      <X className="h-4 w-4 mr-2 text-destructive" /> 
                                      <span className="text-destructive">Desactivar Cuenta</span>
                                    </DropdownMenuItem>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="bg-destructive text-destructive-foreground border-none">
                                  <p className="text-xs font-bold flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    No se puede desactivar: tiene pedidos asociados
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <DropdownMenuItem onClick={() => toggleCustomerStatus(customer.id, customer.isActive)}>
                              {customer.isActive ? (
                                <>
                                  <X className="h-4 w-4 mr-2 text-destructive" /> 
                                  <span className="text-destructive">Desactivar Cuenta</span>
                                </>
                              ) : (
                                <>
                                  <Check className="h-4 w-4 mr-2 text-green-500" />
                                  <span className="text-green-500">Activar Cuenta</span>
                                </>
                              )}
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Cambiar Rol</DropdownMenuLabel>
                          {customer.role === 'ADMIN' ? (
                            <DropdownMenuItem onClick={() => changeUserRole(customer.id, 'CUSTOMER')}>
                              <Users className="h-4 w-4 mr-2" /> Cambiar a Cliente
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => changeUserRole(customer.id, 'ADMIN')}>
                              <ShieldCheck className="h-4 w-4 mr-2 text-amber-500" /> Cambiar a Admin
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-muted-foreground">
                            <UserCog className="h-4 w-4 mr-2" /> Editar Perfil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && showEmptyState && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-10 w-10 text-muted-foreground/30" />
                      <p className="text-muted-foreground font-medium">No se encontraron usuarios en esta lista.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  )

  return (
    <div className="space-y-8 pb-10">
      <AdminPageHeader 
        title="Gestión de Usuarios"
        subtitle="Administra los usuarios, niveles de acceso y estados de la plataforma"
        icon={Users}
        action={{
          label: "Nuevo Administrador",
          onClick: () => setIsAddingAdmin(true),
          icon: UserPlus
        }}
      />

      {/* Stats Summary - Pro Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Clientes", value: filteredData.clients.length, icon: Users, color: "blue" },
          { label: "Administradores", value: filteredData.admins.length, icon: Shield, color: "amber" },
          { label: "Usuarios Activos", value: filteredData.active.length, icon: Check, color: "green" },
          { label: "En Espera / Inactivos", value: filteredData.inactive.length, icon: ShieldAlert, color: "red" },
        ].map((stat, i) => (
          <Card key={i} className="overflow-hidden border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6 relative">
              <div className={cn(
                "absolute -right-2 -bottom-2 h-20 w-20 opacity-5",
                stat.color === "blue" && "text-blue-500",
                stat.color === "amber" && "text-amber-500",
                stat.color === "green" && "text-green-500",
                stat.color === "red" && "text-red-500"
              )}>
                <stat.icon className="h-full w-full" />
              </div>
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center shadow-inner",
                  stat.color === "blue" && "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
                  stat.color === "amber" && "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
                  stat.color === "green" && "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
                  stat.color === "red" && "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                )}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{stat.label}</p>
                  <h3 className="text-3xl font-black tracking-tight">{stat.value}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        {/* Advanced Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Busca por nombre, email, @usuario o teléfono..."
              className="pl-10 h-11 bg-card/50 border-muted-foreground/20 rounded-xl focus:ring-primary transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <div className="flex items-center justify-between mb-4 bg-muted/20 p-1 rounded-xl w-fit">
            <TabsList className="bg-transparent h-10 gap-1">
              <TabsTrigger value="all" className="rounded-lg px-4 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">Todos</TabsTrigger>
              <TabsTrigger value="clients" className="rounded-lg px-4 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">Clientes</TabsTrigger>
              <TabsTrigger value="admins" className="rounded-lg px-4 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">Admins</TabsTrigger>
              <TabsTrigger value="active" className="rounded-lg px-4 font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">Activos</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-0 animate-in fade-in-50 duration-300">
            <div className="space-y-10">
              <UserTable 
                users={filteredData.active} 
                title="Usuarios Activos" 
                description="Lista principal de usuarios con acceso vigente a la plataforma."
              />
              
              {filteredData.inactive.length > 0 && (
                <UserTable 
                  users={filteredData.inactive} 
                  title="Usuarios Inactivos" 
                  description="Cuentas desactivadas o suspendidas temporalmente."
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="clients" className="mt-0 animate-in fade-in-50 duration-300">
             <UserTable users={filteredData.clients.filter(u => u.isActive)} title="Clientes Activos" />
             {filteredData.clients.filter(u => !u.isActive).length > 0 && (
                <div className="mt-10">
                  <UserTable users={filteredData.clients.filter(u => !u.isActive)} title="Clientes Inactivos" />
                </div>
             )}
          </TabsContent>

          <TabsContent value="admins" className="mt-0 animate-in fade-in-50 duration-300">
            <UserTable users={filteredData.admins} title="Equipo de Administración" />
          </TabsContent>

          <TabsContent value="active" className="mt-0 animate-in fade-in-50 duration-300">
            <UserTable users={filteredData.active} title="Todos los Usuarios Activos" />
          </TabsContent>
        </Tabs>
      </div>

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
            <Button variant="outline" onClick={handleCloseModal} className="rounded-xl font-bold">
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateAdmin} 
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
    <Dialog open={confirmConfig.open} onOpenChange={(open) => setConfirmConfig(prev => ({ ...prev, open }))}>
      <DialogContent className="sm:max-w-[400px] rounded-3xl p-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div className={cn(
            "h-16 w-16 rounded-full flex items-center justify-center animate-in zoom-in-50 duration-300",
            confirmConfig.variant === "destructive" 
              ? "bg-destructive/10 text-destructive" 
              : "bg-primary/10 text-primary"
          )}>
            {confirmConfig.variant === "destructive" ? (
              <AlertTriangle className="h-8 w-8" />
            ) : (
              <CheckCircle2 className="h-8 w-8" />
            )}
          </div>
          
          <div className="space-y-2">
            <DialogTitle className="text-xl font-black">{confirmConfig.title}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground font-medium px-2">
              {confirmConfig.description}
            </DialogDescription>
          </div>

          <div className="flex w-full gap-3 mt-4">
            <Button 
              variant="outline" 
              className="flex-1 rounded-xl font-bold h-11"
              onClick={() => setConfirmConfig(prev => ({ ...prev, open: false }))}
            >
              Cancelar
            </Button>
            <Button 
              variant={confirmConfig.variant || "default"}
              className={cn(
                "flex-1 rounded-xl font-bold h-11 shadow-sm",
                confirmConfig.variant !== "destructive" && "bg-primary hover:bg-primary/90"
              )}
              onClick={() => {
                confirmConfig.onConfirm()
                setConfirmConfig(prev => ({ ...prev, open: false }))
              }}
            >
              {confirmConfig.confirmText || "Confirmar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
)
}
