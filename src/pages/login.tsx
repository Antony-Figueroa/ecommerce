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
    setError("Error en la autenticación con Google")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                <span className="text-xl font-bold text-white">+</span>
              </div>
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold">Bienvenido de nuevo</CardTitle>
          <CardDescription>
            Inicia sesión para acceder a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {successMessage && (
            <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg border border-green-200">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
              {error}
              {showResend && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="block mt-2 font-medium underline hover:text-red-800 disabled:opacity-50"
                >
                  {resending ? "Enviando..." : "¿Reenviar correo de verificación?"}
                </button>
              )}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  className={cn("pl-10", errors.email && "border-red-500")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={cn("pl-10 pr-10", errors.password && "border-red-500")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <label
                htmlFor="remember"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Recordarme
              </label>
            </div>
            <Button type="submit" className="w-full" disabled={loading || !isFormValid}>
              {loading ? "Iniciando sesión..." : "Iniciar sesión"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                O continúa con
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="flex justify-center w-full overflow-hidden">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}
                use_fedcm_for_prompt={true}
                theme="outline"
                size="large"
                text="signin_with"
                shape="rectangular"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link to="/registro" className="text-primary font-medium hover:underline">
              Regístrate
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
