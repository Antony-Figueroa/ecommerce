import { ShoppingBag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { Cart } from "./cart-item"
import { useCart } from "@/contexts/cart-context"
import { Link } from "react-router-dom"
import { formatUSD } from "@/lib/utils"

export function CartDrawer() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem } = useCart()

  const shipping = totalPrice >= 500 ? 0 : 29.99

  return (
    <Sheet>
      <Button variant="outline" size="sm" className="gap-2">
        <ShoppingBag className="h-4 w-4" />
        <span className="hidden sm:inline">Carrito</span>
        {totalItems > 0 && (
          <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs text-white">
            {totalItems}
          </span>
        )}
      </Button>

      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader className="flex flex-row items-center justify-between pr-6">
          <SheetTitle className="flex items-center gap-2">
            Carrito de compras
            {totalItems > 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-sm text-muted-foreground">
                {totalItems}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <div className="rounded-full bg-muted p-6">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold">Tu carrito está vacío</h3>
              <p className="text-sm text-muted-foreground">
                Añade productos para continuar
              </p>
            </div>
            <Button asChild>
              <Link to="/productos">Ver productos</Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-4">
                {items.map((item) => (
                  <Cart
                    key={item.product.id}
                    item={item}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeItem}
                  />
                ))}
              </div>
            </ScrollArea>

            <div className="border-t pt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${formatUSD(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Envío</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="text-green-600">Gratis</span>
                    ) : (
                      `$${formatUSD(shipping)}`
                    )}
                  </span>
                </div>
                {totalPrice < 500 && (
                  <p className="text-xs text-muted-foreground">
                    Envío gratis en pedidos mayores a $500
                  </p>
                )}
              </div>

              <Separator />

              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>${formatUSD(totalPrice + shipping)}</span>
              </div>

              <SheetFooter className="flex-col gap-2 sm:flex-col">
                <Button className="w-full" size="lg" asChild>
                  <Link to="/checkout">Proceder al pago</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/carrito">Ver carrito completo</Link>
                </Button>
              </SheetFooter>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
