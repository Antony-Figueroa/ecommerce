import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface FilterSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: Array<{
    value: string
    label: string
    count?: number
  }>
  placeholder?: string
  className?: string
}

export function FilterSelect({ 
  value, 
  onValueChange, 
  options, 
  placeholder = "Seleccionar",
  className 
}: FilterSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={cn("w-[140px] h-9 text-xs font-bold uppercase tracking-wider", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="text-xs font-bold">
            <span className="flex items-center justify-between gap-2">
              {option.label}
              {option.count !== undefined && (
                <span className="ml-2 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                  {option.count}
                </span>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
