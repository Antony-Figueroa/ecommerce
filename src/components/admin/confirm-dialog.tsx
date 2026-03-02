import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Loader2,
  XCircle,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export interface ConfirmDialogConfig {
  open: boolean
  title: string
  description: string
  onConfirm: () => void
  variant?: "default" | "destructive" | "success"
  confirmText?: string
  cancelText?: string
  loading?: boolean
  icon?: "warning" | "success" | "info" | "error"
}

interface ConfirmDialogProps {
  config: ConfirmDialogConfig
  onOpenChange: (open: boolean) => void
}

export function ConfirmDialog({ config, onOpenChange }: ConfirmDialogProps) {
  const {
    title,
    description,
    onConfirm,
    variant = "default",
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    loading = false,
    icon = "info"
  } = config

  const handleConfirm = async () => {
    await onConfirm()
  }

  const getIcon = () => {
    const iconClass = "h-5 w-5"
    switch (icon) {
      case "warning":
        return <AlertTriangle className={`${iconClass} text-amber-500`} />
      case "success":
        return <CheckCircle2 className={`${iconClass} text-emerald-500`} />
      case "error":
        return <XCircle className={`${iconClass} text-rose-500`} />
      default:
        return <HelpCircle className={`${iconClass} text-primary`} />
    }
  }

  const getButtonVariant = () => {
    switch (variant) {
      case "destructive":
        return "destructive"
      case "success":
        return "default"
      default:
        return "default"
    }
  }

  return (
    <Dialog open={config.open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getIcon()}
            {title}
          </DialogTitle>
          <DialogDescription className="pt-2 text-base">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={getButtonVariant()}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface useConfirmDialogReturn {
  confirmConfig: ConfirmDialogConfig
  confirmAction: (config: Omit<ConfirmDialogConfig, "open">) => void
  ConfirmDialogComponent: () => JSX.Element
}

export function useConfirmDialog(): useConfirmDialogReturn {
  const [confirmConfig, setConfirmConfig] = useState<ConfirmDialogConfig>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  })

  const confirmAction = (config: Omit<ConfirmDialogConfig, "open">) => {
    setConfirmConfig({ ...config, open: true })
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setConfirmConfig((prev) => ({ ...prev, open: false }))
    }
  }

  const ConfirmDialogComponent = () => (
    <ConfirmDialog config={confirmConfig} onOpenChange={handleOpenChange} />
  )

  return {
    confirmConfig,
    confirmAction,
    ConfirmDialogComponent,
  }
}
