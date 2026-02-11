import { motion } from "framer-motion"
import { Shield, Truck, Clock, Search } from "lucide-react"

export function Hero() {
  return (
    <section className="relative min-h-[70vh] flex items-center overflow-hidden py-16 lg:py-24">
      {/* Background Video/Image */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
          poster="https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?q=80&w=2000&auto=format&fit=crop"
        >
          {/* <source 
            src="https://player.vimeo.com/external/494252666.hd.mp4?s=2f8398f6358c2f168f615392e272e50570f7f3a8&profile_id=175" 
            type="video/mp4" 
          /> */}
          <img
            src="https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?q=80&w=2000&auto=format&fit=crop"
            alt="Supplements Background"
            className="h-full w-full object-cover"
          />
        </video>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="flex flex-col items-center text-center space-y-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-lg"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            Solo los mejores productos al mejor precio
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-7xl max-w-4xl drop-shadow-md"
          >
            Catálogo de <span className="text-primary underline decoration-primary underline-offset-8">Salud y Bienestar</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="max-w-2xl text-lg text-white/90 font-medium drop-shadow-sm"
          >
            Encuentra nuestra selección completa de suplementos y medicamentos de grado profesional.
            Calidad garantizada para tu cuidado diario.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="w-full max-w-2xl relative group"
          >
            <div className="flex w-full items-stretch rounded-2xl h-16 shadow-2xl bg-white/10 backdrop-blur-md border border-white/20 overflow-hidden focus-within:ring-2 focus-within:ring-primary transition-all">
              <div className="flex items-center justify-center px-5 text-white">
                <Search className="h-6 w-6" />
              </div>
              <input
                type="text"
                placeholder="Busca por nombre, categoría o síntoma..."
                className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-white placeholder:text-white/60 text-lg font-medium"
              />
              <button className="m-2 px-8 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 hover:scale-[1.02] transition-all shadow-lg">
                Buscar
              </button>
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
