import { useEffect, useState } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
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
    <div className="container flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === "loading" && <Loader2 className="h-12 w-12 animate-spin text-primary" />}
            {status === "success" && <CheckCircle2 className="h-12 w-12 text-green-500" />}
            {status === "error" && <XCircle className="h-12 w-12 text-destructive" />}
          </div>
          <CardTitle className="text-2xl">Verificación de Email</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {status === "success" && (
            <p className="text-muted-foreground">
              Ya puedes iniciar sesión en tu cuenta y comenzar a comprar.
            </p>
          )}
          {status === "error" && (
            <p className="text-muted-foreground">
              El enlace puede haber expirado o ser inválido. Puedes solicitar un nuevo enlace desde la página de inicio de sesión.
            </p>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          {status === "success" ? (
            <Button asChild className="w-full">
              <Link to="/login">Ir al Inicio de Sesión</Link>
            </Button>
          ) : status === "error" ? (
            <div className="flex flex-col gap-2 w-full">
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">Volver al Inicio de Sesión</Link>
              </Button>
            </div>
          ) : null}
        </CardFooter>
      </Card>
    </div>
  )
}
