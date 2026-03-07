import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { ReactNode } from "react"

const adminBadgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors border",
  {
    variants: {
      variant: {
        default: "bg-white border-slate-200 text-slate-700 dark:bg-card dark:border-border",
        success: "bg-emerald-50/50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400",
        warning: "bg-amber-50/50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400",
        danger: "bg-rose-50/50 border-rose-200 text-rose-700 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-400",
        info: "bg-blue-50/50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400",
        neutral: "bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-300",
        outline: "border border-border text-foreground",
      },
      size: {
        sm: "px-2.5 py-0.5 text-xs",
        md: "px-3 py-1 text-sm",
        lg: "px-4 py-1.5 text-base",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "md"
    },
  }
)

interface AdminBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof adminBadgeVariants> {
  children: ReactNode
}

export function AdminBadge({ className, variant, size, children, ...props }: AdminBadgeProps) {
  // Dot logic based on variant
  const dotColor =
    variant === "success" ? "bg-emerald-500" :
      variant === "danger" ? "bg-rose-500" :
        variant === "warning" ? "bg-amber-500" :
          variant === "info" ? "bg-blue-500" : "bg-slate-400";

  return (
    <span className={cn(adminBadgeVariants({ variant, size }), className)} {...props}>
      <span className={cn("mr-2 h-1.5 w-1.5 rounded-full shrink-0", dotColor)} aria-hidden="true" />
      {children}
    </span>
  )
}

export const statusBadgeMap: Record<string, { variant: "success" | "warning" | "danger" | "info" | "neutral" | "default", label: string }> = {
  COMPLETED: { variant: "success", label: "Completado" },
  DELIVERED: { variant: "success", label: "Entregado" },
  CONFIRMED: { variant: "info", label: "Confirmado" },
  PROCESSING: { variant: "info", label: "Procesando" },
  SHIPPED: { variant: "info", label: "Enviado" },
  PENDING: { variant: "warning", label: "Pendiente" },
  PENDING_PAYMENT: { variant: "warning", label: "Pago Pendiente" },
  CANCELLED: { variant: "danger", label: "Cancelado" },
  REJECTED: { variant: "danger", label: "Rechazado" },
  REFUNDED: { variant: "danger", label: "Reembolsado" },
  FAILED: { variant: "danger", label: "Fallido" },
  ACTIVE: { variant: "success", label: "Activo" },
  INACTIVE: { variant: "neutral", label: "Inactivo" },
  DRAFT: { variant: "neutral", label: "Borrador" },
  APPROVED: { variant: "success", label: "Aprobado" },
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const config = statusBadgeMap[status] || { variant: "neutral" as const, label: status }
  return <AdminBadge variant={config.variant}>{label || config.label}</AdminBadge>
}
