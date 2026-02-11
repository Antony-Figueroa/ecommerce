import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"
import { GoogleLogin, CredentialResponse } from "@react-oauth/google"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import { loginSchema } from "@/lib/validation"
import { api } from "@/lib/api"
import { ZodError } from "zod"

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [isFormValid, setIsFormValid] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [showResend, setShowResend] = useState(false)
  const [resending, setResending] = useState(false)
  const [googleReady, setGoogleReady] = useState(false)
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get("registered") === "true") {
      setSuccessMessage("¡Registro exitoso! Por favor, revisa tu correo electrónico para verificar tu cuenta.")
    }
  }, [location])

  useEffect(() => {
    setGoogleReady(true)
  }, [])

  // Validación en tiempo real
  useEffect(() => {
    const validate = () => {
      try {
        loginSchema.parse({ email, password })
        setErrors({})
        setIsFormValid(true)
      } catch (err) {
        setIsFormValid(false)
        if (err instanceof ZodError) {
          const newErrors: { email?: string; password?: string } = {}
          err.issues.forEach((issue) => {
            const path = issue.path[0] as string
            if (path === 'email' && email) newErrors.email = issue.message
            if (path === 'password' && password) newErrors.password = issue.message
          })
          setErrors(newErrors)
        }
      }
    }
    validate()
  }, [email, password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setShowResend(false)

    try {
      const validatedData = loginSchema.parse({ email, password })
      await login(validatedData.email, validatedData.password)
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/"
      navigate(from, { replace: true })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al iniciar sesión"
      setError(errorMessage)
      
      if (errorMessage.includes("verifica tu correo")) {
        setShowResend(true)
      }

      if (err instanceof ZodError) {
        const newErrors: { email?: string; password?: string } = {}
        err.issues.forEach((issue) => {
          const path = issue.path[0] as string
          if (path === 'email') newErrors.email = issue.message
          if (path === 'password') newErrors.password = issue.message
        })
        setErrors(newErrors)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendVerification = async () => {
    if (!email) {
      setError("Por favor, ingresa tu correo electrónico")
      return
    }

    setResending(true)
    try {
      await api.post("/auth/resend-verification", { email })
      setSuccessMessage("Correo de verificación reenviado exitosamente.")
      setShowResend(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al reenviar el correo")
    } finally {
      setResending(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      setLoading(true)
      setError("")
      
      if (!credentialResponse.credential) {
        throw new Error("No se recibió la credencial de Google")
      }
      
      const result = await loginWithGoogle(credentialResponse.credential)
      
      if (result.requiresRegistration) {
        navigate("/registro/confirmacion", { 
          state: { googleData: result.googleData } 
        })
      } else {
        const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/"
        navigate(from, { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión con Google")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleError = () => {
    setError("Error en la autenticación con Google. Por favor, asegúrate de que las cookies de terceros estén permitidas o intenta con otro navegador.")
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-[#0A0A0A] font-sans">
      {/* Lado Izquierdo: Formulario */}
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

        <div className="max-w-[400px] w-full mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Bienvenido
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Ingresa tus credenciales para continuar con tu bienestar.
            </p>
          </div>

          {/* Google Login Section */}
          <div className="space-y-4">
            {googleReady && (
              <div className="flex justify-center w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap
                  theme="outline"
                  size="large"
                  width="100%"
                  text="signin_with"
                  shape="pill"
                />
              </div>
            )}
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-100 dark:border-white/5"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-[#0A0A0A] px-4 text-slate-400 font-bold tracking-widest">o</span>
              </div>
            </div>
          </div>

          {/* Feedback Messages */}
          {(successMessage || error) && (
            <div className="space-y-3">
              {successMessage && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-semibold rounded-2xl border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  {successMessage}
                </div>
              )}
              {error && (
                <div className="p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm font-semibold rounded-2xl border border-rose-100 dark:border-rose-500/20">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-rose-500" />
                      {error}
                    </div>
                    {showResend && (
                      <button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={resending}
                        className="ml-5 text-[11px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                      >
                        {resending ? "Enviando..." : "Reenviar verificación"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    className={cn(
                      "pl-12 h-14 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus:ring-4 focus:ring-primary/10 transition-all rounded-2xl font-medium",
                      errors.email && "border-rose-200 bg-rose-50 dark:bg-rose-500/5 focus:ring-rose-500/10"
                    )}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                {errors.email && <p className="text-xs font-bold text-rose-500 ml-1">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <Label htmlFor="password" className="text-sm font-bold text-slate-700 dark:text-slate-300">Contraseña</Label>
                  <Link
                    to="/recuperar-contrasena"
                    className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={cn(
                      "pl-12 pr-12 h-14 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus:ring-4 focus:ring-primary/10 transition-all rounded-2xl font-medium",
                      errors.password && "border-rose-200 bg-rose-50 dark:bg-rose-500/5 focus:ring-rose-500/10"
                    )}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs font-bold text-rose-500 ml-1">{errors.password}</p>}
              </div>
            </div>

            <div className="flex items-center space-x-2 px-1">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="rounded-md border-slate-300 dark:border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <label
                htmlFor="remember"
                className="text-sm font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none"
              >
                Mantener sesión iniciada
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-base font-bold rounded-2xl transition-all shadow-xl shadow-slate-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !isFormValid}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Iniciando...</span>
                </div>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>

          <p className="text-center text-sm font-medium text-slate-500 dark:text-slate-400">
            ¿No tienes una cuenta?{" "}
            <Link to="/registro" className="text-primary font-bold hover:underline underline-offset-4">
              Regístrate ahora
            </Link>
          </p>
        </div>
      </div>

      {/* Lado Derecho: Imagen y Branding */}
      <div className="hidden lg:block relative p-8">
        <div className="relative h-full w-full rounded-[48px] overflow-hidden group">
          <img
            src="https://images.pexels.com/photos/29107589/pexels-photo-29107589.jpeg"
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
                Tu Bienestar,<br />Nuestra Prioridad
              </h2>
              <p className="text-lg text-slate-200 font-medium max-w-md">
                Descubre una nueva forma de cuidar tu cuerpo con suplementos de alta calidad diseñados para tu estilo de vida.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <div className="px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-bold flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.8)]" />
                100% Garantía
              </div>
              <div className="px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-bold flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.8)]" />
                Envío Gratis
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
