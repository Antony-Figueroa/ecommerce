import { useState, useEffect } from "react"
import { MessageCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { api } from "@/lib/api"

export function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("584123456789")

  const businessHours = "Lunes a Viernes: 8:00 AM - 8:00 PM"
  const weekendHours = "Sábado: 9:00 AM - 2:00 PM"

  useEffect(() => {
    fetchPhoneNumber()
  }, [])

  const fetchPhoneNumber = async () => {
    try {
      const settings = await api.getPublicSettings()
      if (settings.whatsapp_number) {
        const cleanNumber = settings.whatsapp_number.replace(/\+/g, '').replace(/\D/g, '')
        setPhoneNumber(cleanNumber)
      }
    } catch (error) {
      console.error("Error fetching whatsapp number:", error)
    }
  }

  const quickMessages = [
    { label: "Hola, me interesa un producto", text: "Hola, me gustaría obtener más información sobre un producto de su catálogo." },
    { label: "Pregunta sobre disponibilidad", text: "Hola, quiero saber si tienen disponible un producto específico." },
    { label: "Consulta sobre precios", text: "Hola, me interesa conocer los precios de sus productos farmacéuticos." },
  ]

  const handleQuickMessage = (message: string) => {
    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, "_blank")
  }

  const handleCustomMessage = () => {
    const message = "Hola, tengo una pregunta sobre Ana's Supplements"
    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, "_blank")
  }

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [])

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {isOpen && (
          <Card className="mb-4 w-80 shadow-2xl border-primary/10 animate-in fade-in slide-in-from-bottom-5 zoom-in-95 duration-300 rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-primary p-4 text-primary-foreground">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-inner">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-base leading-tight">Ana's Supplements</p>
                    <div className="flex items-center gap-1.5">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <p className="text-xs text-primary-foreground/80 font-medium">En línea</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-background/50 backdrop-blur-sm">
                <p className="text-sm text-muted-foreground mb-5 bg-muted/30 p-3 rounded-xl border border-border/50">
                  ¡Hola! 👋 ¿Cómo podemos ayudarte hoy? Responde a este mensaje para obtener atención personalizada.
                </p>

                <div className="space-y-2.5">
                  {quickMessages.map((msg, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start text-sm h-auto py-3 px-4 rounded-xl border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 group"
                      onClick={() => handleQuickMessage(msg.text)}
                    >
                      <MessageCircle className="h-4 w-4 mr-3 text-primary group-hover:scale-110 transition-transform" />
                      <span className="flex-1 text-left">{msg.label}</span>
                    </Button>
                  ))}
                </div>

                <Button
                  className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 h-12 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  onClick={handleCustomMessage}
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Escribir mensaje
                </Button>

                <div className="mt-6 pt-4 border-t border-border/50">
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/60 text-center mb-1">
                      Horarios de Atención
                    </p>
                    <p className="text-xs text-muted-foreground text-center font-medium">
                      {businessHours}
                    </p>
                    <p className="text-xs text-muted-foreground text-center font-medium">
                      {weekendHours}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Button
          className="h-16 w-16 rounded-full bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/40 transition-all duration-300 hover:scale-110 active:scale-95 border-4 border-background"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <X className="h-7 w-7 text-primary-foreground animate-in spin-in-90 duration-300" />
          ) : (
            <MessageCircle className="h-7 w-7 text-primary-foreground animate-in zoom-in duration-300" />
          )}
        </Button>
      </div>
    </>
  )
}
