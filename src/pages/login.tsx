import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"
import { GoogleLogin, CredentialResponse } from "@react-oauth/google"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get("registered") === "true") {
      setSuccessMessage("¡Registro exitoso! Por favor, revisa tu correo electrónico para verificar tu cuenta.")
    }
  }, [location])

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
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 relative overflow-hidden">
      {/* Background Decorative Element (Signature: Zen Flow) */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 rounded-full blur-3xl translate-x-1/4 -translate-y-1/4 z-0" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-emerald-500/5 rounded-full blur-3xl -translate-x-1/4 translate-y-1/4 z-0" />
      
      <Card className="w-full max-w-md border-border shadow-sm relative z-10 overflow-hidden bg-white/80 dark:bg-card/80 backdrop-blur-sm">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" /> {/* Top Signature Accent */}
        <CardHeader className="space-y-1 text-center pb-8">
          <div className="flex justify-center mb-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-xl shadow-primary/20 transform hover:scale-105 transition-transform">
                <span className="text-3xl font-bold text-white">A+</span>
              </div>
            </Link>
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-slate-800 dark:text-foreground">
            Portal de Bienestar
          </CardTitle>
          <CardDescription className="text-slate-500 dark:text-muted-foreground font-medium">
            ¡Hola! Accede a tu cuenta para continuar tu camino.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {successMessage && (
            <div className="p-4 bg-primary/10 text-primary text-sm font-semibold rounded-xl border border-primary/20">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-sm font-semibold rounded-xl border border-rose-100 dark:border-rose-900/50">
              {error}
              {showResend && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="block mt-2 font-bold underline hover:text-rose-900 dark:hover:text-rose-200 disabled:opacity-50"
                >
                  {resending ? "Enviando..." : "¿Reenviar código de verificación?"}
                </button>
              )}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-muted-foreground">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  className={cn(
                    "pl-10 h-12 bg-white dark:bg-background border-slate-200 dark:border-border focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all rounded-xl font-medium",
                    errors.email && "border-rose-500 bg-rose-50 dark:bg-rose-950/20"
                  )}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {errors.email && <p className="text-xs font-medium text-rose-500">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-muted-foreground">Contraseña</Label>
                <Link
                  to="/recuperar-contrasena"
                  className="text-xs font-semibold text-primary hover:underline transition-all"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={cn(
                    "pl-10 pr-10 h-12 bg-white dark:bg-background border-slate-200 dark:border-border focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all rounded-xl font-medium",
                    errors.password && "border-rose-500 bg-rose-50 dark:bg-rose-950/20"
                  )}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent text-slate-400 dark:text-muted-foreground hover:text-slate-600 dark:hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && <p className="text-xs font-medium text-rose-500">{errors.password}</p>}
            </div>
            <div className="flex items-center space-x-2 pb-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="rounded-md border-slate-300 dark:border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label htmlFor="remember" className="text-sm font-medium text-slate-600 dark:text-muted-foreground cursor-pointer">
                Mantener sesión iniciada
              </Label>
            </div>
            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
              disabled={loading || !isFormValid}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Iniciando sesión...</span>
                </div>
              ) : (
                "Entrar ahora"
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full border-slate-100 dark:border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-card px-4 text-slate-400 dark:text-muted-foreground font-bold tracking-widest">O continúa con</span>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-full flex justify-center min-h-[44px]">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                use_fedcm_for_prompt={true}
                theme="outline"
                size="large"
                width="250"
                shape="pill"
                text="continue_with"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-2 pb-8">
          <p className="text-center text-sm font-medium text-slate-500 dark:text-muted-foreground">
            ¿Aún no tienes una cuenta?{" "}
            <Link to="/registro" className="text-primary font-bold hover:underline transition-all">
              Regístrate aquí
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
