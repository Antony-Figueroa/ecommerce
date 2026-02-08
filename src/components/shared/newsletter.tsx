import { useState } from "react"
import { Check, Mail, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface NewsletterProps {
  title?: string
  description?: string
}

export function Newsletter({ title, description }: NewsletterProps) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    try {
      await api.requestCatalog(email)
      setIsDialogOpen(true)
      setEmail("")
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar tu solicitud. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <section className="bg-primary/5 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-slate-800 dark:text-foreground">
              {title || "¿Quieres recibir nuestro catálogo en PDF?"}
            </h2>
            <p className="mb-8 text-lg text-muted-foreground font-medium">
              {description ||
                "Ingresa tu correo electrónico y te enviaremos nuestro catálogo completo de productos directamente a tu bandeja de entrada."}
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row max-w-md mx-auto">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Tu correo electrónico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-12 rounded-xl border-primary/20 focus-visible:ring-primary"
                />
              </div>
              <Button type="submit" disabled={isLoading} size="lg" className="h-12 px-8 rounded-xl font-bold text-base shadow-lg shadow-primary/20">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Solicitar Catálogo"
                )}
              </Button>
            </form>
            <p className="mt-4 text-sm text-muted-foreground italic font-semibold">
              Al solicitarlo, aceptas nuestra política de privacidad.
            </p>
          </div>
        </div>
      </section>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Check className="h-8 w-8" />
            </div>
            <DialogTitle className="text-2xl font-black">¡Catálogo Enviado!</DialogTitle>
            <DialogDescription className="text-base font-medium">
              Hemos enviado nuestro catálogo de productos en formato PDF a <span className="text-primary font-bold">{email}</span>. 
              <br/><br/>
              ¡Esperamos que encuentres lo que necesitas!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setIsDialogOpen(false)} className="rounded-xl px-8 font-bold">Aceptar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
