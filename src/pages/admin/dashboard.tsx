import { useMemo } from 'react';
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  Calendar,
  ChevronRight,
  ExternalLink,
  Plus
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

export const AdminDashboard = () => {
  // Mock data for the dashboard
  const stats = useMemo(() => ({
    totalRevenue: 125430.50,
    revenueGrowth: 12.5,
    totalOrders: 856,
    orderGrowth: 8.2,
    activeCustomers: 1240,
    customerGrowth: 5.4,
    averageOrderValue: 146.53,
    aovGrowth: -2.1,
    conversionRate: 3.45,
    conversionGrowth: 1.2
  }), []);

  const chartData = useMemo(() => [
    { name: 'Lun', sales: 4000, revenue: 2400 },
    { name: 'Mar', sales: 3000, revenue: 1398 },
    { name: 'Mie', sales: 2000, revenue: 9800 },
    { name: 'Jue', sales: 2780, revenue: 3908 },
    { name: 'Vie', sales: 1890, revenue: 4800 },
    { name: 'Sab', sales: 2390, revenue: 3800 },
    { name: 'Dom', sales: 3490, revenue: 4300 },
  ], []);

  const recentOrders = useMemo(() => [
    { id: '#ORD-7234', customer: 'Carlos Rodriguez', product: 'Proteína Whey Isolate', amount: 89.99, status: 'Completado', date: 'Hace 2 min' },
    { id: '#ORD-7233', customer: 'Elena Martinez', product: 'Creatina Monohidratada', amount: 34.50, status: 'Procesando', date: 'Hace 15 min' },
    { id: '#ORD-7232', customer: 'Marcos Pérez', product: 'Pre-Workout Explosive', amount: 45.00, status: 'Completado', date: 'Hace 45 min' },
    { id: '#ORD-7231', customer: 'Lucía Sanz', product: 'BCAA Recovery Mix', amount: 29.99, status: 'Pendiente', date: 'Hace 1 hora' },
    { id: '#ORD-7230', customer: 'David García', product: 'Multivitamínico Daily', amount: 19.95, status: 'Completado', date: 'Hace 2 horas' },
  ], []);

  const formatUSD = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

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

  return (
    <div className="p-8 bg-background min-h-screen selection:bg-primary/20 selection:text-primary">
      {/* Header Section with Vitality Zen Style */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-12 relative"
      >
        <div className="absolute -left-8 top-0 w-1.5 h-16 bg-primary rounded-r-full shadow-lg shadow-primary/20" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-800 flex items-center gap-4">
              Dashboard de Vitalidad
              <Activity className="h-8 w-8 text-primary" />
            </h1>
            <p className="text-slate-500 font-medium mt-1 text-sm flex items-center gap-2">
              <span className="h-px w-8 bg-slate-200" />
              Gestión profesional de rendimiento y salud
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="h-11 border-slate-200 font-bold text-xs uppercase tracking-wider hover:bg-white hover:border-primary transition-all duration-300 rounded-xl px-6">
              <Calendar className="mr-3 h-4 w-4 text-primary" />
              Últimos 30 días
            </Button>
            <Button className="h-11 bg-primary hover:bg-primary/90 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary/20 transition-all active:scale-[0.98] rounded-xl px-6">
              <Plus className="mr-3 h-4 w-4" />
              Nuevo Producto
            </Button>
          </div>
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
          { title: 'Ingresos Totales', value: formatUSD(stats.totalRevenue), growth: stats.revenueGrowth, icon: DollarSign, trend: 'up' },
          { title: 'Pedidos', value: stats.totalOrders, growth: stats.orderGrowth, icon: ShoppingCart, trend: 'up' },
          { title: 'Atletas Activos', value: stats.activeCustomers, growth: stats.customerGrowth, icon: Users, trend: 'up' },
          { title: 'Ticket Promedio', value: formatUSD(stats.averageOrderValue), growth: stats.aovGrowth, icon: TrendingUp, trend: 'down' },
          { title: 'Conversión', value: `${stats.conversionRate}%`, growth: stats.conversionGrowth, icon: Activity, trend: 'up' }
        ].map((item, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card className="border-0 shadow-sm bg-white overflow-hidden group hover:shadow-xl transition-all duration-500 rounded-2xl relative">
              <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-full blur-2xl translate-x-8 -translate-y-8 group-hover:bg-primary/10 transition-colors" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-primary transition-colors">{item.title}</CardTitle>
                <item.icon className="h-4 w-4 text-slate-300 group-hover:text-primary group-hover:scale-110 transition-all duration-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800 tracking-tight mb-1 group-hover:translate-x-1 transition-transform duration-500">{item.value}</div>
                <div className={`flex items-center text-[10px] font-bold uppercase tracking-wider ${item.trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {item.trend === 'up' ? <ArrowUpRight className="mr-1 h-3.5 w-3.5" /> : <ArrowDownRight className="mr-1 h-3.5 w-3.5" />}
                  <span className="bg-slate-50 px-2 py-0.5 rounded-full">{item.growth > 0 ? '+' : ''}{item.growth}%</span>
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
          <Card className="border-0 shadow-sm bg-white rounded-2xl overflow-hidden h-full">
            <CardHeader className="border-b border-slate-50 p-8">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-3">
                    Curva de Crecimiento
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Ingresos vs Pedidos (Análisis Semanal)</CardDescription>
                </div>
                <div className="flex gap-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 bg-primary rounded-full shadow-lg shadow-primary/20" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Ingresos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 bg-slate-400 rounded-full" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Pedidos</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-12">
              <div className="h-[400px] w-full">
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
                        backgroundColor: '#fff', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        padding: '12px 16px'
                      }}
                      itemStyle={{ 
                        color: '#1e293b',
                        fontSize: '11px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                      labelStyle={{
                        color: '#527a2e',
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
          <Card className="border-0 shadow-sm bg-white rounded-2xl overflow-hidden h-full flex flex-col">
            <CardHeader className="bg-slate-50 border-b border-slate-100 p-8 relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-full h-full bg-primary/5 rounded-full blur-3xl translate-x-1/2" />
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold tracking-tight text-slate-800">Última Actividad</CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Sincronización en vivo</CardDescription>
                </div>
                <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center border border-slate-100">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto">
              <div className="divide-y divide-slate-50">
                {recentOrders.map((order, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + (i * 0.1) }}
                    className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all duration-300 group cursor-pointer border-l-4 border-transparent hover:border-primary"
                  >
                    <div className="flex items-center gap-5">
                      <div className="h-12 w-12 bg-slate-50 rounded-xl flex items-center justify-center text-primary font-bold text-xs border border-slate-100 group-hover:border-primary/20 group-hover:scale-105 transition-all duration-500">
                        {order.id.split('-')[1]}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-800 tracking-tight group-hover:text-primary transition-colors">{order.customer}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{order.product}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-800">{formatUSD(order.amount)}</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center justify-end gap-1.5 mt-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        {order.date}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
            <div className="p-6 bg-slate-50/50 border-t border-slate-100 mt-auto">
              <Button variant="ghost" className="w-full h-12 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-primary hover:bg-white border border-transparent hover:border-slate-100 transition-all duration-300 flex items-center justify-center gap-3 group rounded-xl">
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
        className="mt-12 flex flex-wrap gap-4"
      >
        <Button className="h-14 bg-primary text-white hover:bg-primary/90 font-bold text-xs uppercase tracking-wider px-8 rounded-2xl transition-all duration-300 shadow-lg shadow-primary/20">
          <Plus className="mr-3 h-5 w-5" />
          Nueva Orden Rápida
        </Button>
        <Button variant="outline" className="h-14 border-slate-200 text-slate-600 hover:bg-white hover:border-primary hover:text-primary font-bold text-xs uppercase tracking-wider px-8 rounded-2xl transition-all duration-300">
          Gestionar Inventario
        </Button>
      </motion.div>
    </div>
  );
};
