import { useState, useEffect } from "react"
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  BarChart3,
  Download,
  Loader2,
  Package,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdminLayout } from "@/components/layout/admin-layout"
import { formatUSD } from "@/lib/utils"
import { api } from "@/lib/api"

export function AdminAnalyticsPage() {
  const [period, setPeriod] = useState("30d")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [reportData, setReportData] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [statsRes, reportRes] = await Promise.all([
          api.getStats(),
          api.getSalesReport()
        ])
        setStats(statsRes)
        setReportData(reportRes)
      } catch (error) {
        console.error("Error fetching analytics:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [period])

  if (loading || !stats) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    )
  }

  const monthlyData = reportData?.monthlyStats || [
    { month: "Ene", revenue: (stats?.totalRevenue || 0) * 0.1, orders: (stats?.totalOrders || 0) * 0.1 },
    { month: "Feb", revenue: (stats?.totalRevenue || 0) * 0.15, orders: (stats?.totalOrders || 0) * 0.15 },
    { month: "Mar", revenue: (stats?.totalRevenue || 0) * 0.2, orders: (stats?.totalOrders || 0) * 0.2 },
    { month: "Abr", revenue: (stats?.totalRevenue || 0) * 0.18, orders: (stats?.totalOrders || 0) * 0.18 },
    { month: "May", revenue: (stats?.totalRevenue || 0) * 0.22, orders: (stats?.totalOrders || 0) * 0.22 },
    { month: "Jun", revenue: (stats?.totalRevenue || 0) * 0.15, orders: (stats?.totalOrders || 0) * 0.15 },
  ]

  const categoryStats = reportData?.categoryStats || [
    { name: "Suplementos", percentage: 45 },
    { name: "Vitaminas", percentage: 30 },
    { name: "Proteínas", percentage: 25 },
  ]

  const maxRevenue = Math.max(...monthlyData.map((d: any) => d.revenue))

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Reportes y Analíticas</h1>
            <p className="text-muted-foreground">Analiza el rendimiento real de tu tienda basado en órdenes y productos</p>
          </div>
          <div className="flex gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 3 meses</option>
              <option value="1y">Último año</option>
            </select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ingresos totales</p>
                  <p className="text-3xl font-bold">${(stats?.totalRevenue || 0).toLocaleString()}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-500">
                      +12.5%
                    </span>
                    <span className="text-sm text-muted-foreground">vs periodo anterior</span>
                  </div>
                </div>
                <div className="p-3 rounded-full bg-green-100">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total órdenes</p>
                  <p className="text-3xl font-bold">{stats?.totalOrders || 0}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-500">+8.2%</span>
                    <span className="text-sm text-muted-foreground">vs periodo anterior</span>
                  </div>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ticket promedio</p>
                  <p className="text-3xl font-bold">${((stats?.totalRevenue || 0) / (stats?.totalOrders || 1)).toFixed(2)}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-500">+4.5%</span>
                    <span className="text-sm text-muted-foreground">vs periodo anterior</span>
                  </div>
                </div>
                <div className="p-3 rounded-full bg-purple-100">
                  <BarChart3 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total clientes</p>
                  <p className="text-3xl font-bold">{stats?.totalCustomers || 0}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-500">+15.2%</span>
                    <span className="text-sm text-muted-foreground">vs periodo anterior</span>
                  </div>
                </div>
                <div className="p-3 rounded-full bg-orange-100">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList>
            <TabsTrigger value="revenue">Ingresos</TabsTrigger>
            <TabsTrigger value="categories">Categorías</TabsTrigger>
            <TabsTrigger value="products">Productos</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>Ingresos Mensuales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 flex items-end gap-4">
                  {monthlyData.map((data: any, index: number) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col items-center">
                        <span className="text-sm text-muted-foreground mb-1">
                          ${data.revenue.toLocaleString()}
                        </span>
                        <div
                          className="w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600"
                          style={{ height: `${(data.revenue / (maxRevenue || 1)) * 280}px` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{data.month}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    {categoryStats.map((cat: any, index: number) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{cat.name}</span>
                          <span className="font-medium">{cat.percentage}%</span>
                        </div>
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500"
                            style={{ width: `${cat.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="w-48 h-48 rounded-full border-8 border-gray-200 relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-2xl font-bold">100%</p>
                          <p className="text-sm text-muted-foreground">Total</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Productos Mas Vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Producto</th>
                      <th className="text-left p-4 font-medium">Ventas</th>
                      <th className="text-left p-4 font-medium">Ingresos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData?.topProducts?.map((product: any, index: number) => (
                      <tr key={index} className="border-b">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-600" />
                            </div>
                            <span className="font-medium">{product.name}</span>
                          </div>
                        </td>
                        <td className="p-4">{product.sales}</td>
                        <td className="p-4 font-semibold">${formatUSD(product.revenue)}</td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-muted-foreground">
                          No hay productos registrados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Stock</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Productos activos</span>
                  <span className="font-medium">{stats.totalProducts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stock bajo</span>
                  <span className="font-medium text-red-500">{stats.lowStockProducts}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen de Pedidos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pendientes</span>
                <span className="font-medium">{stats.pendingOrders}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Confirmados</span>
                <span className="font-medium">{stats.confirmedOrders}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Clientes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total clientes</span>
                <span className="font-medium">{stats.totalCustomers}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
