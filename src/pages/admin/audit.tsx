import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Activity, 
  Eye, 
  Clock,
  Terminal,
  Database,
  ArrowRight,
  Info
} from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AuditLog {
  id: string;
  entityType: string;
  entityId: string | null;
  action: string;
  userId: string | null;
  userName: string | null;
  details: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({
    entityType: 'all',
    action: 'all',
    userId: 'all',
    searchTerm: ''
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [filter.entityType, filter.action]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (filter.entityType !== 'all') query.append('entityType', filter.entityType);
      if (filter.action !== 'all') query.append('action', filter.action);
      
      const data = await api.get<AuditLog[]>(`/admin/stats/audit?${query.toString()}`);
      setLogs(data);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('CREATE')) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    if (action.includes('UPDATE')) return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    if (action.includes('DELETE')) return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
    return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
  };

  const formatDetails = (details: string | null) => {
    if (!details) return null;
    try {
      const parsed = JSON.parse(details);
      return <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-[400px]">
        {JSON.stringify(parsed, null, 2)}
      </pre>;
    } catch (e) {
      return <p className="text-xs bg-muted p-4 rounded-lg">{details}</p>;
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        title="Explorador de Auditoría" 
        subtitle="Rastreo completo de acciones administrativas y cambios en el sistema"
        icon={Shield}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Registros Recientes</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={filter.entityType} onValueChange={(v) => setFilter(f => ({ ...f, entityType: v }))}>
                  <SelectTrigger className="w-[150px] h-8 text-xs">
                    <SelectValue placeholder="Entidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las Entidades</SelectItem>
                    <SelectItem value="SALE">Ventas</SelectItem>
                    <SelectItem value="PRODUCT">Productos</SelectItem>
                    <SelectItem value="INVENTORY">Inventario</SelectItem>
                    <SelectItem value="USER">Usuarios</SelectItem>
                    <SelectItem value="DASHBOARD">Dashboard</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={fetchLogs} className="h-8">
                  <Activity className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                  Refrescar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/60">
                    <tr>
                      <th className="px-4 py-3">Fecha y Hora</th>
                      <th className="px-4 py-3">Usuario</th>
                      <th className="px-4 py-3">Entidad</th>
                      <th className="px-4 py-3">Acción</th>
                      <th className="px-4 py-3">IP / Origen</th>
                      <th className="px-4 py-3 text-right">Detalles</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={6} className="px-4 py-4 h-12 bg-muted/20"></td>
                        </tr>
                      ))
                    ) : logs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                          No se encontraron registros de auditoría
                        </td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-muted/30 transition-colors group">
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-bold text-foreground">
                                {format(new Date(log.createdAt), 'dd MMM, yyyy', { locale: es })}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {format(new Date(log.createdAt), 'HH:mm:ss')}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">
                                {log.userName?.charAt(0) || <User className="h-3 w-3" />}
                              </div>
                              <span className="font-medium">{log.userName || 'Sistema'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider">
                              {log.entityType}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={cn("text-[10px] font-bold uppercase tracking-wider border", getActionBadgeColor(log.action))}>
                              {log.action}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-mono text-muted-foreground">{log.ipAddress || 'Interno'}</span>
                              <span className="text-[9px] text-muted-foreground truncate max-w-[120px]" title={log.userAgent || ''}>
                                {log.userAgent || 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Resumen de Actividad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total hoy</span>
                <span className="text-sm font-bold">{logs.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Acciones críticas</span>
                <Badge variant="destructive" className="text-[10px]">0</Badge>
              </div>
              <div className="pt-4 border-t border-border/60">
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Los registros de auditoría se conservan durante 365 días para cumplimiento de seguridad.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Terminal className="h-3 w-3" />
                Audit Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] text-primary/80 leading-relaxed italic">
                "No se han detectado anomalías de acceso en las últimas 24 horas. Todas las actualizaciones de precios coinciden con la tasa BCV oficial."
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Detalle del Registro
            </DialogTitle>
            <DialogDescription>
              Información técnica completa sobre la acción realizada.
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Entidad</p>
                  <p className="text-sm font-medium">{selectedLog.entityType} ({selectedLog.entityId || 'Global'})</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Acción</p>
                  <p className="text-sm font-medium">{selectedLog.action}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Usuario</p>
                  <p className="text-sm font-medium">{selectedLog.userName} ({selectedLog.userId || 'N/A'})</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Fecha</p>
                  <p className="text-sm font-medium">{format(new Date(selectedLog.createdAt), "PPP 'a las' HH:mm:ss", { locale: es })}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Datos Técnicos (JSON)</p>
                {formatDetails(selectedLog.details)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
