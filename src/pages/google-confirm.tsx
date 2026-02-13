import { useState, useEffect } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { Check, X, Loader2, User as UserIcon, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

const SESSION_TIMEOUT = 5 * 60 * 1000 // 5 minutos

export function GoogleConfirmPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { registerWithGoogle } = useAuth()
  const { toast } = useToast()
  
  const googleData = location.state?.googleData
  
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [usernameError, setUsernameError] = useState("")
  const [loading, setLoading] = useState(false)

  // Redirect if no google data or session timeout
  useEffect(() => {
    if (!googleData) {
      navigate("/registro")
      return
    }

    const startTime = Date.now()
    const interval = setInterval(() => {
      if (Date.now() - startTime > SESSION_TIMEOUT) {
        toast({
          title: "Sesión expirada",
          description: "El tiempo para completar tu registro ha expirado. Por favor, intenta de nuevo.",
          variant: "destructive",
        })
        navigate("/registro")
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [googleData, navigate, toast])

  // Real-time username validation
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (username.length >= 3) {
        setIsChecking(true)
        setUsernameError("")
        try {
          const result = await api.checkUsername(username)
          setIsAvailable(result.available)
          if (!result.available) {
            setUsernameError(result.message || "Nombre de usuario no disponible")
          }
        } catch (err) {
          setIsAvailable(null)
          setUsernameError("Error al verificar disponibilidad")
        } finally {
          setIsChecking(false)
        }
      } else if (username.length > 0) {
        setIsAvailable(false)
        setUsernameError("Mínimo 3 caracteres")
      } else {
        setIsAvailable(null)
        setUsernameError("")
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [username])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAvailable || !googleData) return

    setLoading(true)

    try {
      await registerWithGoogle({
        googleId: googleData.googleId,
        email: googleData.email,
        name: googleData.name,
        avatarUrl: googleData.avatarUrl,
        username: username,
        password: password,
      })
      
      toast({
        title: "¡Bienvenido!",
        description: "Tu cuenta ha sido creada exitosamente.",
        variant: "success",
      })
      
      navigate("/")
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error al completar el registro",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!googleData) return null

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-[#0A0A0A] font-sans">
      {/* Lado Izquierdo: Formulario */}
      <div className="flex flex-col justify-center px-8 sm:px-12 lg:px-24 py-12 relative overflow-hidden order-2 lg:order-1">
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
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Casi listo, {googleData?.name?.split(' ')[0]}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Completa estos últimos detalles para crear tu cuenta con Google de forma segura.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Nombre de usuario</Label>
              <div className="relative group">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <Input
                  id="username"
                  placeholder="ej. juan_salud"
                  className={cn(
                    "pl-12 h-14 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus:ring-4 focus:ring-primary/10 transition-all rounded-2xl font-medium",
                    isAvailable === false && "border-rose-200 bg-rose-50 dark:bg-rose-500/5",
                    isAvailable === true && "border-emerald-200 bg-emerald-50 dark:bg-emerald-500/5"
                  )}
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  required
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                  {isChecking && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                  {!isChecking && isAvailable === true && <Check className="h-5 w-5 text-emerald-500" />}
                  {!isChecking && isAvailable === false && <X className="h-5 w-5 text-rose-500" />}
                </div>
              </div>
              {usernameError && <p className="text-xs font-bold text-rose-500 ml-1">{usernameError}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Contraseña (opcional)</Label>
              <div className="relative group">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Para iniciar sin Google después"
                  className="pl-4 pr-12 h-14 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus:ring-4 focus:ring-primary/10 transition-all rounded-2xl font-medium"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium ml-1">
                Puedes dejar esto en blanco si solo planeas usar Google.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-base font-bold rounded-2xl transition-all shadow-xl shadow-slate-200 dark:shadow-none disabled:opacity-50"
              disabled={loading || !isAvailable}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Finalizando registro...</span>
                </div>
              ) : (
                "Completar Registro"
              )}
            </Button>
          </form>

          <p className="text-center text-sm font-medium text-slate-500 dark:text-slate-400">
            ¿No eres {googleData?.name}?{" "}
            <Link to="/registro" className="text-primary font-bold hover:underline underline-offset-4">
              Usar otra cuenta
            </Link>
          </p>
        </div>
      </div>

      {/* Lado Derecho: Imagen y Branding */}
      <div className="hidden lg:block relative p-8 order-1 lg:order-2">
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
                Tu identidad,<br />tu estilo.
              </h2>
              <p className="text-lg text-slate-200 font-medium max-w-md">
                Personaliza cómo te verás en nuestra plataforma y asegura tu acceso preferido.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
