import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import {
  ShoppingCart,
  DollarSign,
  Users,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import { AdminLayout } from "@/components/layout/admin-layout"
import { api } from "@/lib/api"
import { formatUSD } from "@/lib/utils"

interface Order {
  id: string
  orderNumber: string
  customerName: string
  total: number
  status: string
  isPaid: boolean
  whatsappSent: boolean
  createdAt: string
}

interface Stats {
  totalOrders: number
  pendingOrders: number
  confirmedOrders: number
  totalRevenue: number
  revenueGrowth: number
  totalCustomers: number
  customerGrowth: number
  totalProducts: number
  lowStockProducts: number
}

interface RecentActivity {
  id: string
  type: string
  message: string
  time: string
}

export function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    pendingOrders: 0,
    confirmedOrders: 0,
    totalRevenue: 0,
    revenueGrowth: 0,
    totalCustomers: 0,
    customerGrowth: 0,
    totalProducts: 0,
    lowStockProducts: 0,
  })
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [bcvRate, setBcvRate] = useState<number | null>(null)
  const [lastBcvUpdate, setLastBcvUpdate] = useState<Date | null>(null)
  const [updatingBcv, setUpdatingBcv] = useState(false)

  useEffect(() => {
    fetchDashboardData()
    fetchBCVRate()
  }, [])

  const fetchBCVRate = async () => {
    try {
      const status = await api.getBCVStatus()
      if (status && typeof status.currentRate === 'number') {
        setBcvRate(status.currentRate)
        if (status.history && status.history.length > 0) {
          setLastBcvUpdate(new Date(status.history[0].createdAt))
        }
      }
    } catch (error) {
      console.error("Error fetching BCV rate:", error)
    }
  }

  const handleUpdateBcv = async () => {
    setUpdatingBcv(true)
    try {
      const result = await api.forceBCVUpdate()
      setBcvRate(result.rate)
      setLastBcvUpdate(new Date())
    } catch (error) {
      console.error("Error updating BCV rate:", error)
    } finally {
      setUpdatingBcv(false)
    }
  }

  const fetchDashboardData = async () => {
    try {
      const [statsData] = await Promise.all([
        api.getStats(),
      ])

      setStats({
        totalOrders: statsData.totalOrders || 0,
        pendingOrders: statsData.pendingOrders || 0,
        confirmedOrders: statsData.confirmedOrders || 0,
        totalRevenue: statsData.totalRevenue || 0,
        revenueGrowth: statsData.revenueGrowth || 0,
        totalCustomers: statsData.totalCustomers || 0,
        customerGrowth: statsData.customerGrowth || 0,
        totalProducts: statsData.totalProducts || 0,
        lowStockProducts: statsData.lowStockProducts || 0,
      })

      setOrders(statsData.recentOrders || [])

      // Generate activities from recent orders
      const newActivities: RecentActivity[] = []
      if (statsData.recentOrders?.length > 0) {
        statsData.recentOrders.slice(0, 5).forEach((order: any) => {
          newActivities.push({
            id: `order-${order.id}`,
            type: "order",
            message: `Nueva orden #${order.orderNumber} de ${order.customerName}`,
            time: new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          })
        })
      }
      if (statsData.lowStockProducts > 0) {
        newActivities.push({
          id: "stock-warning",
          type: "warning",
          message: `Alerta: ${statsData.lowStockProducts} productos con stock bajo`,
          time: "Ahora",
        })
      }
      setActivities(newActivities)
    } catch (error) {
      console.error("Dashboard error:", error)
      // No longer setting demo data here to ensure transparency
      setStats({
        totalOrders: 0,
        pendingOrders: 0,
        confirmedOrders: 0,
        totalRevenue: 0,
        revenueGrowth: 0,
        totalCustomers: 0,
        customerGrowth: 0,
        totalProducts: 0,
        lowStockProducts: 0,
      })
      setOrders([])
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Panel de Control">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Panel de Control">
      <div className="space-y-8">
        <div>
          <p className="text-muted-foreground">Bienvenido de nuevo, aquí tienes un resumen de tu negocio.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          <Card className="border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Ventas Totales</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <DollarSign className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground">${formatUSD(stats.totalRevenue)}</div>
              <div className="mt-1 flex items-center text-xs font-bold text-primary">
                <ArrowUpRight className="mr-1 h-3 w-3" />
                <span>+{stats.revenueGrowth}% desde el último mes</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Órdenes Nuevas</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <ShoppingCart className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground">+{stats.totalOrders}</div>
              <p className="text-xs font-bold text-muted-foreground/60 mt-1">{stats.pendingOrders} pendientes por procesar</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Clientes Activos</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                <Users className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground">{stats.totalCustomers}</div>
              <div className="mt-1 flex items-center text-xs font-bold text-primary">
                <ArrowUpRight className="mr-1 h-3 w-3" />
                <span>+{stats.customerGrowth}% nuevos clientes</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Tasa BCV (BS/USD)</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-black text-foreground">
                  {bcvRate ? bcvRate.toFixed(2) : "..." }
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                  onClick={handleUpdateBcv}
                  disabled={updatingBcv}
                >
                  <RefreshCw className={`h-4 w-4 ${updatingBcv ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground/60 mt-1">
                {lastBcvUpdate ? (
                  <>Última act: {lastBcvUpdate.toLocaleDateString()} {lastBcvUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</>
                ) : (
                  <Link to="/admin/configuracion" className="hover:text-primary transition-colors">
                    Ver historial y actualizar →
                  </Link>
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Stock Crítico</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground">{stats.lowStockProducts}</div>
              <p className="text-xs font-bold text-red-500/80 mt-1">Productos por debajo del mínimo</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          {/* Recent Orders */}
          <Card className="lg:col-span-4 border-border/50 bg-card shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Órdenes Recientes</CardTitle>
                <p className="text-xs font-bold text-muted-foreground/60 mt-1">Tienes {stats.pendingOrders} órdenes sin confirmar.</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl font-bold border-border hover:border-primary hover:text-primary" asChild>
                <Link to="/admin/orders">Ver Todas</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 rounded-2xl bg-secondary/30 border border-border/20 group hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-card flex items-center justify-center shadow-sm font-black text-xs text-primary border border-border/50">
                        #{order.orderNumber.slice(-4)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-foreground">{order.customerName}</p>
                        <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm font-black text-foreground">${formatUSD(order.total)}</p>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${order.isPaid ? 'text-primary' : 'text-amber-500'}`}>
                          {order.isPaid ? 'Pagado' : 'Pendiente'}
                        </p>
                      </div>
                      <Badge className={`rounded-lg font-black text-[10px] tracking-wider px-3 py-1 ${
                        order.status === "PENDING" ? "bg-amber-500/10 text-amber-500" :
                        order.status === "ACCEPTED" || order.status === "CONFIRMED" || order.status === "COMPLETED" ? "bg-primary/10 text-primary" :
                        "bg-secondary/50 text-muted-foreground"
                      }`}>
                        {order.status === "PENDING" ? "PENDIENTE" : 
                         order.status === "PROCESSING" ? "PROCESANDO" :
                         order.status === "ACCEPTED" ? "ACEPTADA" :
                         order.status === "COMPLETED" ? "COMPLETADA" :
                         order.status === "CANCELLED" ? "CANCELADA" :
                         order.status === "REJECTED" ? "RECHAZADA" :
                         order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card className="lg:col-span-3 border-border/50 bg-card shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Actividad Reciente</CardTitle>
              <p className="text-xs font-bold text-muted-foreground/60 mt-1">Eventos del sistema y acciones.</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {activities.map((activity) => (
                  <div key={activity.id} className="relative pl-6 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-0.5 before:bg-border/50 last:before:hidden">
                    <div className="absolute left-[-4px] top-2 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary/10" />
                    <div>
                      <p className="text-sm font-bold text-foreground leading-snug">{activity.message}</p>
                      <p className="text-[10px] font-bold text-muted-foreground/60 mt-1 uppercase tracking-widest">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
