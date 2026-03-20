import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CheckoutStepsProps {
  currentStep: number
  steps: { label: string; description?: string }[]
}

export function CheckoutSteps({ currentStep, steps }: CheckoutStepsProps) {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center justify-center gap-2 sm:gap-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          const isLast = index === steps.length - 1

          return (
            <li key={step.label} className={cn("flex items-center", !isLast && "pr-4 sm:pr-8")}>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-200",
                    isCompleted && "border-primary bg-primary text-primary-foreground",
                    isCurrent && "border-primary bg-primary/10 text-primary",
                    !isCompleted && !isCurrent && "border-muted-foreground/30 bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    stepNumber
                  )}
                </div>
                <div className="hidden sm:block">
                  <p
                    className={cn(
                      "text-sm font-semibold transition-colors",
                      isCurrent && "text-primary",
                      !isCurrent && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  )}
                </div>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 -z-10",
                    isCompleted ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export const CHECKOUT_STEPS = [
  { label: "Carrito", description: "Revisar productos" },
  { label: "Datos", description: "Información de entrega" },
  { label: "Confirmar", description: "Revisar y enviar" },
  { label: "Listo", description: "Pedido enviado" },
]
