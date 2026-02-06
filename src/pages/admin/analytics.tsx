import { useState, useEffect } from "react"
import {
  DollarSign,
  ShoppingCart,
  Users,
  BarChart3,
  Download,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AdminLayout } from "@/components/layout/admin-layout"
import { formatUSD } from "@/lib/utils"
import { api } from "@/lib/api"

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4']

export function AdminAnalyticsPage() {
  const [period, setPeriod] = useState("30d")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [reportData, setReportData] = useState<any>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsReady(true)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const endDate = new Date().toISOString()
        let startDate: string
        switch (period) {
          case '7d':
            startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            break
          case '30d':
            startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
            break
          case '90d':
            startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
            break
          case '1y':
            startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
            break
          default:
            startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        }

        const [statsRes, reportRes] = await Promise.all([
          api.getStats(),
          api.getAnalyticsReport({ startDate, endDate })
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
      <AdminLayout title="Reportes">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    )
  }

  const monthlyData = reportData?.monthlyStats || []
  const topProducts = reportData?.topProducts || []
  const categoryStats = reportData?.categoryStats || [
    { name: "Suplementos", percentage: 45 },
    { name: "Vitaminas", percentage: 30 },
    { name: "Proteínas", percentage: 25 },
  ]

  const handleExport = () => {
    if (!reportData) return

    const data = [
      ["Reporte de Analíticas - Ana's Supplements"],
      [`Periodo: ${period}`],
      [""],
      ["RESUMEN MENSUAL"],
      ["Mes", "Ingresos (USD)", "Órdenes"],
      ...monthlyData.map((d: any) => [d.month, d.revenue, d.orders]),
      [""],
      ["PRODUCTOS MÁS VENDIDOS"],
      ["Producto", "Ventas", "Ingresos (USD)"],
      ...topProducts.map((p: any) => [p.name, p.sales, p.revenue]),
    ]

    const csvContent = "data:text/csv;charset=utf-8," 
      + data.map(e => e.join(",")).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `analytics_report_${period}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg">
          <p className="font-bold text-gray-900">{label}</p>
          <p className="text-emerald-600">Ingresos: {formatUSD(payload[0].value)}</p>
          {payload[1] && <p className="text-blue-600">Órdenes: {payload[1].value}</p>}
        </div>
      )
    }
    return null
  }

  return (
    <AdminLayout title="Reportes">
      <div className="space-y-6 pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-muted-foreground">Visualiza el rendimiento real de tu negocio</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-3 py-2 border rounded-xl bg-card focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            >
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 3 meses</option>
              <option value="1y">Último año</option>
            </select>
            <Button variant="outline" onClick={handleExport} className="rounded-xl">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard 
            title="Ingresos Totales" 
            value={formatUSD(stats?.totalRevenue || 0)} 
            icon={<DollarSign className="h-6 w-6 text-emerald-600" />}
            trend="+12.5%"
            trendUp={true}
            color="bg-emerald-100"
          />
          <MetricCard 
            title="Total Órdenes" 
            value={stats?.totalOrders || 0} 
            icon={<ShoppingCart className="h-6 w-6 text-blue-600" />}
            trend="+8.2%"
            trendUp={true}
            color="bg-blue-100"
          />
          <MetricCard 
            title="Ticket Promedio" 
            value={formatUSD((stats?.totalRevenue || 0) / (stats?.totalOrders || 1))} 
            icon={<BarChart3 className="h-6 w-6 text-purple-600" />}
            trend="+4.5%"
            trendUp={true}
            color="bg-purple-100"
          />
          <MetricCard 
            title="Total Clientes" 
            value={stats?.totalCustomers || 0} 
            icon={<Users className="h-6 w-6 text-orange-600" />}
            trend="+15.2%"
            trendUp={true}
            color="bg-orange-100"
          />
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Revenue Chart */}
          <Card className="md:col-span-2 overflow-hidden border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold">Evolución de Ingresos</CardTitle>
              <CardDescription>Comparativa de ingresos y órdenes en el tiempo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full pt-4 relative">
                {isReady && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Ventas por Categoría</CardTitle>
              <CardDescription>Distribución porcentual de ventas</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pt-4">
              <div className="h-[250px] w-full">
                {isReady && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie
                      data={categoryStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="percentage"
                    >
                      {categoryStats.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip isAnimationActive={false} />
                  </PieChart>
                </ResponsiveContainer>
                )}
              </div>
              <div className="w-full mt-4 space-y-2">
                {categoryStats.map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-bold">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Products Bar Chart */}
          <Card className="md:col-span-3 border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Productos más Vendidos</CardTitle>
              <CardDescription>Top 10 productos por volumen de ventas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full pt-4">
                {isReady && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topProducts} layout="vertical" margin={{ left: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" hide />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: '#64748b', fontSize: 11 }}
                      width={120}
                    />
                    <Tooltip 
                      isAnimationActive={false}
                      cursor={{ fill: 'transparent' }}
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 border rounded-lg shadow-lg">
                              <p className="font-bold text-xs">{payload[0].payload.name}</p>
                              <p className="text-primary text-xs">Ventas: {payload[0].value}</p>
                              <p className="text-muted-foreground text-[10px]">Ingresos: {formatUSD(payload[0].payload.revenue)}</p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar 
                      dataKey="sales" 
                      fill="#3b82f6" 
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    >
                      {topProducts.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}

function MetricCard({ title, value, icon, trend, trendUp, color }: any) {
  return (
    <Card className="border-none shadow-sm overflow-hidden group hover:shadow-md transition-all">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <div className="flex items-center gap-1">
              {trendUp ? (
                <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span className={`text-xs font-bold ${trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
                {trend}
              </span>
              <span className="text-[10px] text-muted-foreground ml-1">vs periodo anterior</span>
            </div>
          </div>
          <div className={`p-4 rounded-2xl ${color} transition-transform group-hover:scale-110 duration-300`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}