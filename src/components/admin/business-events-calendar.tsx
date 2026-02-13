import { useState, useMemo } from "react"
import { 
  Edit,
  Trash2,
  ChevronLeft, 
  ChevronRight, 
  DollarSign, 
  Package, 
  AlertTriangle,
  Info,
  Plus,
  Bell
} from "lucide-react"
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval,
  isToday,
  parseISO,
  startOfDay,
  isBefore
} from "date-fns"
import { es } from "date-fns/locale"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type EventType = 'SALE' | 'REQUIREMENT' | 'LOW_STOCK' | 'CUSTOM' | 'ALERT'

export interface BusinessEvent {
  id: string
  type: EventType
  title: string
  date: string
  amount?: number
  status?: string
  description?: string
  isFuture?: boolean
}

interface BusinessEventsCalendarProps {
  events: BusinessEvent[]
  onDateClick?: (date: Date) => void
  onEditEvent?: (event: BusinessEvent) => void
  onDeleteEvent?: (id: string) => void
  isLoading?: boolean
}

export function BusinessEventsCalendar({ events, onDateClick, onEditEvent, onDeleteEvent, isLoading }: BusinessEventsCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    return eachDayOfInterval({
      start: startDate,
      end: endDate,
    })
  }, [currentMonth])

  const getEventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(parseISO(event.date), day))
  }

  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between px-2 py-4">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: es })}
          </h2>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Eventos de Negocio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth} className="h-8 w-8 rounded-lg">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())} className="h-8 px-3 text-xs font-bold uppercase tracking-wider">
            Hoy
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth} className="h-8 w-8 rounded-lg">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  const renderDays = () => {
    const dateFormat = "eeee"
    const weekDays = []
    const startDate = startOfWeek(currentMonth)

    for (let i = 0; i < 7; i++) {
      weekDays.push(
        <div key={i} className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-muted-foreground py-2">
          {format(addDays(startDate, i), dateFormat, { locale: es }).substring(0, 3)}
        </div>
      )
    }

    return <div className="grid grid-cols-7 border-b border-slate-100 dark:border-border/50">{weekDays}</div>
  }

  const isSystemEvent = (id: string | number) => {
    const sId = id.toString()
    return sId.includes('-') && (sId.startsWith('sale-') || sId.startsWith('req-') || sId.startsWith('lowstock-'))
  }

  const renderCells = () => {
    const rows: JSX.Element[] = []
    let daysInRow: JSX.Element[] = []

    days.forEach((day, i) => {
      const dayEvents = getEventsForDay(day)
      const isCurrentMonth = isSameMonth(day, startOfMonth(currentMonth))
      const isPast = isBefore(startOfDay(day), startOfDay(new Date()))
      
      daysInRow.push(
        <div
          key={day.toString()}
          className={cn(
            "min-h-[80px] sm:min-h-[100px] border-r border-b border-slate-100 dark:border-border/50 p-1 sm:p-2 transition-colors relative group",
            !isCurrentMonth ? "bg-slate-50/50 dark:bg-muted/5" : "bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-muted/10",
            isToday(day) && "bg-primary/5 dark:bg-primary/10",
            isPast ? "cursor-default grayscale-[0.2] opacity-80" : "cursor-pointer"
          )}
          onClick={() => !isPast && onDateClick?.(day)}
        >
          <div className="flex justify-between items-start">
            <span className={cn(
              "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors",
              !isCurrentMonth ? "text-slate-300 dark:text-muted-foreground/30" : "text-slate-600 dark:text-slate-400",
              isToday(day) && "bg-primary text-white"
            )}>
              {format(day, "d")}
            </span>
            <div className="flex items-center gap-1">
              {!isPast && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDateClick?.(day)
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
              {dayEvents.length > 0 && (
                <Badge variant="secondary" className="h-4 px-1 text-[8px] font-bold">
                  {dayEvents.length}
                </Badge>
              )}
            </div>
          </div>
          
                    <div className="space-y-1 overflow-hidden">
                      {dayEvents.slice(0, 3).map((event) => (
                        <TooltipProvider key={event.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div 
                                className={cn(
                                  "flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold truncate transition-transform hover:scale-[1.02]",
                                  event.type === 'SALE' && "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
                                  event.type === 'REQUIREMENT' && "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
                                  event.type === 'LOW_STOCK' && "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
                                  event.type === 'CUSTOM' && "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
                                  event.type === 'ALERT' && "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
                                  event.isFuture && "border border-dashed border-current opacity-80",
                                   !isSystemEvent(event.id) ? "cursor-pointer" : "cursor-default"
                                 )}
                                 onClick={(e) => {
                                   if (!isSystemEvent(event.id)) {
                                     e.stopPropagation()
                                     onEditEvent?.(event)
                                   }
                                 }}
                              >
                                {event.type === 'SALE' && <DollarSign className="h-2.5 w-2.5 shrink-0" />}
                                {event.type === 'REQUIREMENT' && <Package className="h-2.5 w-2.5 shrink-0" />}
                                {event.type === 'LOW_STOCK' && <AlertTriangle className="h-2.5 w-2.5 shrink-0" />}
                                {event.type === 'CUSTOM' && <Info className="h-2.5 w-2.5 shrink-0" />}
                                {event.type === 'ALERT' && <Bell className="h-2.5 w-2.5 shrink-0" />}
                                <span className="truncate">{event.title}</span>
                              </div>
                            </TooltipTrigger>
                  <TooltipContent side="top" className="p-2 max-w-[200px]">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-bold text-xs">{event.title}</p>
                        {!isSystemEvent(event.id) && (
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={(e) => {
                                e.stopPropagation()
                                onEditEvent?.(event)
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteEvent?.(event.id)
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      {event.amount && <p className="text-[10px] text-green-600 font-bold">Monto: ${event.amount.toFixed(2)}</p>}
                      {event.status && <p className="text-[10px] font-medium">Estado: {event.status}</p>}
                      {event.description && <p className="text-[10px] text-muted-foreground leading-tight">{event.description}</p>}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
            {dayEvents.length > 3 && (
              <Popover>
                <PopoverTrigger asChild>
                  <button 
                    className="text-[8px] text-muted-foreground font-bold pl-1 hover:text-primary transition-colors cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    + {dayEvents.length - 3} más...
                  </button>
                </PopoverTrigger>
                <PopoverContent 
                  side="right" 
                  className="w-64 p-3 shadow-2xl border-slate-200 dark:border-border/60"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider">
                        {dayEvents.length} Eventos - {format(day, "d 'de' MMMM", { locale: es })}
                      </h4>
                    </div>
                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                      {dayEvents.map((event) => (
                        <div 
                          key={event.id}
                          className={cn(
                            "flex flex-col gap-1 p-2 rounded-lg border text-[10px] transition-all hover:shadow-sm",
                            event.type === 'SALE' && "bg-green-50/50 border-green-100 text-green-800 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-400",
                            event.type === 'REQUIREMENT' && "bg-blue-50/50 border-blue-100 text-blue-800 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-400",
                            event.type === 'LOW_STOCK' && "bg-orange-50/50 border-orange-100 text-orange-800 dark:bg-orange-950/20 dark:border-orange-900/30 dark:text-orange-400",
                            event.type === 'CUSTOM' && "bg-purple-50/50 border-purple-100 text-purple-800 dark:bg-purple-950/20 dark:border-purple-900/30 dark:text-purple-400",
                            event.type === 'ALERT' && "bg-red-50/50 border-red-100 text-red-800 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400"
                          )}
                        >
                          <div className="flex items-center justify-between gap-1.5 font-bold">
                            <div className="flex items-center gap-1.5">
                              {event.type === 'SALE' && <DollarSign className="h-3 w-3" />}
                              {event.type === 'REQUIREMENT' && <Package className="h-3 w-3" />}
                              {event.type === 'LOW_STOCK' && <AlertTriangle className="h-3 w-3" />}
                              {event.type === 'CUSTOM' && <Info className="h-3 w-3" />}
                              {event.type === 'ALERT' && <Bell className="h-3 w-3" />}
                              <span className="truncate">{event.title}</span>
                            </div>
                            
                            {!isSystemEvent(event.id) && (
                              <div className="flex items-center gap-0.5 ml-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50/50"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onEditEvent?.(event)
                                  }}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50/50"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onDeleteEvent?.(event.id)
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                          {event.description && (
                            <p className="text-[9px] text-muted-foreground leading-relaxed pl-4">
                              {event.description}
                            </p>
                          )}
                          {event.amount && (
                            <div className="pl-4 flex items-center gap-1">
                              <span className="text-[9px] font-medium opacity-70">Monto:</span>
                              <span className="text-[9px] font-bold text-green-600 dark:text-green-400">
                                ${event.amount.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>
      )

      if ((i + 1) % 7 === 0) {
        rows.push(
          <div key={i} className="grid grid-cols-7">
            {daysInRow}
          </div>
        )
        daysInRow = []
      }
    })

    return <div className="border-l border-slate-100 dark:border-border/50">{rows}</div>
  }

  return (
    <Card className="overflow-hidden border-slate-200/60 dark:border-border/60 shadow-xl bg-white dark:bg-card">
      <CardHeader className="p-0 border-b border-slate-100 dark:border-border/50 bg-slate-50/50 dark:bg-muted/5">
        {renderHeader()}
      </CardHeader>
      <CardContent className="p-0">
        {renderDays()}
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary animate-pulse">Cargando eventos...</p>
              </div>
            </div>
          )}
          {renderCells()}
        </div>
        
        {/* Legend */}
        <div className="p-4 bg-slate-50/50 dark:bg-muted/5 border-t border-slate-100 dark:border-border/50 flex flex-wrap gap-4 items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-200" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Ventas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-200" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Requerimientos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-200" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Stock Bajo</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-muted-foreground">
            <Info className="h-3 w-3" />
            <span className="text-[9px] font-medium italic">Haz clic en un día para ver detalles</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
