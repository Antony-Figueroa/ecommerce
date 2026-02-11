import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Mail, Lock, User, Phone, Eye, EyeOff } from "lucide-react"
import { GoogleLogin, CredentialResponse } from "@react-oauth/google"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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

        <div className="max-w-[440px] w-full mx-auto space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Crea tu cuenta
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              Comienza tu transformación hoy mismo.
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
                  text="signup_with"
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

          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm font-semibold rounded-2xl border border-rose-100 dark:border-rose-500/20 flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-rose-500" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Nombre</Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="name"
                    name="name"
                    placeholder="Juan Pérez"
                    className={cn(
                      "pl-12 h-14 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus:ring-4 focus:ring-primary/10 transition-all rounded-2xl font-medium",
                      errors.name && "border-rose-200 bg-rose-50 dark:bg-rose-500/5 focus:ring-rose-500/10"
                    )}
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                {errors.name && <p className="text-xs font-bold text-rose-500 ml-1">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Teléfono</Label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="04121234567"
                    className={cn(
                      "pl-12 h-14 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus:ring-4 focus:ring-primary/10 transition-all rounded-2xl font-medium",
                      errors.phone && "border-rose-200 bg-rose-50 dark:bg-rose-500/5 focus:ring-rose-500/10"
                    )}
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Email</Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  className={cn(
                    "pl-12 h-14 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus:ring-4 focus:ring-primary/10 transition-all rounded-2xl font-medium",
                    errors.email && "border-rose-200 bg-rose-50 dark:bg-rose-500/5 focus:ring-rose-500/10"
                  )}
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              {errors.email && <p className="text-xs font-bold text-rose-500 ml-1">{errors.email}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Contraseña</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={cn(
                      "pl-12 pr-12 h-14 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus:ring-4 focus:ring-primary/10 transition-all rounded-2xl font-medium",
                      errors.password && "border-rose-200 bg-rose-50 dark:bg-rose-500/5 focus:ring-rose-500/10"
                    )}
                    value={formData.password}
                    onChange={handleChange}
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Confirmar</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={cn(
                      "pl-12 pr-12 h-14 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus:ring-4 focus:ring-primary/10 transition-all rounded-2xl font-medium",
                      errors.confirmPassword && "border-rose-200 bg-rose-50 dark:bg-rose-500/5 focus:ring-rose-500/10"
                    )}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs font-bold text-rose-500 ml-1">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div className="flex items-start space-x-3 px-1">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                className="mt-1 rounded-md border-slate-300 dark:border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <label
                htmlFor="terms"
                className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-tight cursor-pointer"
              >
                Acepto los <Link to="/terminos" className="text-primary font-bold hover:underline">Términos y Condiciones</Link> y la <Link to="/privacidad" className="text-primary font-bold hover:underline">Política de Privacidad</Link>.
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
                  <span>Creando cuenta...</span>
                </div>
              ) : (
                "Crear Cuenta"
              )}
            </Button>
          </form>

          <p className="text-center text-sm font-medium text-slate-500 dark:text-slate-400">
            ¿Ya tienes una cuenta?{" "}
            <Link to="/login" className="text-primary font-bold hover:underline underline-offset-4">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>

      {/* Lado Derecho: Imagen y Branding */}
      <div className="hidden lg:block relative p-8">
        <div className="relative h-full w-full rounded-[48px] overflow-hidden group">
          <img
            src="https://images.pexels.com/photos/8101532/pexels-photo-8101532.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
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
                Empieza hoy tu<br />nueva vida.
              </h2>
            </div>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <div className="px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-bold flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.8)]" />
                Soporte 24/7
              </div>
              <div className="px-6 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-bold flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.8)]" />
                Los mejores Productos
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
