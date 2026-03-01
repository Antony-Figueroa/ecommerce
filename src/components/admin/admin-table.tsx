import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface AdminTableProps {
  children: ReactNode
  className?: string
}

export function AdminTable({ children, className }: AdminTableProps) {
  return (
    <div className={cn("overflow-x-auto rounded-xl border border-border/60 bg-white dark:bg-card", className)}>
      <table className="w-full text-sm">
        {children}
      </table>
    </div>
  )
}

interface AdminTableHeaderProps {
  children: ReactNode
  className?: string
}

export function AdminTableHeader({ children, className }: AdminTableHeaderProps) {
  return (
    <thead className={cn("bg-muted/30 border-b border-border/60", className)}>
      {children}
    </thead>
  )
}

interface AdminTableBodyProps {
  children: ReactNode
  className?: string
}

export function AdminTableBody({ children, className }: AdminTableBodyProps) {
  return (
    <tbody className={cn("divide-y divide-border/40", className)}>
      {children}
    </tbody>
  )
}

interface AdminTableRowProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export function AdminTableRow({ children, className, hover = true, onClick }: AdminTableRowProps) {
  return (
    <tr
      className={cn(
        "transition-colors",
        hover && "hover:bg-muted/30",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

interface AdminTableHeadProps {
  children: ReactNode
  className?: string
  align?: "left" | "center" | "right"
}

export function AdminTableHead({ children, className, align = "left" }: AdminTableHeadProps) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className
      )}
    >
      {children}
    </th>
  )
}

interface AdminTableCellProps {
  children: ReactNode
  className?: string
  align?: "left" | "center" | "right"
}

export function AdminTableCell({ children, className, align = "left" }: AdminTableCellProps) {
  return (
    <td
      className={cn(
        "px-4 py-3 text-sm text-foreground",
        align === "center" && "text-center",
        align === "right" && "text-right",
        className
      )}
    >
      {children}
    </td>
  )
}

interface AdminTableEmptyProps {
  colSpan?: number
  message?: string
}

export function AdminTableEmpty({ colSpan = 6, message = "No hay datos disponibles" }: AdminTableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-muted-foreground">
        <p className="text-sm">{message}</p>
      </td>
    </tr>
  )
}
