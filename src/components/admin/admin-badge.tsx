import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { ReactNode } from "react"

const adminBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary",
        success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
        warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        danger: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
        info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        outline: "border border-border text-foreground",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
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
  return (
    <span className={cn(adminBadgeVariants({ variant, size }), className)} {...props}>
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
