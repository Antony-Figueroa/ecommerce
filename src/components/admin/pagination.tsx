import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  onItemsPerPageChange?: (itemsPerPage: number) => void
  showItemsPerPage?: boolean
  itemsPerPageOptions?: number[]
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = false,
  itemsPerPageOptions = [10, 25, 50, 100],
  className
}: PaginationProps) {
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  const getPageNumbers = () => {
    const pages: (number | "...")[] = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push("...")
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push("...")
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push("...")
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push("...")
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  if (totalPages === 0) return null

  return (
    <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 py-4", className)}>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          Mostrando <span className="font-medium text-foreground">{startItem}-{endItem}</span> de{" "}
          <span className="font-medium text-foreground">{totalItems}</span> resultados
        </span>
        {showItemsPerPage && (
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange?.(Number(e.target.value))}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {itemsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option} por página
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hidden sm:flex"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            page === "..." ? (
              <span key={`ellipsis-${index}`} className="px-1 text-muted-foreground">...</span>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "ghost"}
                size="icon"
                className="h-8 w-8 min-w-[2rem]"
                onClick={() => onPageChange(page)}
              >
                {page}
              </Button>
            )
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hidden sm:flex"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

interface usePaginationReturn {
  currentPage: number
  totalPages: number
  paginatedItems: <T>(items: T[]) => T[]
  setPage: (page: number) => void
  setItemsPerPage: (count: number) => void
  reset: () => void
}

export function usePagination(totalItems: number, defaultItemsPerPage = 10): usePaginationReturn {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPageState] = useState(defaultItemsPerPage)

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const paginatedItems = <T,>(items: T[]): T[] => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return items.slice(start, end)
  }

  const setPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const handleSetItemsPerPage = (count: number) => {
    setItemsPerPageState(count)
    setCurrentPage(1)
  }

  const reset = () => {
    setCurrentPage(1)
  }

  return {
    currentPage,
    totalPages,
    paginatedItems,
    setPage,
    setItemsPerPage: handleSetItemsPerPage,
    reset
  }
}
