import { Button, type ButtonProps } from "@/components/ui/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { ReactNode } from "react"

const adminButtonVariants = cva(
  "inline-flex items-center justify-center rounded-xl font-bold transition-all duration-200",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20 hover:shadow-md hover:scale-[1.02] active:scale-[0.98]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
        outline: "border border-border bg-transparent hover:bg-muted hover:border-muted-foreground/30",
        ghost: "hover:bg-muted hover:text-foreground",
        danger: "bg-rose-500 text-white hover:bg-rose-600 shadow-sm shadow-rose-500/20",
        success: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-500/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
      loading: {
        true: "opacity-50 pointer-events-none",
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

interface AdminButtonProps
  extends Omit<ButtonProps, "variant" | "size">,
    VariantProps<typeof adminButtonVariants> {
  children: ReactNode
  loading?: boolean
}

export function AdminButton({ 
  className, 
  variant, 
  size, 
  loading, 
  children, 
  ...props 
}: AdminButtonProps) {
  return (
    <Button
      className={cn(adminButtonVariants({ variant, size, loading }), className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  )
}

interface AdminButtonIconProps extends ButtonProps {
  children: ReactNode
  loading?: boolean
}

export function AdminButtonIcon({ 
  className, 
  loading, 
  children, 
  variant = "ghost",
  size = "icon",
  ...props 
}: AdminButtonIconProps) {
  return (
    <Button
      variant={variant}
      size={size}
      className={cn("transition-all duration-200 hover:scale-105", className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </Button>
  )
}
