import { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { formatUSD as formatUSDUtil } from '@/lib/utils';
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  ChevronRight,
  Plus,
  Loader2,
  Package
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area 
} from 'recharts';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  confirmedOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockProducts: number;
  chartData: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    status: string;
    isPaid: boolean;
    createdAt: string;
  }>;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const data = await api.get<DashboardStats>('/admin/stats');
        setStats(data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching dashboard stats:', err);
        const errorMessage = err.response?.data?.message || err.message || 'No se pudieron cargar las estadísticas';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  // Mock growth and chart data since current backend doesn't provide historical trends yet
  const mockGrowth = useMemo(() => ({
    revenueGrowth: 12.5,
    orderGrowth: 8.2,
    customerGrowth: 5.4,
    aovGrowth: -2.1,
    conversionGrowth: 1.2,
    averageOrderValue: stats ? (stats.totalRevenue / (stats.totalOrders || 1)) : 0,
    conversionRate: 3.45
  }), [stats]);

  const chartData = useMemo(() => {
    if (!stats?.chartData) return [];
    return stats.chartData;
  }, [stats]);

  const formatUSD = (val: number) => formatUSDUtil(val);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Sincronizando Vitalidad...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center p-8 bg-card rounded-2xl border border-border shadow-xl max-w-md">
          <Activity className="h-12 w-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Error de Sincronización</h2>
          <p className="text-muted-foreground mb-6 text-sm">{error}</p>
          <div className="flex flex-col gap-3">
            <Button onClick={() => window.location.reload()} className="bg-primary text-white font-bold">
              Reintentar Conexión
            </Button>
            <Button onClick={() => navigate('/admin/orders')} variant="outline" className="text-xs uppercase tracking-widest font-bold">
              Ir a Pedidos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="bg-background selection:bg-primary/20 selection:text-primary">
        {/* Header Section with Vitality Zen Style */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-12 relative"
        >
          <div className="absolute -left-4 lg:-left-8 top-0 w-1.5 h-16 bg-primary rounded-r-full shadow-lg shadow-primary/20" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-slate-800 dark:text-foreground flex items-center gap-4">
                Dashboard de Vitalidad
                <Activity className="h-8 w-8 text-primary" />
              </h1>
              <p className="text-slate-500 dark:text-muted-foreground font-medium mt-1 text-sm flex items-center gap-2">
                <span className="h-px w-8 bg-slate-200 dark:bg-border" />
                Gestión profesional de rendimiento y salud
              </p>
            </div>
            <Button 
              onClick={() => navigate('/admin/products')}
              className="h-11 bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20 transition-all active:scale-[0.98] rounded-xl px-6"
            >
              <Plus className="mr-3 h-4 w-4" />
              Nuevo Producto
            </Button>
          </div>
        </motion.div>

        {/* Stats Grid - "Dynamic & Athletic" Aesthetic */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-5 mb-12"
        >
          {[
            { title: 'Ingresos Totales', value: formatUSD(stats.totalRevenue), growth: mockGrowth.revenueGrowth, icon: DollarSign, trend: 'up' },
            { title: 'Pedidos', value: stats.totalOrders, growth: mockGrowth.orderGrowth, icon: ShoppingCart, trend: 'up' },
            { title: 'Atletas Activos', value: stats.totalCustomers, growth: mockGrowth.customerGrowth, icon: Users, trend: 'up' },
            { title: 'Ticket Promedio', value: formatUSD(mockGrowth.averageOrderValue), growth: mockGrowth.aovGrowth, icon: TrendingUp, trend: 'down' },
            { title: 'Conversión', value: `${mockGrowth.conversionRate}%`, growth: mockGrowth.conversionGrowth, icon: Activity, trend: 'up' }
          ].map((item, i) => (
            <motion.div key={i} variants={itemVariants}>
              <Card className="border-0 shadow-sm bg-white dark:bg-card overflow-hidden group hover:shadow-xl transition-all duration-500 rounded-2xl relative">
                <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-2xl translate-x-8 -translate-y-8 group-hover:bg-primary/10 transition-colors" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-muted-foreground group-hover:text-primary transition-colors">{item.title}</CardTitle>
                  <item.icon className="h-4 w-4 text-slate-300 dark:text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all duration-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-slate-800 dark:text-foreground tracking-tight mb-1 group-hover:translate-x-1 transition-transform duration-500">{item.value}</div>
                  <div className={`flex items-center text-[10px] font-bold uppercase tracking-wider ${item.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {item.trend === 'up' ? <ArrowUpRight className="mr-1 h-3.5 w-3.5" /> : <ArrowDownRight className="mr-1 h-3.5 w-3.5" />}
                    <span className="bg-slate-50 dark:bg-muted px-2 py-0.5 rounded-full">{item.growth > 0 ? '+' : ''}{item.growth}%</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-12">
          {/* Main Chart Area */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-8"
          >
            <Card className="border-0 shadow-sm bg-white dark:bg-card rounded-2xl overflow-hidden h-full">
              <CardHeader className="border-b border-slate-50 dark:border-border p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-slate-800 dark:text-foreground flex items-center gap-3">
                      Curva de Crecimiento
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-muted-foreground mt-1">Ingresos vs Pedidos (Análisis Semanal)</CardDescription>
                  </div>
                  <div className="flex gap-6 bg-slate-50 dark:bg-muted p-3 rounded-xl border border-slate-100 dark:border-border">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-primary rounded-full shadow-lg shadow-primary/20" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-muted-foreground">Ingresos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 bg-slate-400 dark:bg-slate-500 rounded-full" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-muted-foreground">Pedidos</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 lg:p-8 pt-12">
                <div className="h-[300px] lg:h-[400px] w-full min-h-0 min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#527a2e" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#527a2e" stopOpacity={0}/>
                      </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#F1F5F9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 900, fill: '#94A3B8' }}
                        dy={15}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 900, fill: '#94A3B8' }}
                      />
                      <Tooltip 
                        cursor={{ stroke: '#527a2e', strokeWidth: 2 }}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))', 
                          borderRadius: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                          padding: '12px 16px'
                        }}
                        itemStyle={{ 
                          color: 'hsl(var(--foreground))',
                          fontSize: '11px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}
                        labelStyle={{
                          color: 'hsl(var(--primary))',
                          fontSize: '10px',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          marginBottom: '8px',
                          letterSpacing: '0.1em'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#527a2e" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
                        animationDuration={2000}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="#94a3b8" 
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        fill="transparent"
                        animationDuration={2500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Orders List */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-4"
          >
            <Card className="border-0 shadow-sm bg-white dark:bg-card rounded-2xl overflow-hidden h-full flex flex-col">
              <CardHeader className="bg-slate-50 dark:bg-muted/50 border-b border-slate-100 dark:border-border p-6 lg:p-8 relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-full h-full bg-primary/5 rounded-full blur-3xl translate-x-1/2" />
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold tracking-tight text-slate-800 dark:text-foreground">Última Actividad</CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-muted-foreground mt-1">Sincronización en vivo</CardDescription>
                  </div>
                  <div className="h-10 w-10 bg-white dark:bg-background rounded-xl shadow-sm flex items-center justify-center border border-slate-100 dark:border-border">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-y-auto">
                <div className="divide-y divide-slate-50 dark:divide-border">
                  {stats.recentOrders.length > 0 ? (
                    stats.recentOrders.map((order, i) => (
                      <motion.div 
                        key={order.id} 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7 + (i * 0.1) }}
                        className="p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-muted/30 transition-all duration-300 group cursor-pointer border-l-4 border-transparent hover:border-primary"
                      >
                        <div className="flex items-center gap-5">
                          <div className="h-12 w-12 bg-slate-50 dark:bg-muted rounded-xl flex items-center justify-center text-primary font-bold text-xs border border-slate-100 dark:border-border group-hover:border-primary/20 group-hover:scale-105 transition-all duration-500">
                            {order.orderNumber.substring(0, 4)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-800 dark:text-foreground tracking-tight group-hover:text-primary transition-colors">{order.customerName}</div>
                            <div className="text-[10px] font-bold text-slate-400 dark:text-muted-foreground uppercase tracking-widest mt-0.5">Orden #{order.orderNumber}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-800 dark:text-foreground">{formatUSD(order.total)}</div>
                          <div className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center justify-end gap-1.5 mt-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                            {format(new Date(order.createdAt), 'HH:mm', { locale: es })}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="p-12 text-center">
                      <ShoppingCart className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sin actividad reciente</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <div className="p-6 bg-slate-50/50 dark:bg-muted/20 border-t border-slate-100 dark:border-border mt-auto">
                <Button 
                  onClick={() => navigate('/admin/orders')}
                  variant="ghost" 
                  className="w-full h-12 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-muted-foreground hover:text-primary hover:bg-white dark:hover:bg-card border border-transparent hover:border-slate-100 dark:hover:border-border transition-all duration-300 flex items-center justify-center gap-3 group rounded-xl"
                >
                  Ver Todo el Historial
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-2 transition-transform duration-500" />
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions Footer */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-12 flex flex-wrap gap-4 items-center"
        >
          <div className="flex-1 min-w-[280px] h-14 bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl p-1.5 flex gap-2 shadow-sm">
            <Button 
              onClick={() => navigate('/admin/orders')}
              className="flex-1 h-full bg-primary text-white hover:bg-primary/90 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all duration-300 shadow-md shadow-primary/20 flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nueva Orden
            </Button>
            <Button 
              onClick={() => navigate('/admin/inventory')}
              variant="ghost"
              className="flex-1 h-full text-slate-600 dark:text-muted-foreground hover:bg-slate-50 dark:hover:bg-muted/50 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Package className="h-4 w-4" />
              Inventario
            </Button>
          </div>
          
          <Button 
            onClick={() => navigate('/admin/products')}
            variant="outline"
            className="h-14 border-slate-200 dark:border-border text-slate-600 dark:text-muted-foreground hover:bg-white dark:hover:bg-muted hover:border-primary hover:text-primary font-bold text-[10px] uppercase tracking-wider px-8 rounded-2xl transition-all duration-300 shadow-sm flex items-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            Catálogo
          </Button>
        </motion.div>
      </div>
  );
}
