import { memo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { InventoryItem } from "@/hooks/use-inventory"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Plus, Minus, FileSpreadsheet, Package } from "lucide-react"

interface AdjustStockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: InventoryItem | null
  onSuccess: () => void
}

export const AdjustStockDialog = memo(function AdjustStockDialog({ 
  open, 
  onOpenChange, 
  item, 
  onSuccess 
}: AdjustStockDialogProps) {
  const { toast } = useToast()
  const [adjustmentType, setAdjustmentType] = useState<"entry" | "exit" | "adjustment">("entry")
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!item || !quantity) return
    setLoading(true)
    try {
      const qty = parseInt(quantity)
      let newStock = item.currentStock
      
      if (adjustmentType === "entry") newStock = item.currentStock + qty
      else if (adjustmentType === "exit") newStock = Math.max(0, item.currentStock - qty)
      else newStock = qty

      await api.updateProductStock(item.id, newStock)
      toast({ title: "Stock actualizado", description: `${item.productName}: ${item.currentStock} → ${newStock}` })
      onSuccess()
      onOpenChange(false)
      setQuantity("")
      setReason("")
    } catch (error) {
      toast({ title: "Error", description: "No se pudo actualizar el stock", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustar Stock</DialogTitle>
          <DialogDescription>
            {item?.productName} (Stock actual: {item?.currentStock})
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            {[
              { value: "entry", label: "Entrada (+)", icon: Plus, color: "bg-emerald-50 text-emerald-600" },
              { value: "exit", label: "Salida (-)", icon: Minus, color: "bg-rose-50 text-rose-600" },
              { value: "adjustment", label: "Fijar", icon: FileSpreadsheet, color: "bg-blue-50 text-blue-600" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setAdjustmentType(opt.value as any)}
                className={`flex-1 py-2 px-3 rounded-lg border text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  adjustmentType === opt.value 
                    ? opt.color + " ring-2 ring-offset-1 ring-primary/30 border-transparent"
                    : "bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300"
                }`}
              >
                <opt.icon className="h-4 w-4" />
                {opt.label}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold">Cantidad</label>
            <Input
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={adjustmentType === "adjustment" ? "Stock final" : "Cantidad"}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold">Motivo</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Razón del ajuste..."
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading || !quantity}>
            {loading ? "Guardando..." : "Aplicar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})

interface BulkActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCount: number
  onApply: (action: string, quantity: number, reason: string) => Promise<void>
}

export const BulkActionDialog = memo(function BulkActionDialog({
  open,
  onOpenChange,
  selectedCount,
  onApply
}: BulkActionDialogProps) {
  const { toast } = useToast()
  const [action, setAction] = useState<"entry" | "exit" | "adjust">("entry")
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)

  const handleApply = async () => {
    if (!quantity) return
    setLoading(true)
    try {
      await onApply(action, parseInt(quantity), reason)
      onOpenChange(false)
      setQuantity("")
      setReason("")
    } catch (error) {
      toast({ title: "Error", description: "Error al aplicar ajuste masivo", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Ajuste Masivo de Stock
          </DialogTitle>
          <DialogDescription>
            Actualizar stock de {selectedCount} productos seleccionados.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-bold">Tipo de Ajuste</label>
            <div className="flex gap-2">
              {[
                { value: "entry", label: "Entrada (+)", color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
                { value: "exit", label: "Salida (-)", color: "bg-rose-50 text-rose-600 border-rose-200" },
                { value: "adjust", label: "Fijar Stock", color: "bg-blue-50 text-blue-600 border-blue-200" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setAction(opt.value as any)}
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm font-bold transition-all ${
                    action === opt.value 
                      ? opt.color + " ring-2 ring-offset-1 ring-primary/30" 
                      : "bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold">Cantidad</label>
            <Input 
              type="number" 
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={action === "adjust" ? "Stock final" : "Cantidad a agregar/quitar"}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold">Motivo (opcional)</label>
            <Textarea 
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Razón del ajuste..."
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleApply} disabled={loading || !quantity}>
            {loading ? "Procesando..." : `Aplicar a ${selectedCount} productos`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})
