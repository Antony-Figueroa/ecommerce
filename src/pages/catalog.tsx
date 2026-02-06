import { useState, useEffect, useMemo, useRef } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { ChevronRight, Grid, List, Search, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ProductGrid } from "@/components/shop/product-grid"
import { ProductFilters } from "@/components/shop/product-filters"
import { api } from "@/lib/api"
import { formatUSD, formatBS } from "@/lib/utils"
import type { Product, Category } from "@/types"

const ITEMS_PER_PAGE = 12

interface CatalogPageProps {
  offersOnly?: boolean
}

export function CatalogPage({ offersOnly = false }: CatalogPageProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null)
  const [sortBy, setSortBy] = useState("popular")
  const [viewMode, setViewMode] = useState<"default" | "list">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("catalogViewMode") as "default" | "list") || "default"
    }
    return "default"
  })

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [bcvRate, setBcvRate] = useState(42.50)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [searchSuggestions, setSearchSuggestions] = useState<Product[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("catalogViewMode", viewMode)
    }
  }, [viewMode])

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [productsRes, categoriesRes, bcvRes] = await Promise.all([
          api.getPublicProducts(),
          api.getCategories(),
          api.getBCVRate().catch((err) => {
            console.warn("Error fetching BCV rate, using fallback:", err)
            return { rate: 42.50 }
          }),
        ])
        setProducts(productsRes.products || [])
        setCategories(categoriesRes.categories || [])
        setBcvRate(bcvRes.rate || 42.50)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar productos")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const { slug } = useParams<{ slug?: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    if (slug) {
      setSelectedCategory(slug)
      window.scrollTo(0, 0)
    } else {
      setSelectedCategory(null)
    }
  }, [slug])

  const handleCategoryChange = (categorySlug: string | null) => {
    if (categorySlug) {
      navigate(`/productos/${categorySlug}`)
    } else {
      navigate('/productos')
    }
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const suggestions = products
        .filter(p =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
      setSearchSuggestions(suggestions)
      setShowSuggestions(true)
    } else {
      setSearchSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchQuery, products])

  const filteredProducts = useMemo(() => {
    let result = [...products]

    if (offersOnly) {
      result = result.filter(p => p.isOffer)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.brand.toLowerCase().includes(query)
      )
    }

    if (selectedCategory) {
      const cat = categories.find(c => c.slug === selectedCategory)
      if (cat) {
        result = result.filter((p) => p.categoryId === cat.id)
      }
    }

    if (selectedBrands.length > 0) {
      result = result.filter((p) => selectedBrands.includes(p.brand))
    }

    if (priceRange) {
      result = result.filter(
        (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
      )
    }

    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price)
        break
      case "price-high":
        result.sort((a, b) => b.price - a.price)
        break
      case "newest":
        result.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
        break
      default:
        if (result.some(p => p.isFeatured)) {
          result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0))
        }
    }

    return result
  }, [products, categories, searchQuery, selectedCategory, selectedBrands, priceRange, sortBy, offersOnly])

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredProducts, currentPage])

  const brands = useMemo(() => {
    return [...new Set(products.map(p => p.brand))].sort()
  }, [products])

  const priceStats = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 100 }
    const prices = products.map(p => p.price)
    return { min: Math.min(...prices), max: Math.max(...prices) }
  }, [products])

  const handleClearFilters = () => {
    handleCategoryChange(null)
    setSelectedBrands([])
    setPriceRange(null)
    setCurrentPage(1)
  }

  const activeFiltersCount =
    (selectedCategory ? 1 : 0) +
    selectedBrands.length +
    (priceRange ? 1 : 0)

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="h-96 bg-muted animate-pulse rounded-lg" />
          </div>
          <div className="lg:col-span-3 space-y-4">
            <div className="h-8 bg-muted animate-pulse rounded w-1/3" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-destructive">Error: {error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary">
            Inicio
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-foreground">Productos</span>
        </nav>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <aside className="hidden lg:block lg:w-64 flex-shrink-0">
          <div className="sticky top-24">
            <ProductFilters
              categories={categories}
              brands={brands}
              selectedCategory={selectedCategory}
              selectedBrands={selectedBrands}
              priceRange={priceRange}
              priceStats={priceStats}
              onCategoryChange={handleCategoryChange}
              onBrandsChange={setSelectedBrands}
              onPriceRangeChange={setPriceRange}
              onClearAll={handleClearFilters}
            />
          </div>
        </aside>

        <main className="flex-1">
          <div className="mb-6 space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div ref={searchRef} className="relative">
                <h1 className="text-2xl font-bold mb-1 lg:mb-0">
                  {offersOnly ? "Ofertas Especiales" : "Todos los productos"}
                </h1>
                <p className="text-sm text-muted-foreground lg:hidden">
                  {filteredProducts.length} productos encontrados
                </p>
                <div className="relative mt-2 lg:hidden">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar productos..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="hidden lg:flex items-center gap-2">
                <div className="relative w-64" ref={searchRef}>
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar productos..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                  />
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg">
                      {searchSuggestions.map((product) => (
                        <Link
                          key={product.id}
                          to={`/producto/${product.id}`}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-muted"
                          onClick={() => setShowSuggestions(false)}
                        >
                          <img 
                            src={product.image || "/placeholder.png"} 
                            alt={product.name} 
                            className="h-8 w-8 object-cover rounded" 
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://placehold.co/100x100/f8fafc/6366f1?text=X";
                              target.onerror = null;
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground">${formatUSD(product.price)}</p>
                          </div>
                        </Link>
                      ))}
                      <Link
                        to={`/productos?search=${encodeURIComponent(searchQuery)}`}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-muted border-t"
                        onClick={() => setShowSuggestions(false)}
                      >
                        <Clock className="h-4 w-4" />
                        Ver todos los resultados para "{searchQuery}"
                      </Link>
                    </div>
                  )}
                </div>
                <div className="flex items-center border rounded-md">
                  <Button
                    variant={viewMode === "default" ? "secondary" : "ghost"}
                    size="icon"
                    className="rounded-r-none"
                    onClick={() => setViewMode("default")}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="icon"
                    className="rounded-l-none"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex flex-wrap items-center gap-2">
              {selectedCategory && (
                <Badge variant="secondary" className="gap-1">
                  {categories.find((c) => c.slug === selectedCategory)?.name}
                  <button
                    className="ml-1 hover:text-destructive"
                    onClick={() => handleCategoryChange(null)}
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedBrands.map((brand) => (
                <Badge key={brand} variant="secondary" className="gap-1">
                  {brand}
                  <button
                    className="ml-1 hover:text-destructive"
                    onClick={() =>
                      setSelectedBrands(selectedBrands.filter((b) => b !== brand))
                    }
                  >
                    ×
                  </button>
                </Badge>
              ))}
              {activeFiltersCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={handleClearFilters}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>

            <div className="hidden lg:flex items-center justify-between border-y py-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border-none bg-transparent font-medium focus:ring-0 cursor-pointer"
                >
                  <option value="popular">Más populares</option>
                  <option value="price-low">Precio: menor a mayor</option>
                  <option value="price-high">Precio: mayor a menor</option>
                  <option value="newest">Más recientes</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {filteredProducts.length} productos
                </span>
                <span className="text-sm text-muted-foreground">
                  Tasa BCV: Bs {formatBS(bcvRate)}
                </span>
              </div>
            </div>
          </div>

          {paginatedProducts.length > 0 ? (
            <>
              <ProductGrid products={paginatedProducts} bcvRate={bcvRate} viewMode={viewMode} />

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    let pageNum: number
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        className="w-10"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No se encontraron productos</h2>
              <p className="text-muted-foreground mb-6">Intenta con otros filtros o términos de búsqueda.</p>
              <Button onClick={handleClearFilters}>Limpiar filtros</Button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
