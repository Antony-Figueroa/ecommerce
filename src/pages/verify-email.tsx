import { useEffect, useState } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("Verificando tu correo electrónico...")

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus("error")
        setMessage("Token de verificación no encontrado.")
        return
      }

      try {
        const response = await api.post<{ success: boolean; error?: string }>("/auth/verify-email", { token })
        if (response.success) {
          setStatus("success")
          setMessage("¡Tu correo electrónico ha sido verificado con éxito!")
        } else {
          setStatus("error")
          setMessage(response.error || "Hubo un problema al verificar tu correo.")
        }
      } catch (error) {
        setStatus("error")
        setMessage("Hubo un error en el servidor. Por favor, intenta de nuevo más tarde.")
      }
    }

    verifyEmail()
  }, [token])

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-[#0A0A0A] font-sans">
      {/* Lado Izquierdo: Contenido */}
      <div className="flex flex-col justify-center px-8 sm:px-12 lg:px-24 py-12 relative overflow-hidden">
        {/* Logo Top Left */}
        <div className="absolute top-8 left-8 lg:left-12">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg transition-transform group-hover:scale-105">
              <span className="text-xl font-black italic">A+</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Ana's</span>
          </Link>
        </div>

        <div className="max-w-[440px] w-full mx-auto space-y-8">
          <div className="space-y-6 text-center lg:text-left">
            <div className="flex justify-center lg:justify-start">
              <div className="h-16 w-16 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-white/10 shadow-xl">
                {status === "loading" && <Loader2 className="h-8 w-8 animate-spin text-primary" />}
                {status === "success" && <CheckCircle2 className="h-8 w-8 text-green-500" />}
                {status === "error" && <XCircle className="h-8 w-8 text-rose-500" />}
              </div>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Verificación de Email
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {message}
              </p>
              {status === "success" && (
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Ya puedes iniciar sesión en tu cuenta y comenzar a comprar.
                </p>
              )}
              {status === "error" && (
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  El enlace puede haber expirado o ser inválido. Puedes solicitar un nuevo enlace desde la página de inicio de sesión.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {status === "success" ? (
                <Button asChild className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-base font-bold rounded-2xl transition-all shadow-xl">
                  <Link to="/login">Ir al Inicio de Sesión</Link>
                </Button>
              ) : status === "error" ? (
                <Button asChild variant="outline" className="w-full h-14 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 text-base font-bold rounded-2xl transition-all">
                  <Link to="/login">Volver al Inicio de Sesión</Link>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Lado Derecho: Imagen y Branding */}
      <div className="hidden lg:block relative p-8">
        <div className="relative h-full w-full rounded-[48px] overflow-hidden group">
          <img
            src="https://images.unsplash.com/photo-1550572017-ed200f5e6343?q=80&w=2000&auto=format&fit=crop"
            alt="Ana's Supplements"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Logo overlay */}
          <div className="absolute top-12 left-12">
            <div className="flex items-center gap-3 text-white">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30">
                <span className="text-2xl font-black italic">A+</span>
              </div>
              <span className="text-2xl font-black tracking-tighter">ANA'S SUPPLEMENTS</span>
            </div>
          </div>

          {/* Content overlay */}
          <div className="absolute bottom-16 left-16 right-16 space-y-6">
            <div className="space-y-4">
              <h2 className="text-5xl font-extrabold text-white leading-[1.1] tracking-tight">
                Confirma tu<br />identidad.
              </h2>
              <p className="text-lg text-slate-200 font-medium max-w-md">
                Verificar tu correo nos ayuda a mantener tu cuenta segura y asegurarnos de que recibas todas nuestras novedades.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
