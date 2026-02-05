import { useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface NewsletterProps {
  title?: string
  description?: string
}

export function Newsletter({ title, description }: NewsletterProps) {
  const [email, setEmail] = useState("")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setIsSubscribed(true)
      setIsDialogOpen(true)
      setTimeout(() => {
        setIsSubscribed(false)
        setEmail("")
      }, 3000)
    }
  }

  return (
    <>
      <section className="bg-primary/5 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-2xl font-bold">{title || "Suscríbete a nuestro boletín"}</h2>
            <p className="mb-6 text-muted-foreground">
              {description ||
                "Recibe ofertas exclusivas, consejos de salud y nuevas llegadas directamente en tu correo."}
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
              <Input
                type="email"
                placeholder="Tu correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1"
              />
              <Button type="submit" disabled={isSubscribed}>
                {isSubscribed ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Suscrito
                  </>
                ) : (
                  "Suscribirse"
                )}
              </Button>
            </form>
            <p className="mt-3 text-xs text-muted-foreground">
              Al suscribirte, aceptas nuestra política de privacidad.
            </p>
          </div>
        </div>
      </section>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¡Gracias por suscribirte!</DialogTitle>
            <DialogDescription>
              Recibirás nuestras mejores ofertas y consejos de salud en tu correo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)}>Aceptar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
