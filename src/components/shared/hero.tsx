import { motion } from "framer-motion"
import { Shield, Truck, Clock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-background py-20">
      {/* Video Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover opacity-25"
        >
          <source src="/video hero.mp4" type="video/mp4" />
        </video>
        {/* Overlay to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-transparent to-background/20" />
      </div>

      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[120%] bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[80%] bg-secondary/30 rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Text Content */}
          <div className="flex flex-col items-start text-left space-y-8 max-w-2xl">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2 text-xs font-black uppercase tracking-widest text-primary shadow-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Calidad Profesional Garantizada
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-5xl font-black tracking-tighter text-foreground sm:text-7xl lg:text-8xl leading-[0.9] italic"
            >
              Tu Salud <br />
              <span className="text-primary not-italic">Nuestra Prioridad</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="max-w-xl text-lg text-muted-foreground font-medium leading-relaxed"
            >
              Encuentra nuestra selección completa de suplementos y medicamentos de grado profesional.
              Calidad certificada para tu cuidado diario y bienestar integral.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-wrap gap-4"
            >
              <Button size="lg" className="h-16 px-10 rounded-2xl text-lg font-black uppercase tracking-widest shadow-xl shadow-primary/20 group">
                Ver Catálogo
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </div>

          {/* Floating Image Composition */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="relative hidden lg:block w-full max-w-xl"
          >
            <div className="relative aspect-square">
               {/* Main Product Placeholder */}
               <motion.div 
                 animate={{ y: [0, -20, 0] }}
                 transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                 className="absolute inset-0 flex items-center justify-center"
               >
                <div className="w-full max-w-[600px] aspect-[3/4] bg-gradient-to-br from-card to-secondary/20 rounded-[4rem] shadow-2xl flex items-center justify-center p-6 border border-border/50 backdrop-blur-md overflow-hidden group relative">
                    <img 
                      src="https://images.pexels.com/photos/29107673/pexels-photo-29107673.jpeg" 
                      alt="Suplementos de Alta Calidad"
                      className="w-full h-full object-cover rounded-[3rem] transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent pointer-events-none" />
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-[4rem]" />
                 </div>
               </motion.div>

               <motion.div 
                 animate={{ y: [0, -15, 0], x: [0, -15, 0] }}
                 transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                 className="absolute bottom-20 left-0 w-24 h-24 bg-primary/10 rounded-full blur-xl"
               />
               
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/5 rounded-full blur-[100px] -z-10" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export function FeatureBanner() {
  const features = [
    {
      icon: <Truck className="h-6 w-6" />,
      title: "Envío Rápido",
      description: "No esperes más, tu pedido llegara antes de lo que crees",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Productos Originales",
      description: "100% garantizados",
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Atención 24/7",
      description: "Cuenta con nosotros",
    },
  ] as const

  return (
    <section className="border-y bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-3"
        >
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col items-center text-center"
            >
              <div className="mb-3 rounded-full bg-primary/10 p-3 text-primary">
                {feature.icon}
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground font-medium">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
