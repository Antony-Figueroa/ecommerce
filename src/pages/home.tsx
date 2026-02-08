import { useState, useEffect, useMemo, memo } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, Shield, Phone, Loader2, Zap, Award, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ProductCard } from "@/components/shop/product-card"
import { CategoryIconCard } from "@/components/shop/category-card"
import { Hero, FeatureBanner } from "@/components/shared/hero"
import { Newsletter } from "@/components/shared/newsletter"
import { api } from "@/lib/api"
import type { Product, Category } from "@/types"

// Animaciones consistentes con el sistema de diseño "Zen Flow"
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, ease: "easeOut" }
};

// Componente de sección optimizado
const SectionHeader = memo(({ title, subtitle, highlight, badge, action }: { 
  title: string, 
  subtitle: string, 
  highlight?: string,
  badge?: string,
  action?: { label: string, href: string }
}) => (
  <motion.div variants={fadeInUp} className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
    <div className="space-y-3">
      {badge && (
        <Badge className="bg-primary/10 text-primary border-primary/20 font-bold tracking-wider text-[10px] uppercase mb-2 px-3 py-1 rounded-full">
          {badge}
        </Badge>
      )}
      <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-800 leading-tight">
        {title} <span className="text-primary font-serif italic">{highlight}</span>
      </h2>
      <p className="text-slate-500 font-medium text-lg max-w-2xl leading-relaxed">
        {subtitle}
      </p>
    </div>
    {action && (
      <Button variant="outline" className="rounded-2xl border-slate-200 bg-white text-slate-600 font-bold uppercase tracking-wider hover:border-primary hover:text-primary transition-all group h-14 px-8 self-start md:self-end shadow-sm" asChild>
        <Link to={action.href}>
          {action.label}
          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </Button>
    )}
  </motion.div>
));

SectionHeader.displayName = "SectionHeader";

export function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [offerProducts, setOfferProducts] = useState<Product[]>([])
  const [bcvRate, setBcvRate] = useState(42.50)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [categoriesRes, productsRes, bcvRes] = await Promise.all([
          api.getCategories(),
          api.getPublicProducts(),
          api.getBCVRate().catch((err) => {
            console.warn("Error fetching BCV rate, using fallback:", err)
            return { rate: 42.50 }
          }),
        ])
        
        setCategories(categoriesRes.categories || [])
        const allProducts = productsRes.products || []
        
        setFeaturedProducts(allProducts.filter((p: Product) => p.isFeatured).slice(0, 4))
        setOfferProducts(allProducts.filter((p: Product) => p.isOffer).slice(0, 4))
        setBcvRate(bcvRes.rate || 42.50)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const displayedCategories = useMemo(() => categories.slice(0, 6), [categories]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fbfaf8] selection:bg-primary/20 selection:text-primary overflow-x-hidden">
      {/* Hero Section */}
      <Hero />

      {/* Feature Banner */}
      <FeatureBanner />

      {/* Categorías Section */}
      <motion.section 
        className="container mx-auto px-4 py-24 relative"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
      >
        <SectionHeader 
          title="Nuestras" 
          highlight="Categorías"
          subtitle="Explora nuestra selección especializada diseñada para potenciar tu bienestar integral."
          badge="Explorar"
          action={{ label: "Ver Todo", href: "/productos" }}
        />
        
        <motion.div 
          className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6"
          variants={staggerContainer}
        >
          {displayedCategories.map((category) => (
            <motion.div 
              key={category.id} 
              variants={scaleIn}
              whileHover={{ y: -8 }}
              className="relative group"
            >
              <CategoryIconCard category={category} />
              <div className="absolute -inset-0.5 bg-primary opacity-0 group-hover:opacity-5 transition-opacity blur-lg rounded-2xl -z-10" />
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Ofertas Section - Warm Tone */}
      <AnimatePresence>
        {offerProducts.length > 0 && (
          <motion.section 
            className="bg-slate-900 py-24 relative overflow-hidden rounded-[3rem] mx-4 my-12"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 translate-x-1/2" />
            
            <div className="container mx-auto px-4 relative z-10">
              <motion.div variants={fadeInUp} className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                <div className="space-y-3">
                  <Badge className="bg-primary text-white font-bold tracking-wider text-[10px] uppercase px-4 py-1.5 rounded-full shadow-lg shadow-primary/20">
                    OFERTAS ESPECIALES
                  </Badge>
                  <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                    Cuida tu <span className="text-primary font-serif italic">Bienestar</span> y tu Bolsillo
                  </h2>
                  <p className="text-slate-400 font-medium text-lg max-w-2xl leading-relaxed">
                    Promociones exclusivas para que nada te detenga en tu camino a la salud.
                  </p>
                </div>
                <Button variant="outline" className="rounded-2xl border-primary/30 bg-transparent text-primary font-bold uppercase tracking-wider hover:bg-primary hover:text-white transition-all group h-14 px-8" asChild>
                  <Link to="/ofertas">
                    Ver Todas las Ofertas
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </motion.div>

              <motion.div 
                variants={staggerContainer}
                className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
              >
                {offerProducts.map((product) => (
                  <motion.div key={product.id} variants={scaleIn}>
                    <ProductCard product={product} bcvRate={bcvRate} />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Productos Destacados */}
      <motion.section 
        className="container mx-auto px-4 py-24 relative"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
      >
        <SectionHeader 
          title="Selección" 
          highlight="Premium"
          subtitle="Nuestros productos más valorados por la comunidad de bienestar."
          badge="Destacados"
          action={{ label: "Ver Catálogo", href: "/productos" }}
        />

        <motion.div 
          variants={staggerContainer}
          className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {featuredProducts.map((product) => (
            <motion.div key={product.id} variants={scaleIn}>
              <ProductCard product={product} bcvRate={bcvRate} />
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Trust Badges Section - Zen Style */}
      <motion.section 
        className="bg-[#f3f0e8]/50 py-32 relative overflow-hidden"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
      >
        <div className="container mx-auto px-4">
          <motion.div variants={fadeInUp} className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-800 mb-6">
              Nuestro <span className="text-primary font-serif italic">Compromiso</span> contigo
            </h2>
            <div className="w-20 h-1 bg-primary/30 mx-auto rounded-full" />
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            className="grid gap-8 md:grid-cols-3"
          >
            {[
              { 
                icon: Shield, 
                title: "Calidad Garantizada", 
                desc: "Productos originales certificados para asegurar tu salud y tranquilidad.",
                color: "bg-blue-50 text-blue-500"
              },
              { 
                icon: Zap, 
                title: "Entrega Ágil", 
                desc: "Recibe tus suplementos rápidamente para no interrumpir tu rutina de cuidado.",
                color: "bg-amber-50 text-amber-500"
              },
              { 
                icon: Award, 
                title: "Asesoría Experta", 
                desc: "Nuestro equipo está listo para guiarte en tu elección según tus metas personales.",
                color: "bg-emerald-50 text-emerald-500"
              }
            ].map((feature, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <Card className="h-full border-0 bg-white shadow-sm hover:shadow-xl transition-all duration-500 rounded-[2rem] p-4 group">
                  <CardContent className="p-8 text-center flex flex-col items-center">
                    <div className={`mb-8 flex h-20 w-20 items-center justify-center rounded-3xl ${feature.color} transform group-hover:scale-110 transition-transform duration-500 shadow-sm`}>
                      <feature.icon className="h-10 w-10" />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight text-slate-800 mb-4 uppercase">{feature.title}</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Directo - Friendly & Close */}
      <section className="bg-primary/10 py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-center gap-16 text-center md:text-left">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row items-center gap-8"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-white shadow-xl shadow-primary/20">
                <Phone className="h-9 w-9" />
              </div>
              <div>
                <p className="text-primary font-bold uppercase tracking-widest text-[10px] mb-2">Atención Cercana</p>
                <p className="text-4xl md:text-5xl font-bold tracking-tight text-slate-800">800-BIENESTAR</p>
              </div>
            </motion.div>
            
            <div className="h-16 w-px bg-slate-200 hidden md:block" />
            
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="max-w-md"
            >
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                <CheckCircle2 className="text-primary h-6 w-6" />
                <p className="text-2xl font-bold italic text-slate-800 tracking-tight leading-none font-serif">
                  Tu bienestar es nuestro motor.
                </p>
              </div>
              <p className="text-slate-500 font-medium text-lg leading-relaxed">
                Estamos aquí para acompañarte en cada paso hacia una vida más saludable y plena.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <Newsletter />
    </div>
  )
}
