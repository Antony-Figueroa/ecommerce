import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface AdminCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  padding?: "none" | "sm" | "md" | "lg"
}

export function AdminCard({ children, className, hover = false, padding = "md" }: AdminCardProps) {
  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8"
  }

  return (
    <div
      className={cn(
        "bg-white dark:bg-card rounded-2xl border border-border/60 shadow-sm",
        "transition-all duration-300",
        hover && "hover:shadow-md hover:border-border/80",
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  )
}

interface AdminCardHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function AdminCardHeader({ title, description, action, className }: AdminCardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between mb-4", className)}>
      <div>
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

interface AdminCardContentProps {
  children: ReactNode
  className?: string
}

export function AdminCardContent({ children, className }: AdminCardContentProps) {
  return <div className={cn("", className)}>{children}</div>
}
