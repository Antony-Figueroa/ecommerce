import { ProductCard, ProductCardSkeleton } from "./product-card"
import type { Product } from "@/types"

interface ProductGridProps {
  products: Product[]
  bcvRate: number
  isLoading?: boolean
  viewMode?: "default" | "list"
}

export function ProductGrid({ products, bcvRate, isLoading, viewMode = "default" }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-semibold">No se encontraron productos</h3>
        <p className="text-sm text-muted-foreground">
          Intenta con otros filtros o categorías
        </p>
      </div>
    )
  }

  return (
    <div className={viewMode === "list" ? "space-y-4" : "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} bcvRate={bcvRate} variant={viewMode} />
      ))}
    </div>
  )
}
