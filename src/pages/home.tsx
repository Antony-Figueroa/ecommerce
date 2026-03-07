import { useState, useEffect, memo } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowRight, Shield, Phone, Loader2, Zap, Award, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ProductCarousel } from "@/components/shop/ProductCarousel"
import { GoalSelector } from "@/components/shop/goal-selector"
import { Hero, FeatureBanner } from "@/components/shared/hero"
import { Newsletter } from "@/components/shared/newsletter"
import { api } from "@/lib/api"
import type { Product } from "@/types"

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
      <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-800 dark:text-foreground leading-tight">
        {title} <span className="text-primary font-serif italic">{highlight}</span>
      </h2>
      <p className="text-slate-500 dark:text-muted-foreground font-medium text-lg max-w-2xl leading-relaxed">
        {subtitle}
      </p>
    </div>
    {action && (
      <Button variant="outline" className="rounded-2xl border-slate-200 dark:border-border bg-white dark:bg-card text-slate-600 dark:text-muted-foreground font-bold uppercase tracking-wider hover:border-primary hover:text-primary transition-all group h-14 px-8 self-start md:self-end shadow-sm" asChild>
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
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [bcvRate, setBcvRate] = useState(42.50)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [featuredRes, bcvRes] = await Promise.all([
          api.getPublicProducts({ isFeatured: true, limit: 12 }),
          api.getBCVRate().catch((err) => {
            console.warn("Error fetching BCV rate, using fallback:", err)
            return { rate: 42.50 }
          }),
        ])

        setFeaturedProducts(featuredRes.products || [])
        setBcvRate(bcvRes.rate || 42.50)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
        </div>
      </div>
    )
  }

  // Debug: Verificar productos destacados en consola
  console.log("Featured Products:", featuredProducts);

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20 selection:text-primary overflow-x-hidden">
      {/* Hero Section */}
      <Hero />

      {/* Feature Banner */}
      <FeatureBanner />

      {/* Selector por Objetivos - Health Goal Navigator */}
      <GoalSelector />

      {/* Carrusel de Productos Destacados - Reemplaza Categorías */}
      <ProductCarousel
        products={featuredProducts}
        bcvRate={bcvRate}
        title="Productos Destacados"
        subtitle="Nuestra selección premium para potenciar tu bienestar diario."
      />

      {/* Trust Badges Section - Zen Style */}
      <motion.section
        className="py-32 relative overflow-hidden"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
      >
        <div className="container mx-auto px-4">
          <motion.div variants={fadeInUp} className="text-center mb-20 space-y-4">
            <h2 className="text-5xl font-black tracking-tighter text-foreground italic">
              Nuestro <span className="text-primary not-italic">Compromiso</span> contigo
            </h2>
            <div className="w-20 h-2 bg-primary mx-auto rounded-full" />
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
                color: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-emerald-400"
              },
              {
                icon: Zap,
                title: "Entrega Ágil",
                desc: "Recibe tus suplementos rápidamente para no interrumpir tu rutina de cuidado.",
                color: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-emerald-400"
              },
              {
                icon: Award,
                title: "Asesoría Experta",
                desc: "Estamos para guiarte en tu elección según tus metas personales.",
                color: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-emerald-400"
              }
            ].map((feature, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <Card className="h-full border border-border/50 bg-card hover:bg-secondary/20 dark:hover:bg-secondary/10 shadow-sm hover:shadow-xl transition-all duration-500 rounded-[2.5rem] p-6 group">
                  <CardContent className="p-8 text-center flex flex-col items-center">
                    <div className={`mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] ${feature.color} transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner`}>
                      <feature.icon className="h-12 w-12" />
                    </div>
                    <h3 className="text-2xl font-black tracking-tight text-foreground mb-4 uppercase">{feature.title}</h3>
                    <p className="text-muted-foreground font-medium leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Directo - Friendly & Close */}
      <section className="bg-primary/10 dark:bg-primary/5 py-24 relative overflow-hidden">
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
                <p className="text-4xl md:text-5xl font-bold tracking-tight text-slate-800 dark:text-foreground">04121234567</p>
              </div>
            </motion.div>

            <div className="h-16 w-px bg-slate-200 dark:bg-border hidden md:block" />

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="max-w-md"
            >
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                <CheckCircle2 className="text-primary h-6 w-6" />
                <p className="text-2xl font-bold italic text-slate-800 dark:text-foreground tracking-tight leading-none font-serif">
                  Tu bienestar es nuestro motor.
                </p>
              </div>
              <p className="text-slate-500 dark:text-muted-foreground font-medium text-lg leading-relaxed">
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
