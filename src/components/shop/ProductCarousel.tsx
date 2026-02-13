import { useState, useRef, useEffect, memo } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductCard } from "./product-card"
import { Link } from "react-router-dom"
import type { Product } from "@/types"

interface ProductCarouselProps {
  products: Product[]
  bcvRate: number
  title: string
  subtitle?: string
}

export const ProductCarousel = memo(function ProductCarousel({ 
  products, 
  bcvRate, 
  title, 
  subtitle 
}: ProductCarouselProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current
      setCanScrollLeft(scrollLeft > 10)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener("scroll", checkScroll)
      checkScroll()
      return () => container.removeEventListener("scroll", checkScroll)
    }
  }, [products])

  const scroll = (direction: "left" | "right") => {
    if (containerRef.current) {
      const scrollAmount = containerRef.current.clientWidth * 0.8
      containerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      })
    }
  }

  if (!products || products.length === 0) {
    return (
      <section className="py-16 bg-slate-50/50 dark:bg-slate-900/20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground italic">No hay productos destacados disponibles en este momento.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 overflow-hidden bg-slate-50/50 dark:bg-slate-900/20">
      <div className="container mx-auto px-4">
        {/* Header con Controles */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-primary rounded-full" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">
                Destacados
              </span>
            </div>
            <h2 className="text-4xl font-black tracking-tight text-slate-800 dark:text-foreground">
              {title}
            </h2>
            {subtitle && (
              <p className="text-slate-500 dark:text-muted-foreground font-medium text-lg">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 h-12 w-12 hover:border-primary hover:text-primary transition-all disabled:opacity-30"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="rounded-2xl border-2 border-slate-200 dark:border-slate-800 h-12 w-12 hover:border-primary hover:text-primary transition-all disabled:opacity-30"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-2 hidden md:block" />
            <Button 
              variant="ghost" 
              className="hidden md:flex items-center gap-2 font-black uppercase tracking-widest text-xs hover:text-primary group"
              asChild
            >
              <Link to="/productos">
                Ver Todo
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Carousel Container */}
        <div className="relative group">
          {/* Sombras de desvanecimiento laterales */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-slate-50/50 dark:from-slate-900/20 to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-slate-50/50 dark:from-slate-900/20 to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />

          <div
            ref={containerRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-8 -mx-4 px-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {products.map((product) => (
              <div 
                key={product.id} 
                className="min-w-[280px] sm:min-w-[320px] md:min-w-[350px] snap-start"
              >
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <ProductCard product={product} bcvRate={bcvRate} />
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
})
