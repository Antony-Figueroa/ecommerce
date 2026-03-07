import { useState, useEffect } from 'react';
import {
  Kanban,
  MessageCircle,
  ChevronRight,
  Clock,
  DollarSign
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/api';
import { cn, formatUSD } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Order {
  id: string;
  saleNumber: string;
  customerName: string;
  customerPhone: string;
  totalUSD: number;
  status: string;
  deliveryStatus: string;
  createdAt: string;
}

const COLUMNS = [
  { id: 'PENDING', title: 'Pendientes', color: 'bg-amber-500' },
  { id: 'ACCEPTED', title: 'Aceptados', color: 'bg-blue-500' },
  { id: 'PROCESSING', title: 'En Preparación', color: 'bg-indigo-500' },
  { id: 'COMPLETED', title: 'Completados', color: 'bg-emerald-500' }
];

export function AdminKanbanPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await api.get<any>('/admin/sales?limit=100');
      // The API returns { sales: Order[], pagination: ... }
      const ordersData = data.sales || [];
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // The sale routes use PATCH /:id/items/:itemId/status or a general status update
      // Let's check if there is a general status update for the whole sale
      await api.patch(`/admin/sales/${orderId}/status`, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast({
        title: "Estado actualizado",
        description: `Pedido movido a ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      });
    }
  };

  const sendWhatsApp = (order: Order) => {
    const message = `Hola ${order.customerName}, te escribimos de Ana's Supplements. Tu pedido ${order.saleNumber} ha cambiado de estado a: ${order.status}. ¡Gracias por tu compra!`;
    const phone = order.customerPhone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      <AdminPageHeader
        title="Flujo de Ventas"
        subtitle="Gestiona el ciclo de vida de tus pedidos visualmente"
        icon={Kanban}
      />

      <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-4 h-full min-w-[1200px]">
          {COLUMNS.map(column => (
            <div key={column.id} className="flex flex-col w-72 bg-muted/30 rounded-2xl border border-border/40 overflow-hidden">
              <div className="p-4 border-b border-border/40 bg-white/50 dark:bg-card/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("h-2 w-2 rounded-full", column.color)} />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">{column.title}</h3>
                </div>
                <Badge variant="secondary" className="text-[10px] font-bold">
                  {orders.filter(o => o.status === column.id).length}
                </Badge>
              </div>

              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  <AnimatePresence mode='popLayout'>
                    {orders
                      .filter(o => o.status === column.id)
                      .map(order => (
                        <motion.div
                          key={order.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card className="shadow-sm hover:shadow-md transition-all cursor-pointer group border-border/60">
                            <CardContent className="p-3 space-y-3">
                              <div className="flex justify-between items-start">
                                <span className="text-[10px] font-mono font-bold text-primary">{order.saleNumber}</span>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-emerald-600 hover:bg-emerald-50"
                                    onClick={(e) => { e.stopPropagation(); sendWhatsApp(order); }}
                                  >
                                    <MessageCircle className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <p className="text-xs font-bold text-foreground line-clamp-1">{order.customerName}</p>
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                                  <DollarSign className="h-3 w-3" />
                                  {formatUSD(order.totalUSD)}
                                </div>
                              </div>

                              <div className="flex justify-between items-center pt-2 border-t border-border/40">
                                <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {column.id !== 'COMPLETED' && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-6 text-[9px] px-2 font-bold"
                                      onClick={() => {
                                        const nextIndex = COLUMNS.findIndex(c => c.id === column.id) + 1;
                                        if (nextIndex < COLUMNS.length) {
                                          updateOrderStatus(order.id, COLUMNS[nextIndex].id);
                                        }
                                      }}
                                    >
                                      Siguiente <ChevronRight className="h-3 w-3 ml-1" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
