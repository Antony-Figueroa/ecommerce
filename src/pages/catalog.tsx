import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight, Grid, List, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ProductGrid } from "@/components/shop/product-grid"
import { ProductFilters } from "@/components/shop/product-filters"
import { api } from "@/lib/api"
import { formatUSD, formatBS, cn } from "@/lib/utils"
import type { Product, Category } from "@/types"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.5, ease: "easeOut" }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05
    }
  }
};

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
        // Optimizando carga paralela para eliminar waterfalls (async-parallel)
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

  // Evitar efectos innecesarios para estados derivados (rerender-derived-state-no-effect)
  useEffect(() => {
    if (slug) {
      setSelectedCategory(slug)
      window.scrollTo(0, 0)
    } else {
      setSelectedCategory(null)
    }
  }, [slug])

  const handleCategoryChange = useCallback((categorySlug: string | null) => {
    if (categorySlug) {
      navigate(`/productos/${categorySlug}`)
    } else {
      navigate('/productos')
    }
  }, [navigate])

  const handleClearFilters = useCallback(() => {
    handleCategoryChange(null)
    setSelectedBrands([])
    setPriceRange(null)
    setCurrentPage(1)
  }, [handleCategoryChange])

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
          p.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
      setSearchSuggestions(suggestions)
      setShowSuggestions(true)
    } else {
      setSearchSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchQuery, products])

  const brands = useMemo(() => {
    const b = new Set<string>()
    products.forEach(p => {
      if (p.brand) b.add(p.brand)
    })
    return Array.from(b).sort()
  }, [products])

  const priceStats = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 0 }
    const prices = products.map(p => p.price)
    return {
      min: Math.min(...prices),
      max: Math.max(...prices)
    }
  }, [products])

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = !selectedCategory || product.category?.slug === selectedCategory
      const matchesBrands = selectedBrands.length === 0 || (product.brand && selectedBrands.includes(product.brand))
      const matchesPrice = !priceRange || (product.price >= priceRange[0] && product.price <= priceRange[1])
      const matchesOffers = !offersOnly || product.isOffer

      return matchesSearch && matchesCategory && matchesBrands && matchesPrice && matchesOffers
    }).sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price
      if (sortBy === "price-high") return b.price - a.price
      if (sortBy === "newest") return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      return 0 // popular as default
    })
  }, [products, searchQuery, selectedCategory, selectedBrands, priceRange, sortBy, offersOnly])

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const activeFiltersCount = (selectedBrands.length > 0 ? 1 : 0) + (priceRange ? 1 : 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Grid className="h-10 w-10 text-primary" />
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center bg-[#F8FAFC]">
        <p className="text-destructive font-bold uppercase tracking-widest text-xs">Error: {error}</p>
        <Button onClick={() => window.location.reload()} className="mt-6 bg-slate-950 hover:bg-slate-800 text-white rounded-none font-black text-xs uppercase tracking-[0.2em] px-8 py-6">
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Dynamic Header - Vitality Zen Style */}
      <div className="bg-white border-b border-slate-100 py-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 rounded-full blur-3xl translate-x-1/4 -translate-y-1/4" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.nav 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-6"
          >
            <Link to="/" className="hover:text-primary transition-colors">Inicio</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-600">Productos</span>
          </motion.nav>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl font-bold tracking-tight text-slate-800 mb-4"
          >
            {offersOnly ? "Ofertas Vitales" : "Catálogo Puro"}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-slate-500 max-w-md font-medium text-lg"
          >
            Encuentra el equilibrio perfecto con nuestra selección premium de suplementos.
          </motion.p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
          {/* Sidebar Filters - Subtle Layering */}
          <motion.aside 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="hidden lg:block lg:w-72 flex-shrink-0"
          >
            <div className="sticky top-24 space-y-8">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
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
            </div>
          </motion.aside>

          <main className="flex-1">
            {/* Toolbar - Technical Feel */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-8 space-y-6"
            >
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex-1 relative max-w-md" ref={searchRef}>
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="search"
                    placeholder="Buscar productos..."
                    className="pl-11 h-12 bg-white border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all rounded-xl font-medium text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                  />
                  <AnimatePresence>
                    {showSuggestions && searchSuggestions.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl overflow-hidden"
                      >
                        {searchSuggestions.map((product) => (
                          <Link
                            key={product.id}
                            to={`/producto/${product.id}`}
                            className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-none"
                            onClick={() => setShowSuggestions(false)}
                          >
                            <div className="h-12 w-12 rounded-lg bg-slate-100 p-1">
                              <img 
                                src={product.image || "/placeholder.png"} 
                                alt={product.name} 
                                className="h-full w-full object-contain" 
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "https://placehold.co/100x100/f8fafc/6366f1?text=X";
                                  target.onerror = null;
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black uppercase truncate text-slate-900">{product.name}</p>
                              <p className="text-[10px] font-bold text-primary">${formatUSD(product.price)}</p>
                            </div>
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                    <Button
                      variant={viewMode === "default" ? "secondary" : "ghost"}
                      size="icon"
                      className={cn("h-10 w-10 rounded-lg shadow-none", viewMode === "default" && "bg-white shadow-sm")}
                      onClick={() => setViewMode("default")}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "secondary" : "ghost"}
                      size="icon"
                      className={cn("h-10 w-10 rounded-lg shadow-none", viewMode === "list" && "bg-white shadow-sm")}
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="h-8 w-[1px] bg-slate-200 hidden sm:block" />

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ordenar:</span>
                    <select
                      className="bg-transparent text-xs font-bold uppercase tracking-wider text-slate-700 focus:outline-none cursor-pointer"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="popular">Más Populares</option>
                      <option value="newest">Lo más nuevo</option>
                      <option value="price-low">Precio: Menor a Mayor</option>
                      <option value="price-high">Precio: Mayor a Menor</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Active Badges */}
              {(selectedCategory || selectedBrands.length > 0 || activeFiltersCount > 0) && (
                <div className="flex flex-wrap items-center gap-2">
                  <AnimatePresence>
                    {selectedCategory && (
                      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                        <Badge className="h-8 bg-white border border-slate-200 text-slate-900 px-3 rounded-lg gap-2 shadow-sm">
                          <span className="text-[10px] font-black uppercase tracking-widest">Cat: {categories.find((c) => c.slug === selectedCategory)?.name}</span>
                          <button className="hover:text-primary transition-colors" onClick={() => handleCategoryChange(null)}>×</button>
                        </Badge>
                      </motion.div>
                    )}
                    {selectedBrands.map((brand) => (
                      <motion.div key={brand} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
                        <Badge className="h-8 bg-white border border-slate-200 text-slate-900 px-3 rounded-lg gap-2 shadow-sm">
                          <span className="text-[10px] font-black uppercase tracking-widest">{brand}</span>
                          <button className="hover:text-primary transition-colors" onClick={() => setSelectedBrands(selectedBrands.filter((b) => b !== brand))}>×</button>
                        </Badge>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary"
                    onClick={handleClearFilters}
                  >
                    Clear All
                  </Button>
                </div>
              )}
            </motion.div>

            {/* Results Grid */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mb-6 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400"
            >
              <span>{filteredProducts.length} Results Found</span>
              <span>BCV: Bs {formatBS(bcvRate)}</span>
            </motion.div>

            <AnimatePresence mode="wait">
              {paginatedProducts.length > 0 ? (
                <motion.div 
                  key={currentPage + sortBy + selectedCategory + searchQuery}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={staggerContainer}
                >
                  <ProductGrid products={paginatedProducts} bcvRate={bcvRate} viewMode={viewMode} />

                  {totalPages > 1 && (
                    <motion.div variants={fadeInUp} className="flex items-center justify-center gap-2 mt-16">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] font-black uppercase tracking-widest h-10 px-4"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Prev
                      </Button>
                      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-100">
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                          let pageNum: number
                          if (totalPages <= 5) pageNum = i + 1
                          else if (currentPage <= 3) pageNum = i + 1
                          else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
                          else pageNum = currentPage - 2 + i
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "ghost"}
                              size="sm"
                              className={cn(
                                "h-8 w-8 rounded-lg text-[10px] font-black uppercase tracking-widest",
                                currentPage === pageNum ? "bg-slate-950 text-white shadow-lg shadow-slate-950/20" : "text-slate-400"
                              )}
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] font-black uppercase tracking-widest h-10 px-4"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-24 text-center bg-white rounded-2xl border border-slate-100"
                >
                  <Search className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">No products found</p>
                  <Button variant="link" className="text-primary font-black uppercase tracking-widest text-[10px] mt-2" onClick={handleClearFilters}>
                    Clear all filters
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  )
}
