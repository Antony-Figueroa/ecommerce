import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
    Search,
    ShoppingCart,
    Package,
    Users,
    Box,
    Tag,
    Truck,
    Settings,
    Plus,
    ArrowRight,
    History,
    X,
    LayoutDashboard,
    CreditCard,
    FileText
} from "lucide-react"

import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface CommandPaletteProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

const ITEMS = [
    {
        category: "Rutas del Sistema",
        items: [
            { id: "dashboard", label: "Inicio / Dashboard", path: "/admin", icon: LayoutDashboard, keywords: ["inicio", "resumen"] },
            { id: "orders", label: "Pedidos / Ventas", path: "/admin/orders", icon: ShoppingCart, keywords: ["pedidos", "ventas", "ordenes"] },
            { id: "products", label: "Productos / Catálogo", path: "/admin/products", icon: Package, keywords: ["productos", "articulos", "catalogo"] },
            { id: "inventory", label: "Inventario / Stock", path: "/admin/inventory", icon: Box, keywords: ["inventario", "stock", "existencias"] },
            { id: "customers", label: "Clientes / Usuarios", path: "/admin/customers", icon: Users, keywords: ["clientes", "usuarios"] },
            { id: "categories", label: "Categorías de Productos", path: "/admin/categories", icon: Tag, keywords: ["categorias", "secciones"] },
            { id: "providers", label: "Proveedores", path: "/admin/providers", icon: Truck, keywords: ["proveedores", "suppliers"] },
            { id: "financial", label: "Caja y Finanzas", path: "/admin/financial", icon: CreditCard, keywords: ["caja", "finanzas", "dinero", "cobros"] },
            { id: "reports", label: "Reportes y Análisis", path: "/admin/analytics", icon: FileText, keywords: ["reportes", "analisis", "estadisticas"] },
            { id: "settings", label: "Configuración del Sistema", path: "/admin/settings", icon: Settings, keywords: ["configuracion", "ajustes", "preferencias"] },
        ]
    },
    {
        category: "Acciones Rápidas",
        items: [
            { id: "new-order", label: "Crear Nueva Orden", path: "/admin/orders?action=new", icon: Plus, keywords: ["nueva", "crear", "orden"] },
            { id: "new-product", label: "Agregar Nuevo Producto", path: "/admin/products?action=new", icon: Plus, keywords: ["nuevo", "agregar", "producto"] },
            { id: "new-category", label: "Nueva Categoría", path: "/admin/categories?action=new", icon: Plus, keywords: ["nueva", "categoria"] },
            { id: "transfer", label: "Transferencia de Mercancía", path: "/admin/inventory?action=transfer", icon: ArrowRight, keywords: ["transferencia", "traspaso", "stock"] },
        ]
    }
]

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
    const navigate = useNavigate()
    const [query, setQuery] = React.useState("")
    const [recentSearches, setRecentSearches] = React.useState<string[]>(() => {
        const saved = localStorage.getItem("recent_admin_searches")
        return saved ? JSON.parse(saved) : ["Órdenes", "Inventario", "Categorías"]
    })

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                onOpenChange(true)
            }
        }
        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [onOpenChange])

    const filteredItems = React.useMemo(() => {
        if (!query) return ITEMS

        const search = query.toLowerCase()
        return ITEMS.map(section => ({
            ...section,
            items: section.items.filter(item =>
                item.label.toLowerCase().includes(search) ||
                item.keywords.some(k => k.includes(search))
            )
        })).filter(section => section.items.length > 0)
    }, [query])

    const handleSelect = (path: string, label: string) => {
        // Add to recent searches
        const cleanLabel = label.split(" / ")[0]
        const updated = [cleanLabel, ...recentSearches.filter(s => s !== cleanLabel)].slice(0, 4)
        setRecentSearches(updated)
        localStorage.setItem("recent_admin_searches", JSON.stringify(updated))

        navigate(path)
        onOpenChange(false)
        setQuery("")
    }

    const removeRecent = (search: string, e: React.MouseEvent) => {
        e.stopPropagation()
        const updated = recentSearches.filter(s => s !== search)
        setRecentSearches(updated)
        localStorage.setItem("recent_admin_searches", JSON.stringify(updated))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="p-0 border-0 shadow-2xl max-w-2xl bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl">
                <div className="flex flex-col h-full overflow-hidden rounded-xl">
                    {/* Header */}
                    <div className="relative flex items-center px-4 border-b border-neutral-100 dark:border-white/10">
                        <Search className="w-5 h-5 text-neutral-400 mr-3" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="¿Qué estás buscando? (Rutas, acciones, herramientas...)"
                            className="flex-1 h-14 bg-transparent border-0 focus-visible:ring-0 text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-base"
                            autoFocus
                        />
                        <div className="flex items-center gap-1 absolute right-12 top-1/2 -translate-y-1/2 pointer-events-none">
                            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-neutral-200 dark:border-white/10 bg-neutral-50 dark:bg-neutral-900 px-1.5 font-mono text-[10px] font-medium text-neutral-400 opacity-100">
                                ESC
                            </kbd>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[60vh] p-3">
                        {/* Recent Searches */}
                        {!query && recentSearches.length > 0 && (
                            <div className="mb-6 px-3 pt-2">
                                <p className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                    <History className="w-3 h-3" /> Últimas búsquedas
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {recentSearches.map(search => (
                                        <button
                                            key={search}
                                            onClick={() => setQuery(search)}
                                            className="group flex items-center gap-1.5 px-3 py-1.5 bg-neutral-50 dark:bg-neutral-900 hover:bg-primary/10 hover:text-primary rounded-full text-xs font-semibold text-neutral-600 dark:text-neutral-400 transition-all border border-neutral-200/50 dark:border-white/5"
                                        >
                                            {search}
                                            <X
                                                className="w-3 h-3 opacity-40 hover:opacity-100 cursor-pointer"
                                                onClick={(e) => removeRecent(search, e)}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Results */}
                        <div className="space-y-4">
                            {filteredItems.map(section => (
                                <div key={section.category} className="space-y-1">
                                    <p className="px-3 text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-2 mt-2">
                                        {section.category}
                                    </p>
                                    {section.items.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => handleSelect(item.path, item.label)}
                                            className="w-full group flex items-center px-3 py-3 rounded-2xl hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all text-left relative overflow-hidden active:scale-[0.98]"
                                        >
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 group-hover:h-8 bg-emerald-500 transition-all rounded-r-full" />

                                            <div className="w-12 h-12 rounded-full bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center mr-4 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 transition-colors border border-neutral-100 dark:border-white/5 group-hover:border-emerald-200 dark:group-hover:border-emerald-500/30">
                                                <item.icon className="w-5 h-5 text-neutral-500 dark:text-neutral-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-emerald-900 dark:group-hover:text-emerald-200 truncate">
                                                        {item.label}
                                                    </span>
                                                    {/* Optional: Add numeric indicators like in reference image */}
                                                    {Math.random() > 0.7 && (
                                                        <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                                            {Math.floor(Math.random() * 100)}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate group-hover:text-emerald-600/60 dark:group-hover:text-emerald-400/60">
                                                    {item.path}
                                                </p>
                                            </div>

                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-neutral-800 shadow-sm border border-neutral-100 dark:border-white/10">
                                                <ArrowRight className="w-4 h-4 text-emerald-600" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ))}

                            {filteredItems.length === 0 && (
                                <div className="py-12 text-center">
                                    <div className="w-16 h-16 bg-neutral-50 dark:bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-8 h-8 text-neutral-300" />
                                    </div>
                                    <p className="text-sm font-bold text-neutral-900 dark:text-white">Sin resultados</p>
                                    <p className="text-xs text-neutral-400 mt-1">No pudimos encontrar nada igual a "{query}"</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Info */}
                    <div className="px-6 py-4 bg-neutral-50/50 dark:bg-neutral-900/50 border-t border-neutral-100 dark:border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <kbd className="h-5 rounded border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-800 px-1.5 font-mono text-[10px] font-medium text-neutral-500">
                                    ↑↓
                                </kbd>
                                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Navegar</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <kbd className="h-5 rounded border border-neutral-200 dark:border-white/10 bg-white dark:bg-neutral-800 px-1.5 font-mono text-[10px] font-medium text-neutral-500">
                                    ENTER
                                </kbd>
                                <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Seleccionar</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-neutral-400 font-bold flex items-center gap-1">
                            Antigravity <span className="text-emerald-500">AI Search</span>
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
