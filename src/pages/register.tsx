import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Mail, Lock, User, Phone, Eye, EyeOff } from "lucide-react"
import { GoogleLogin, CredentialResponse } from "@react-oauth/google"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import { registerSchema } from "@/lib/validation"
import { ZodError } from "zod"

interface FormErrors {
  name?: string
  email?: string
  phone?: string
  password?: string
  confirmPassword?: string
  acceptTerms?: string
}

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [errors, setErrors] = useState<FormErrors>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  })
  const [isFormValid, setIsFormValid] = useState(false)
  const { loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [googleReady, setGoogleReady] = useState(false)

  useEffect(() => {
    setGoogleReady(true)
  }, [])
  useEffect(() => {
    const validate = () => {
      try {
        registerSchema.parse({ ...formData, acceptTerms })
        setErrors({ name: "", email: "", password: "", confirmPassword: "", phone: "" })
        setIsFormValid(true)
      } catch (err) {
        setIsFormValid(false)
        if (err instanceof ZodError) {
          const newErrors: FormErrors = { name: "", email: "", password: "", confirmPassword: "", phone: "" }
          err.issues.forEach((issue) => {
            const path = issue.path[0] as keyof FormErrors
            if (formData[path as keyof typeof formData] || path === 'confirmPassword' || path === 'acceptTerms') {
              newErrors[path] = issue.message
            }
          })
          setErrors(newErrors)
        }
      }
    }

    validate()
  }, [formData, acceptTerms])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    // Restricciones de entrada inmediata según requerimientos
    if (name === "phone" && value && !/^\d*$/.test(value)) return

    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: "Las contraseñas no coinciden" }))
      setLoading(false)
      return
    }

    try {
      // Validación final antes de enviar
      const validatedData = registerSchema.parse({ ...formData, acceptTerms })

      await api.register({
        name: validatedData.name,
        email: validatedData.email,
        password: validatedData.password,
        phone: validatedData.phone || undefined,
      })
      navigate("/login?registered=true")
    } catch (err) {
      if (err instanceof ZodError) {
        const newErrors: FormErrors = {}
        err.issues.forEach((issue) => {
          if (issue.path[0]) {
            newErrors[issue.path[0] as keyof FormErrors] = issue.message
          }
        })
        setErrors(newErrors)
      } else {
        setError(err instanceof Error ? err.message : "Error al registrar usuario")
      }
    } finally {
      setLoading(false)
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
        navigate("/")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrarse con Google")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleError = () => {
    setError("Error en la autenticación con Google. Revisa cookies de terceros o desactiva Shields en Brave.")
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
          <CardTitle className="text-2xl font-bold">Crear cuenta</CardTitle>
          <CardDescription>
            Regístrate para disfrutar de nuestros beneficios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  placeholder="Ingresa tu nombre completo"
                  className={cn("pl-10", errors.name && "border-red-500 focus-visible:ring-red-500")}
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="correo@email.com"
                  className={cn("pl-10", errors.email && "border-red-500 focus-visible:ring-red-500")}
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono (opcional)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="0123456789"
                  className={cn("pl-10", errors.phone && "border-red-500 focus-visible:ring-red-500")}
                  value={formData.phone}
                  onChange={handleChange}
                  maxLength={11}
                />
              </div>
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={cn("pl-10 pr-10", errors.password && "border-red-500 focus-visible:ring-red-500")}
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={cn("pl-10 pr-10", errors.confirmPassword && "border-red-500 focus-visible:ring-red-500")}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
            </div>
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                className={errors.acceptTerms ? "border-red-500" : ""}
              />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Acepto los{" "}
                <Link to="/terminos" className="text-primary hover:underline">
                  términos y condiciones
                </Link>{" "}
                y la{" "}
                <Link to="/privacidad" className="text-primary hover:underline">
                  política de privacidad
                </Link>
              </label>
            </div>
            {errors.acceptTerms && <p className="text-xs text-red-500">{errors.acceptTerms}</p>}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !isFormValid}
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                O regístrate con
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="flex justify-center w-full overflow-hidden min-h-[44px]">
              <div className="w-full flex justify-center">
                {/* {isBrave && (
                  <div className="mb-2 w-[250px] p-2 text-xs rounded-lg border border-amber-200 bg-amber-50 text-amber-700">
                    Si usas Brave, desactiva Shields o permite cookies de terceros para usar Google.
                  </div>
                )} */}
                {googleReady ? (
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap={false}
                    use_fedcm_for_prompt={false}
                    theme="outline"
                    size="large"
                    width="250"
                    text="signup_with"
                    shape="rectangular"
                    logo_alignment="left"
                  />
                ) : (
                  <div className="h-11 w-[250px] rounded-md bg-slate-100 dark:bg-muted animate-pulse" />
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Inicia sesión
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
