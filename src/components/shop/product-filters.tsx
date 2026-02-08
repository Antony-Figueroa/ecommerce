import { useState, memo } from "react"
import { X, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { Category } from "@/types"

interface ProductFiltersProps {
  categories: Category[]
  brands: string[]
  selectedCategory: string | null
  selectedBrands: string[]
  priceRange: [number, number] | null
  priceStats: { min: number; max: number }
  onCategoryChange: (category: string | null) => void
  onBrandsChange: (brands: string[]) => void
  onPriceRangeChange: (range: [number, number] | null) => void
  onClearAll: () => void
}

// Optimizando re-renders con memo (rerender-memo)
export const ProductFilters = memo(function ProductFilters({
  categories,
  brands,
  selectedCategory,
  selectedBrands,
  priceRange,
  priceStats,
  onCategoryChange,
  onBrandsChange,
  onPriceRangeChange,
  onClearAll,
}: ProductFiltersProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const hasFilters =
    selectedCategory || selectedBrands.length > 0 || priceRange

  const filters = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold dark:text-foreground">Filtros</h3>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onClearAll} className="dark:text-muted-foreground hover:dark:text-primary">
            Limpiar todo
          </Button>
        )}
      </div>

      <Accordion type="multiple" defaultValue={["category", "brand", "price"]}>
        <AccordionItem value="category">
          <AccordionTrigger>Categoría</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedCategory === null}
                  onCheckedChange={(checked) =>
                    onCategoryChange(checked ? null : selectedCategory)
                  }
                />
                <span className="text-sm dark:text-muted-foreground">Todas las categorías</span>
              </label>
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedCategory === category.slug}
                    onCheckedChange={(checked) =>
                      onCategoryChange(
                        checked ? category.slug : null
                      )
                    }
                  />
                  <span className="text-sm dark:text-muted-foreground">{category.name}</span>
                </label>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="brand">
          <AccordionTrigger>Marca</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {brands.map((brand) => (
                <label
                  key={brand}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedBrands.includes(brand)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onBrandsChange([...selectedBrands, brand])
                      } else {
                        onBrandsChange(
                          selectedBrands.filter((b) => b !== brand)
                        )
                      }
                    }}
                  />
                  <span className="text-sm dark:text-muted-foreground">{brand}</span>
                </label>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="price">
          <AccordionTrigger>Precio (USD)</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={priceRange === null}
                  onCheckedChange={() => onPriceRangeChange(null)}
                />
                <span className="text-sm dark:text-muted-foreground">Todos los precios</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={priceRange !== null && priceRange[0] === 0 && priceRange[1] === 10}
                  onCheckedChange={(checked) =>
                    onPriceRangeChange(checked ? [0, 10] : null)
                  }
                />
                <span className="text-sm dark:text-muted-foreground">Menos de $10</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={priceRange !== null && priceRange[0] === 10 && priceRange[1] === 25}
                  onCheckedChange={(checked) =>
                    onPriceRangeChange(checked ? [10, 25] : null)
                  }
                />
                <span className="text-sm dark:text-muted-foreground">$10 - $25</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={priceRange !== null && priceRange[0] === 25 && priceRange[1] === 50}
                  onCheckedChange={(checked) =>
                    onPriceRangeChange(checked ? [25, 50] : null)
                  }
                />
                <span className="text-sm dark:text-muted-foreground">$25 - $50</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={priceRange !== null && priceRange[0] === 50}
                  onCheckedChange={(checked) =>
                    onPriceRangeChange(checked ? [50, priceStats.max * 2] : null)
                  }
                />
                <span className="text-sm dark:text-muted-foreground">Más de $50</span>
              </label>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )

  return (
    <>
      <div className="hidden lg:block">{filters}</div>

      <Button
        variant="outline"
        className="lg:hidden w-full"
        onClick={() => setIsMobileOpen(true)}
      >
        <SlidersHorizontal className="mr-2 h-4 w-4" />
        Filtros
      </Button>

      <div
        className={`fixed inset-0 z-50 bg-black/50 lg:hidden ${
          isMobileOpen ? "block" : "hidden"
        }`}
        onClick={() => setIsMobileOpen(false)}
      />

      <div
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-card p-6 shadow-xl transition-transform lg:hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold dark:text-foreground">Filtros</h2>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)} className="dark:text-muted-foreground">
            <X className="h-4 w-4" />
          </Button>
        </div>
        {filters}
      </div>
    </>
  )
})
