import { Minus, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { formatUSD } from "@/lib/utils"
import type { CartItem } from "@/types"

interface CartItemProps {
  item: CartItem
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemove: (productId: string) => void
}

export function Cart({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div className="flex gap-4 py-4">
        <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
          <img
            src={item.product.image || "/placeholder.png"}
            alt={item.product.name}
            className="h-full w-full object-cover"
          />
        </div>

      <div className="flex flex-1 flex-col">
        <div className="flex justify-between">
          <div>
            <h3 className="font-medium">{item.product.name}</h3>
            <p className="text-sm text-muted-foreground">{item.product.brand}</p>
            <p className="text-sm text-muted-foreground">
              {item.product.format} • {item.product.weight}
            </p>
          </div>
          <p className="font-semibold">
            ${formatUSD(Number(item.product.price) * item.quantity)}
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() =>
                onUpdateQuantity(item.product.id, item.quantity - 1)
              }
              disabled={item.quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <Input
              type="number"
              value={item.quantity}
              onChange={(e) =>
                onUpdateQuantity(
                  item.product.id,
                  parseInt(e.target.value) || 1
                )
              }
              className="h-8 w-16 text-center"
              min={1}
              max={item.product.stock}
            />
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() =>
                onUpdateQuantity(item.product.id, item.quantity + 1)
              }
              disabled={item.quantity >= item.product.stock}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(item.product.id)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  )
}

interface CartSummaryProps {
  subtotal: number
  shipping?: number
  discount?: number
  total: number
  itemCount: number
}

export function CartSummary({
  subtotal,
  shipping = 0,
  discount = 0,
  total,
  itemCount,
}: CartSummaryProps) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold mb-4">Resumen del pedido</h2>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal ({itemCount} productos)</span>
          <span>${formatUSD(subtotal)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Envío estimado</span>
          <span>{shipping === 0 ? "Gratis" : `$${formatUSD(shipping)}`}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Descuento</span>
            <span>-${formatUSD(discount)}</span>
          </div>
        )}

        <Separator />

        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>${formatUSD(total)}</span>
        </div>
      </div>

      <Button className="w-full mt-6" size="lg">
        Proceder al pago
      </Button>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Los impuestos se calcularán en el checkout
      </p>
    </div>
  )
}
