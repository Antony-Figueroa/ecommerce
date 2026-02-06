import * as React from "react"
import { X, Check, ChevronsUpDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"

interface MultiSelectProps {
  options: { label: string; value: string }[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
  onCreateOption?: (label: string) => Promise<{ label: string; value: string } | null>
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Seleccionar opciones...",
  className,
  onCreateOption,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)

  const handleUnselect = (value: string) => {
    onChange(selected.filter((s) => s !== value))
  }

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const handleCreateOption = async () => {
    if (!onCreateOption || !inputValue.trim()) return

    try {
      setIsCreating(true)
      const newOption = await onCreateOption(inputValue.trim())
      if (newOption) {
        handleSelect(newOption.value)
        setInputValue("")
      }
    } catch (error) {
      console.error("Error creating option:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  )

  const showCreateOption = onCreateOption && 
    inputValue.trim() !== "" && 
    !options.some(opt => opt.label.toLowerCase() === inputValue.toLowerCase().trim())

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-auto min-h-10 px-3 py-2",
            className
          )}
        >
          <div className="flex flex-wrap gap-1">
            {selected.length > 0 ? (
              selected.map((value) => {
                const option = options.find((o) => o.value === value)
                return (
                  <Badge
                    key={value}
                    variant="secondary"
                    className="mr-1 mb-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUnselect(value)
                    }}
                  >
                    {option?.label || value}
                    <X className="ml-1 h-3 w-3 cursor-pointer" />
                  </Badge>
                )
              })
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="p-2 border-b">
          <input
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Buscar o añadir..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && showCreateOption) {
                e.preventDefault()
                handleCreateOption()
              }
            }}
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-2">
          {showCreateOption && (
            <div
              className="flex items-center space-x-2 p-2 rounded-sm hover:bg-accent cursor-pointer text-primary font-medium mb-2 border border-dashed border-primary/50"
              onClick={handleCreateOption}
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm">
                {isCreating ? "Creando..." : `Añadir "${inputValue}"`}
              </span>
            </div>
          )}
          
          {filteredOptions.length === 0 && !showCreateOption ? (
            <p className="text-sm text-muted-foreground p-2 text-center">No hay opciones disponibles</p>
          ) : (
            <div className="space-y-1">
              {filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center space-x-2 p-2 rounded-sm hover:bg-accent cursor-pointer"
                  onClick={() => handleSelect(option.value)}
                >
                  <Checkbox
                    checked={selected.includes(option.value)}
                    onCheckedChange={() => handleSelect(option.value)}
                  />
                  <label className="text-sm font-medium leading-none cursor-pointer flex-1">
                    {option.label}
                  </label>
                  {selected.includes(option.value) && (
                    <Check className="h-4 w-4 ml-auto" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
