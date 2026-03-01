import { memo } from "react"
import { InventoryItem } from "@/hooks/use-inventory"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertTriangle, TrendingDown, ArrowUp, Package } from "lucide-react"

interface InventoryTableRowProps {
  item: InventoryItem
  isSelected: boolean
  onToggleSelect: (id: string) => void
  onAdjust: (item: InventoryItem) => void
  getStockIndicatorColor: (current: number, max: number) => string
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
}

function InventoryTableRowComponent({ 
  item, 
  isSelected, 
  onToggleSelect, 
  onAdjust,
  getStockIndicatorColor 
}: InventoryTableRowProps) {
  const getStatusConfig = (status: string) => {
    const statusMap: Record<string, { label: string; class: string; icon: any }> = {
      normal: { label: "Óptimo", class: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: CheckCircle2 },
      low: { label: "Alerta Baja", class: "bg-amber-50 text-amber-600 border-amber-100", icon: AlertTriangle },
      critical: { label: "Crítico", class: "bg-rose-50 text-rose-600 border-rose-100", icon: TrendingDown },
      overstock: { label: "Excedente", class: "bg-sky-50 text-sky-600 border-sky-100", icon: ArrowUp },
    }
    return statusMap[status] || { label: status, class: "bg-slate-50 text-slate-600 border-slate-100", icon: Package }
  }

  const statusConfig = getStatusConfig(item.status)
  const StatusIcon = statusConfig.icon

  return (
    <motion.tr
      variants={itemVariants}
      className={cn(
        "hover:bg-muted/30 transition-colors group",
        isSelected && "bg-primary/5"
      )}
    >
      <td className="p-5">
        <input 
          type="checkbox" 
          checked={isSelected}
          onChange={() => onToggleSelect(item.id)}
          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        />
      </td>
      <td className="p-5">
        <p className="font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">{item.productName}</p>
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5">{item.sku}</p>
      </td>
      <td className="p-5">
        <Badge variant="outline" className="rounded-full border-slate-100 font-bold text-[9px] uppercase tracking-widest bg-slate-50/50 text-slate-500">
          {item.category}
        </Badge>
      </td>
      <td className="p-5">
        <div className="space-y-2 w-48">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
            <span className="text-slate-700">{item.currentStock} uds.</span>
            <span className="text-slate-400">Máx: {item.maxStock}</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={item.currentStock} aria-valuemin={0} aria-valuemax={item.maxStock}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (item.currentStock / item.maxStock) * 100)}%` }}
              className={cn("h-full rounded-full", getStockIndicatorColor(item.currentStock, item.maxStock))}
            />
          </div>
        </div>
      </td>
      <td className="p-5">
        <Badge className={cn("border font-bold text-[9px] uppercase tracking-widest gap-1", statusConfig.class)}>
          <StatusIcon className="h-3 w-3" />
          {statusConfig.label}
        </Badge>
      </td>
      <td className="p-5 text-right">
        <p className="font-bold text-foreground">
          ${(item.currentStock * item.unitCost).toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-[10px] text-muted-foreground">${item.unitCost.toFixed(2)} c/u</p>
      </td>
      <td className="p-5 text-center">
        <button
          onClick={() => onAdjust(item)}
          className="inline-flex items-center justify-center p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          aria-label={`Ajustar stock de ${item.productName}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
          </svg>
        </button>
      </td>
    </motion.tr>
  )
}

export const InventoryTableRow = memo(InventoryTableRowComponent, (prev, next) => {
  return (
    prev.item.id === next.item.id &&
    prev.item.currentStock === next.item.currentStock &&
    prev.item.status === next.item.status &&
    prev.isSelected === next.isSelected
  )
})

interface InventoryKPICardProps {
  label: string
  value: string | number
  color: "emerald" | "blue" | "amber" | "rose" | "violet" | "slate"
  icon: React.ReactNode
  progress?: number
}

const colorMap = {
  emerald: { bg: "from-emerald-50 to-emerald-100/50", text: "text-emerald-700", bar: "bg-emerald-500", icon: "text-emerald-600" },
  blue: { bg: "from-blue-50 to-blue-100/50", text: "text-blue-700", bar: "bg-blue-500", icon: "text-blue-600" },
  amber: { bg: "from-amber-50 to-amber-100/50", text: "text-amber-700", bar: "bg-amber-500", icon: "text-amber-600" },
  rose: { bg: "from-rose-50 to-rose-100/50", text: "text-rose-700", bar: "bg-rose-500", icon: "text-rose-600" },
  violet: { bg: "from-violet-50 to-violet-100/50", text: "text-violet-700", bar: "bg-violet-500", icon: "text-violet-600" },
  slate: { bg: "from-slate-50 to-slate-100/50", text: "text-slate-700", bar: "bg-slate-500", icon: "text-slate-600" },
}

export const InventoryKPICard = memo(function InventoryKPICard({ label, value, color, icon, progress }: InventoryKPICardProps) {
  const colors = colorMap[color]
  
  return (
    <div className={cn(
      "border-0 shadow-sm bg-gradient-to-br overflow-hidden rounded-2xl",
      colors.bg
    )}>
      <div className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className={cn("text-[10px] font-bold uppercase tracking-widest", colors.text, "opacity/70")}>{label}</p>
            <p className={cn("text-2xl font-bold", colors.text)}>{value}</p>
          </div>
          <div className={cn("p-2.5 rounded-xl", colors.icon, "bg-white/50")}>
            {icon}
          </div>
        </div>
        {progress !== undefined && (
          <div className="mt-2 h-1.5 bg-black/5 rounded-full overflow-hidden">
            <div 
              className={cn("h-full rounded-full", colors.bar)} 
              style={{ width: `${Math.min(100, progress)}%` }} 
            />
          </div>
        )}
      </div>
    </div>
  )
})

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
}

export const StatCard = memo(function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="border border-border/60 shadow-sm bg-white dark:bg-card overflow-hidden group hover:shadow-md transition-all rounded-2xl">
      <div className="p-5">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-muted rounded-xl group-hover:bg-primary/10 transition-colors">
            {icon}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className="text-xl font-bold text-foreground tracking-tight">{value}</p>
          </div>
        </div>
      </div>
    </div>
  )
})
