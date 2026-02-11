import * as React from "react"
import { Link } from "react-router-dom"
import { useFavorites } from "@/contexts/favorites-context"
import { ProductCard } from "@/components/shop/product-card"
import { ShoppingBag, HeartOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"

export function FavoritesPage() {
  const { favorites, isLoading } = useFavorites()
  const [bcvRate, setBcvRate] = React.useState(42.50)

  React.useEffect(() => {
    async function loadBCV() {
      try {
        const bcvRes = await api.getBCVRate()
        setBcvRate(bcvRes.rate || 42.50)
      } catch (err) {
        console.warn("Error fetching BCV rate, using fallback:", err)
      }
    }
    loadBCV()
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mis Favoritos</h1>
        <p className="text-muted-foreground">
          {favorites.length === 1 
            ? "Tienes 1 producto guardado" 
            : `Tienes ${favorites.length} productos guardados`}
        </p>
      </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-6 text-primary">
              <HeartOff className="h-12 w-12" />
            </div>
            <h2 className="mb-2 text-2xl font-bold">Tu lista de favoritos está vacía</h2>
            <p className="mb-8 max-w-md text-muted-foreground">
              Guarda los productos que más te gusten para tenerlos siempre a mano.
            </p>
            <Button asChild>
              <Link to="/productos" className="gap-2">
                <ShoppingBag className="h-4 w-4" />
                Explorar productos
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {favorites.map((product) => (
              <ProductCard key={product.id} product={product} bcvRate={bcvRate} />
            ))}
          </div>
        )}
    </div>
  )
}
