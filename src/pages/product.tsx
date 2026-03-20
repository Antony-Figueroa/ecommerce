import { useParams, Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import { ProductDetail } from "@/components/product/product-detail"
import { api } from "@/lib/api"
import type { Product } from "@/types"
import { useState, useEffect } from "react"

export function ProductPage() {
  const { id } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProduct() {
      if (!id) {
        setError("ID de producto no válido")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const productRes = await api.getProduct(id)
        setProduct(productRes.product)

        const relatedRes = await api.getRelatedProducts(id, 4)
        setRelatedProducts(relatedRes.products || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar producto")
      } finally {
        setLoading(false)
      }
    }
    loadProduct()
  }, [id])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mx-auto mb-4"></div>
          <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Producto no encontrado</h1>
        <p className="text-muted-foreground mb-6">
          {error || "El producto que buscas no existe o ha sido eliminado."}
        </p>
        <Link
          to="/productos"
          className="inline-flex items-center text-primary hover:underline"
        >
          <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
          Volver a productos
        </Link>
      </div>
    )
  }

  return (
    <>
      <ProductDetail product={product} relatedProducts={relatedProducts} />
    </>
  )
}
