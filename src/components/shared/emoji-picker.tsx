import * as React from "react"
import { Search, Smile } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

interface EmojiPickerProps {
  onSelect: (emoji: string) => void
  children?: React.ReactNode
}

const ALL_EMOJIS = [
  // Medicina / Salud
  "💊", "💉", "🩸", "🌡️", "🧬", "🧪", "⚕️", "🏥", "🚑", "🩺", "🧠", "🦴", "🦷", "🩹", "🩻",
  // Frutas / Comida (Suplementos)
  "🍎", "🍌", "🍒", "🍇", "🍓", "🍋", "🍊", "🍍", "🥑", "🥦", "🥕", "🍯", "🥛", "🍵",
  // Deportes / Fitness
  "💪", "🏃", "🏋️", "🚴", "⛹️", "🧘", "🤸", "👟", "🎒", "🏆", "🥇", "🥊", "🥋",
  // Otros
  "✨", "🌟", "🔥", "💧", "🌿", "🍃", "🍀", "🌸", "📦", "🚚", "🏠", "❤️", "✅", "❌"
]

const EMOJI_NAMES: Record<string, string> = {
  "💊": "pildora medicina pastilla medicamento capsula",
  "💉": "jeringa vacuna inyeccion medicina",
  "🩸": "sangre gota roja",
  "🌡️": "termometro temperatura fiebre",
  "🧬": "adn genetica ciencia",
  "🧪": "tubo ensayo quimica laboratorio",
  "⚕️": "medicina salud doctor",
  "🏥": "hospital clinica salud",
  "🚑": "ambulancia emergencia",
  "🩺": "estetoscopio doctor medico",
  "🧠": "cerebro mente salud",
  "🦴": "hueso calcio",
  "🦷": "diente odontologia",
  "🩹": "curita venda herida",
  "🩻": "rayos x radiografia",
  "🍎": "manzana fruta vitamina",
  "🍌": "banana platano potasio",
  "💪": "musculo fuerza fitness gym",
  "🏃": "correr cardio ejercicio",
  "🏋️": "pesas gimnasio entrenamiento",
  "✨": "brillo especial destacado",
  "🌿": "hierba natural organico planta",
  "🍃": "hoja natural verde",
  "📦": "paquete envio producto",
  "🚚": "camion delivery entrega",
}

export function EmojiPicker({ onSelect, children }: EmojiPickerProps) {
  const [search, setSearch] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)

  const filteredEmojis = ALL_EMOJIS.filter(emoji => {
    if (!search) return true
    const name = EMOJI_NAMES[emoji] || ""
    return name.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children || (
          <Button variant="outline" size="icon" type="button">
            <Smile className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar emoji..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <p className="text-xs font-medium text-muted-foreground px-1">Emoji</p>
          <ScrollArea className="h-[200px]">
            <div className="grid grid-cols-6 gap-1">
              {filteredEmojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-xl transition-colors"
                  onClick={() => {
                    onSelect(emoji)
                    setIsOpen(false)
                    setSearch("")
                  }}
                >
                  {emoji}
                </button>
              ))}
              {filteredEmojis.length === 0 && (
                <p className="col-span-6 text-center text-xs text-muted-foreground py-4">
                  No se encontraron emojis
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  )
}
