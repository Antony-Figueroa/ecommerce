import { useState, useEffect, useCallback, useRef } from "react"
import { api } from "@/lib/api"
import type { Product, Category } from "@/types"

interface UseProductsOptions {
  categoryId?: string | null
  categoryIds?: string[]
  search?: string
  isFeatured?: boolean
  isOffer?: boolean
  initialPage?: number
  initialLimit?: number
}

interface UseProductsReturn {
  products: Product[]
  categories: Category[]
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: {
    categoryId: string | null
    search: string
    brands: string[]
    selectedBrands: string[]
    priceRange: [number, number] | null
    sortBy: 'popular' | 'newest' | 'price-low' | 'price-high'
  }
  setFilters: (filters: Partial<UseProductsReturn['filters']>) => void
  setPage: (page: number) => void
  refetch: () => void
  brands: string[]
  priceStats: { min: number; max: number }
}

export function useProducts(options: UseProductsOptions = {}): UseProductsReturn {
  const {
    categoryId = null,
    categoryIds = [],
    search = '',
    isFeatured,
    isOffer,
    initialPage = 1,
    initialLimit = 12
  } = options

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 0
  })

  const [filters, setFiltersState] = useState({
    categoryId: categoryId,
    search: search,
    brands: [] as string[],
    selectedBrands: [] as string[],
    priceRange: null as [number, number] | null,
    sortBy: 'newest' as 'popular' | 'newest' | 'price-low' | 'price-high'
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const fetchProducts = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      setLoading(true)
      const result = await api.getPublicProducts({
        categoryId: filters.categoryId || undefined,
        categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
        search: filters.search || undefined,
        page: pagination.page,
        limit: pagination.limit,
        isFeatured,
        isOffer,
        brand: filters.selectedBrands.length === 1 ? filters.selectedBrands[0] : undefined,
        minPrice: filters.priceRange?.[0],
        maxPrice: filters.priceRange?.[1],
        sortBy: filters.sortBy
      })

      setProducts(result.products || [])
      const paginationData = result.pagination
      if (paginationData) {
        setPagination(prev => ({
          ...prev,
          total: paginationData.total,
          totalPages: paginationData.totalPages
        }))
      }

      const allBrands = new Set<string>()
      result.products.forEach((p: any) => {
        if (p.brand) allBrands.add(p.brand)
      })
      
      setFiltersState(prev => ({
        ...prev,
        brands: Array.from(allBrands).sort()
      }))

      setError(null)
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError(err instanceof Error ? err.message : 'Error al cargar productos')
      }
    } finally {
      setLoading(false)
    }
  }, [filters, pagination.page, pagination.limit, categoryIds, isFeatured, isOffer])

  const fetchCategories = useCallback(async () => {
    try {
      const result = await api.getCategories()
      setCategories(result.categories || [])
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      fetchProducts()
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [fetchProducts])

  const setFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }, [])

  const priceStats = {
    min: products.length > 0 ? Math.min(...products.map(p => p.price)) : 0,
    max: products.length > 0 ? Math.max(...products.map(p => p.price)) : 0
  }

  return {
    products,
    categories,
    loading,
    error,
    pagination,
    filters,
    setFilters,
    setPage,
    refetch: fetchProducts,
    brands: filters.brands,
    priceStats
  }
}
