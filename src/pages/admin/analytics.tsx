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
  AlertTriangle,
  CheckCircle2,
} from "lucide-react"
import { AdminPageHeader } from "@/components/admin/page-header"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
 
import { formatUSD } from "@/lib/utils"
import { api } from "@/lib/api"

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4']

export function AdminAnalyticsPage() {
  const [period, setPeriod] = useState("30d")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [reportData, setReportData] = useState<any>(null)
  const [isReady, setIsReady] = useState(false)

  // Sistema de confirmación centralizado
  const [confirmConfig, setConfirmConfig] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant: "default" | "destructive";
    confirmText?: string;
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
    variant: "default"
  })

  const confirmAction = (config: Omit<typeof confirmConfig, "open">) => {
    setConfirmConfig({ ...config, open: true })
  }

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    document.title = "Reportes | Ana's Supplements Admin"
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
          api.getStats({ startDate, endDate }),
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
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

    confirmAction({
      title: "Exportar Reporte",
      description: "¿Estás seguro de que deseas exportar los datos de analíticas del periodo seleccionado en formato CSV?",
      confirmText: "Exportar",
      variant: "default",
      onConfirm: () => {
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
    })
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border rounded-lg shadow-lg">
          <p className="font-bold text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className={entry.dataKey === 'revenue' ? "text-emerald-600" : "text-blue-600"}>
              {entry.name}: {entry.dataKey === 'revenue' ? formatUSD(entry.value) : entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <>
      <div className="space-y-6 pb-10">
        <AdminPageHeader 
          title="Reportes y Analíticas"
          subtitle="Visualiza el rendimiento real de tu negocio"
          icon={BarChart3}
        />

        {/* Filters and Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto scrollbar-hide pb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-muted-foreground whitespace-nowrap">Periodo:</span>
              <div className="flex bg-slate-100/50 dark:bg-muted/20 p-1 rounded-xl border border-slate-200/50 dark:border-border/50 shadow-sm h-11 items-center px-1.5 shrink-0">
                <button
                  onClick={() => setPeriod("7d")}
                  className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-all duration-300 rounded-lg whitespace-nowrap group ${
                    period === "7d" 
                      ? "bg-white dark:bg-card text-primary shadow-md scale-[1.02]" 
                      : "text-muted-foreground hover:text-primary hover:bg-white/50 dark:hover:bg-muted/50"
                  }`}
                >
                  7 Días
                </button>
                <button
                  onClick={() => setPeriod("30d")}
                  className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-all duration-300 rounded-lg whitespace-nowrap group ${
                    period === "30d" 
                      ? "bg-white dark:bg-card text-primary shadow-md scale-[1.02]" 
                      : "text-muted-foreground hover:text-primary hover:bg-white/50 dark:hover:bg-muted/50"
                  }`}
                >
                  30 Días
                </button>
                <button
                  onClick={() => setPeriod("90d")}
                  className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-all duration-300 rounded-lg whitespace-nowrap group ${
                    period === "90d" 
                      ? "bg-white dark:bg-card text-primary shadow-md scale-[1.02]" 
                      : "text-muted-foreground hover:text-primary hover:bg-white/50 dark:hover:bg-muted/50"
                  }`}
                >
                  3 Meses
                </button>
                <button
                  onClick={() => setPeriod("1y")}
                  className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-all duration-300 rounded-lg whitespace-nowrap group ${
                    period === "1y" 
                      ? "bg-white dark:bg-card text-primary shadow-md scale-[1.02]" 
                      : "text-muted-foreground hover:text-primary hover:bg-white/50 dark:hover:bg-muted/50"
                  }`}
                >
                  1 Año
                </button>
              </div>
            </div>
            <Button variant="outline" onClick={handleExport} className="h-11 rounded-xl border-slate-200/50 dark:border-border/50 bg-white/50 dark:bg-muted/10 font-bold text-xs uppercase tracking-wider">
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
            trend={`${(stats?.growth?.revenue || 0) >= 0 ? '+' : ''}${stats?.growth?.revenue || 0}%`}
            trendUp={(stats?.growth?.revenue || 0) >= 0}
            color="bg-emerald-100"
          />
          <MetricCard 
            title="Total Órdenes" 
            value={stats?.totalOrders || 0} 
            icon={<ShoppingCart className="h-6 w-6 text-blue-600" />}
            trend={`${(stats?.growth?.orders || 0) >= 0 ? '+' : ''}${stats?.growth?.orders || 0}%`}
            trendUp={(stats?.growth?.orders || 0) >= 0}
            color="bg-blue-100"
          />
          <MetricCard 
            title="Ticket Promedio" 
            value={formatUSD((stats?.totalRevenue || 0) / (stats?.totalOrders || 1))} 
            icon={<BarChart3 className="h-6 w-6 text-purple-600" />}
            trend={period === '7d' ? '—' : `${((stats?.growth?.revenue || 0) - (stats?.growth?.orders || 0)) >= 0 ? '+' : ''}${Math.round(((stats?.growth?.revenue || 0) - (stats?.growth?.orders || 0)) * 10) / 10}%`}
            trendUp={((stats?.growth?.revenue || 0) - (stats?.growth?.orders || 0)) >= 0}
            color="bg-purple-100"
          />
          <MetricCard 
            title="Total Clientes" 
            value={stats?.totalCustomers || 0} 
            icon={<Users className="h-6 w-6 text-orange-600" />}
            trend={`${(stats?.growth?.customers || 0) >= 0 ? '+' : ''}${stats?.growth?.customers || 0}%`}
            trendUp={(stats?.growth?.customers || 0) >= 0}
            color="bg-orange-100"
          />
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Revenue & Orders Chart */}
          <Card className="md:col-span-2 overflow-hidden border-none shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold">Evolución de Ingresos y Órdenes</CardTitle>
              <CardDescription>Comparativa de ingresos y órdenes en el tiempo</CardDescription>
            </CardHeader>
            <CardContent>
<div className="h-[350px] w-full pt-4 relative min-h-[350px]">
                {isReady && monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <AreaChart data={monthlyData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
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
                      yAxisId="left"
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                      name="Ingresos"
                    />
                    <Area 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="orders" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorOrders)" 
                      name="Órdenes"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <p className="text-sm">No hay datos para el período seleccionado</p>
                  </div>
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
<div className="h-[250px] w-full min-h-[250px]">
                {isReady && (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
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
<div className="h-[300px] w-full pt-4 min-h-[300px]">
                {isReady && (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
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
    </>
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
