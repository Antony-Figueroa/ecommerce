import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Check, X, Loader2, User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
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
    <div className="min-h-screen flex items-center justify-center bg-muted/30 py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Confirma tu perfil</CardTitle>
          <CardDescription>
            Estás a un paso de completar tu registro con Google
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4 p-4 bg-muted/50 rounded-lg">
            {googleData.avatarUrl ? (
              <img 
                src={googleData.avatarUrl} 
                alt={googleData.name} 
                className="h-20 w-20 rounded-full border-2 border-primary shadow-sm"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary">
                <UserIcon className="h-10 w-10 text-primary" />
              </div>
            )}
            <div className="text-center">
              <p className="font-semibold text-lg">{googleData.name}</p>
              <p className="text-sm text-muted-foreground">{googleData.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Elige un nombre de usuario</Label>
              <div className="relative">
                <Input
                  id="username"
                  placeholder="ej: juan_perez"
                  className={cn(
                    "pr-10",
                    isAvailable === true && "border-green-500 focus-visible:ring-green-500",
                    isAvailable === false && "border-red-500 focus-visible:ring-red-500"
                  )}
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  disabled={loading}
                  required
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isChecking ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : isAvailable === true ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : isAvailable === false ? (
                    <X className="h-4 w-4 text-red-500" />
                  ) : null}
                </div>
              </div>
              {usernameError && (
                <p className="text-xs text-red-500 mt-1">{usernameError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Debe tener entre 3 y 20 caracteres. Solo letras, números y guiones bajos.
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || isAvailable !== true}
            >
              {loading ? "Completando registro..." : "Completar registro"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/registro")}
            disabled={loading}
          >
            Cancelar
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
