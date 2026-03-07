import { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { formatUSD as formatUSDUtil, cn } from '@/lib/utils';
import {
  ShoppingCart,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Loader2,
  Package,
  Users
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
  growth?: {
    revenue: number;
    orders: number;
    customers: number;
  };
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

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

  const realGrowth = useMemo(() => ({
    revenueGrowth: stats?.growth?.revenue || 0,
    orderGrowth: stats?.growth?.orders || 0,
    customerGrowth: stats?.growth?.customers || 0,
    averageOrderValue: stats ? (stats.totalRevenue / (stats.totalOrders || 1)) : 0,
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
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Sincronizando...</p>
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
    <div className="space-y-6 pb-20 md:pb-0" role="main">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Panel de Control</h1>
          <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">Bienvenido de nuevo, {user?.name || 'Administrador'}</p>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10"
      >
        {[
          { title: 'Ingresos Totales', value: formatUSD(stats.totalRevenue), growth: realGrowth.revenueGrowth, icon: DollarSign },
          { title: 'Pedidos Totales', value: stats.totalOrders, growth: realGrowth.orderGrowth, icon: ShoppingCart },
          { title: 'Clientes Totales', value: stats.totalCustomers, growth: realGrowth.customerGrowth, icon: Users },
          { title: 'Alertas Stock', value: stats.lowStockProducts, growth: -5, icon: Package },
        ].map((item, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card className="border border-slate-100 shadow-sm bg-white dark:bg-card dark:border-border/60 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <item.icon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full",
                  item.growth >= 0 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400"
                )}>
                  {item.growth >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                  {Math.abs(item.growth)}%
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{item.title}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{item.value}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-8"
        >
          <Card className="border border-slate-100 shadow-sm bg-white dark:bg-card dark:border-border rounded-2xl overflow-hidden h-full">
            <CardHeader className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Curva de Crecimiento</CardTitle>
                  <CardDescription className="text-sm dark:text-slate-400">Análisis de Ingresos vs Pedidos</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="h-[300px] lg:h-[400px] w-full">
                {isReady && chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: '1px solid #f1f5f9',
                          borderRadius: '12px',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        fill="transparent"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400">
                    <p className="text-sm">Cargando gráficas...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-4"
        >
          <Card className="border border-slate-100 shadow-sm bg-white dark:bg-card dark:border-border/60 rounded-2xl overflow-hidden h-full flex flex-col">
            <CardHeader className="p-6 border-b border-slate-50 dark:border-border/60">
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Actividad Reciente</CardTitle>
              <CardDescription className="text-sm dark:text-slate-400">Últimas actualizaciones</CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <div className="divide-y divide-slate-50 dark:divide-border/60">
                {stats.recentOrders.length > 0 ? (
                  stats.recentOrders.map((order, i) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + (i * 0.1) }}
                      className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs border border-slate-100 dark:border-border">
                          {order.orderNumber.substring(0, 4)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">{order.customerName}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">Pedido #{order.orderNumber}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{formatUSD(order.total)}</div>
                        <div className="text-[10px] font-medium text-slate-400 uppercase mt-1">
                          {format(new Date(order.createdAt), 'HH:mm', { locale: es })}
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-12 text-center text-slate-400">
                    <ShoppingCart className="h-8 w-8 mx-auto mb-3 opacity-20" aria-hidden="true" />
                    <p className="text-sm font-medium">Sin actividad reciente</p>
                  </div>
                )}
              </div>
            </CardContent>
            <div className="p-4 border-t border-slate-50 dark:border-border/60 mt-auto text-center">
              <Button
                onClick={() => navigate('/admin/orders')}
                variant="ghost"
                className="w-full h-10 text-sm font-bold text-primary hover:text-primary/80 hover:bg-primary/5 dark:hover:bg-primary/10 rounded-xl transition-all"
              >
                Ver todos los reportes
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
