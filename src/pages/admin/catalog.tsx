import { useState, useEffect, useRef } from "react"
import { api } from "@/lib/api"
import { AdminPageHeader } from "@/components/admin/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectWithSearch,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  BookOpen,
  Download,
  Eye,
  GripVertical,
  Loader2,
  Settings,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react"

interface CatalogProduct {
  id: string
  name: string
  brand: string
  format: string
  description: string
  image: string | null
  price: number
  categoryId: string | null
  category: { name: string } | null
  visible: boolean
  order: number
}

interface CatalogCategory {
  id: string
  name: string
  image: string | null
  productCount: number
}

interface CatalogBrand {
  id: string
  name: string
}

const CATALOG_YEAR = new Date().getFullYear()

export function AdminCatalogPage() {
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [brands, setBrands] = useState<CatalogBrand[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"preview" | "edit">("preview")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [gridCols, setGridCols] = useState<2 | 3>(3)
  const [showSettings, setShowSettings] = useState(false)
  const [catalogTitle, setCatalogTitle] = useState("CATÁLOGO DE PRODUCTOS")
  const [currentPage, setCurrentPage] = useState(0)
  const [exporting, setExporting] = useState(false)

  // New features state
  const [brandFilter, setBrandFilter] = useState<string>("all")
  const [formatFilter, setFormatFilter] = useState<string>("all")
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [showImageWarning, setShowImageWarning] = useState(true)
  const [exportCategory, setExportCategory] = useState<string>("all")

  // Brand customization (in settings)
  const [brandLogo, setBrandLogo] = useState<string>("")
  const [brandColor, setBrandColor] = useState<string>("#10b981")
  const [brandName, setBrandName] = useState<string>("Ana's Supplements")

  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchCatalogData()
  }, [])

  // Derived filters
  const formats = Array.from(new Set(products.map(p => p.format).filter(Boolean)))

  const filteredProducts = products.filter(p =>
    p.visible &&
    (selectedCategory === "all" || p.categoryId === selectedCategory) &&
    (brandFilter === "all" || p.brand === brandFilter) &&
    (formatFilter === "all" || p.format === formatFilter) &&
    (selectedProducts.size === 0 || selectedProducts.has(p.id))
  )

  const productsWithoutImage = products.filter(p => !p.image && p.visible)

  const fetchCatalogData = async () => {
    try {
      setLoading(true)
      const data = await api.getCatalogData()
      setProducts(data.products || [])
      setCategories(data.categories || [])

      // Extract unique brands
      const uniqueBrands = Array.from(new Set(data.products.map((p: CatalogProduct) => p.brand).filter(Boolean)))
        .map((name, index) => ({ id: String(index), name: name as string }))
      setBrands(uniqueBrands)

      // Auto-select all visible products
      const visibleIds = data.products.filter((p: CatalogProduct) => p.visible).map((p: CatalogProduct) => p.id)
      setSelectedProducts(new Set(visibleIds))
    } catch (error) {
      console.error("Error fetching catalog data:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleVisibility = async (productId: string, visible: boolean) => {
    try {
      await api.updateCatalogProductVisibility(productId, visible)
      setProducts(prev => prev.map(p =>
        p.id === productId ? { ...p, visible } : p
      ))
      setSelectedProducts(prev => {
        const next = new Set<string>(prev)
        if (visible) {
          next.add(productId)
        } else {
          next.delete(productId)
        }
        return next
      })
    } catch (error) {
      console.error("Error toggling visibility:", error)
    }
  }

  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
  }

  const selectAllVisible = () => {
    const visibleIds = products.filter(p => p.visible).map(p => p.id)
    setSelectedProducts(new Set(visibleIds))
  }

  const deselectAll = () => {
    setSelectedProducts(new Set())
  }

  const getCategoryPageNumber = (categoryId: string) => {
    let page = 2
    for (const cat of categories) {
      if (cat.id === categoryId) break
      const catProducts = products.filter(p => p.categoryId === cat.id && p.visible)
      page += Math.ceil(catProducts.length / (gridCols * 2)) + 1
    }
    return page
  }

  const generatePDF = async () => {
    if (!previewRef.current) return;

    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 794,
        windowHeight: 1123,
        // ESTE BLOQUE ES EL "ANTI-OKLCH" DEFINITIVO
        onclone: (clonedDoc) => {
          const elements = clonedDoc.getElementsByTagName("*");
          for (let i = 0; i < elements.length; i++) {
            const el = elements[i] as HTMLElement;
            const style = window.getComputedStyle(el);

            // 1. Limpiar background-color
            if (style.backgroundColor.includes("oklch")) {
              el.style.backgroundColor = "#ffffff";
            }
            // 2. Limpiar color de texto
            if (style.color.includes("oklch")) {
              el.style.color = "#000000";
            }
            // 3. Limpiar bordes
            if (style.borderColor.includes("oklch")) {
              el.style.borderColor = "#e5e7eb";
            }
            // 4. ELIMINAR SOMBRAS (Causan mucho error de oklch en Tailwind v3.4+)
            if (style.boxShadow.includes("oklch") || style.boxShadow !== "none") {
              el.style.boxShadow = "none";
            }
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('portrait', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`catalogo-productos-${CATALOG_YEAR}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Hubo un error al generar el PDF. Revisa la consola.");
    } finally {
      setExporting(false);
    }
  };

  const renderProductCard = (product: CatalogProduct) => (
    <div key={product.id} className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
      <div className="aspect-square bg-gray-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <div className="text-gray-300 text-4xl font-light">No Image</div>
        )}
      </div>
      <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">{product.brand}</p>
      <h4 className="font-bold text-gray-800 text-sm leading-tight mb-1 line-clamp-2">{product.name}</h4>
      <p className="text-xs text-gray-500 mb-2">{product.format}</p>
      <p className="text-xs text-gray-600 line-clamp-2">{product.description}</p>
    </div>
  )

  const renderCoverPage = () => (
    // Añadimos un ID para identificarlo en el onclone y cambiamos bg-white por estilo inline
    <div id="catalog-capture-area" className="h-[1123px] w-[794px] p-16 flex flex-col items-center justify-center text-center relative overflow-hidden" style={{ backgroundColor: '#ffffff' }}>

      {/* Reemplaza los divs de gradientes por colores sólidos o quítalos temporalmente */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom right, #ecfdf5, #ffffff)' }} />

      <div className="relative z-10">
        {/* Usar style={{ backgroundColor: '...' }} es mucho más seguro para html2canvas */}
        <div className="w-24 h-24 mx-auto mb-8 rounded-2xl flex items-center justify-center shadow-lg" style={{ backgroundColor: '#059669' }}>
          <span className="text-white text-3xl font-bold">A</span>
        </div>

        <h1 className="text-7xl font-bold text-gray-900 tracking-tight mb-4">
          {catalogTitle}
        </h1>
        <p className="text-3xl font-medium mb-12" style={{ color: '#10b981' }}>{CATALOG_YEAR}</p>

        <div className="w-32 h-1 mx-auto mb-12" style={{ backgroundColor: '#10b981' }} />

        <p className="text-xl text-gray-500 font-light">
          Suplementos vitaminicos y nutricionales
        </p>
      </div>

      <div className="absolute bottom-16 left-0 right-0 text-center">
        <p className="text-sm text-gray-400">www.anas-supplements.com</p>
      </div>
    </div>
  )

  const renderTOCPage = () => (
    <div className="h-[1123px] w-[794px] bg-white p-16">
      <h2 className="text-4xl font-bold text-gray-900 mb-12">Índice</h2>

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div>
            <span className="text-xl font-bold text-gray-800"> Introducción</span>
          </div>
          <span className="text-lg text-gray-400">1</span>
        </div>

        {categories.map((category) => (
          <div key={category.id} className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <span className="text-xl font-medium text-gray-700">{category.name}</span>
              <span className="text-sm text-gray-400 ml-3">({category.productCount} productos)</span>
            </div>
            <span className="text-lg text-gray-400">{getCategoryPageNumber(category.id)}</span>
          </div>
        ))}
      </div>
    </div>
  )

  const renderCategoryPage = (category: CatalogCategory) => {
    const categoryProducts = products.filter(p => p.categoryId === category.id && p.visible)
    const pages: CatalogProduct[][] = []

    for (let i = 0; i < categoryProducts.length; i += gridCols * 2) {
      pages.push(categoryProducts.slice(i, i + gridCols * 2))
    }

    return pages.map((pageProducts, pageIndex) => (
      <div key={`${category.id}-${pageIndex}`} className="h-[1123px] w-[794px] bg-white p-12 flex flex-col">
        {pageIndex === 0 && (
          <div className="text-center mb-12 pb-8 border-b border-gray-100">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">{category.name}</h2>
            <p className="text-xl text-emerald-600">{category.productCount} productos</p>
          </div>
        )}

        <div className={`grid grid-cols-${gridCols} gap-8 flex-1`}>
          {pageProducts.map(product => (
            <div key={product.id} className="flex flex-col">
              {renderProductCard(product)}
            </div>
          ))}
        </div>

        <div className="mt-auto pt-8 border-t border-gray-100 flex justify-between text-sm text-gray-400">
          <span>{catalogTitle} {CATALOG_YEAR}</span>
          <span>{category.name}</span>
        </div>
      </div>
    ))
  }

  const renderPreview = () => {
    const pages: JSX.Element[] = []

    pages.push(renderCoverPage())
    pages.push(renderTOCPage())

    categories.forEach(category => {
      pages.push(...renderCategoryPage(category))
    })

    return pages
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Catálogo Digital"
        subtitle="Previsualiza y exporta tu catálogo de productos"
        icon={BookOpen}
        rightContent={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSettings(true)}
              className="font-bold"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configuración
            </Button>
            <Button
              onClick={generatePDF}
              disabled={exporting}
              className="font-bold bg-emerald-600 hover:bg-emerald-700"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Exportar PDF
            </Button>
          </div>
        }
      />

      <div className="flex gap-4 mb-6 flex-wrap">
        <SelectWithSearch
          value={selectedCategory}
          onValueChange={setSelectedCategory}
          options={[{ value: "all", label: "Todas las categorías" }, ...categories.map(cat => ({ value: cat.id, label: cat.name }))]}
          placeholder="Categoría"
          triggerClassName="w-[180px]"
          minItemsForSearch={5}
        />

        <SelectWithSearch
          value={brandFilter}
          onValueChange={setBrandFilter}
          options={[{ value: "all", label: "Todas las marcas" }, ...brands.map(brand => ({ value: brand.name, label: brand.name }))]}
          placeholder="Marca"
          triggerClassName="w-[150px]"
          minItemsForSearch={5}
        />

        <Select value={formatFilter} onValueChange={setFormatFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Formato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los formatos</SelectItem>
            {formats.map(fmt => (
              <SelectItem key={fmt} value={fmt}>{fmt}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(gridCols)} onValueChange={(v) => setGridCols(Number(v) as 2 | 3)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Columnas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2x2</SelectItem>
            <SelectItem value="3">3x3</SelectItem>
          </SelectContent>
        </Select>

        {showImageWarning && productsWithoutImage.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
              {productsWithoutImage.length} sin imagen
            </span>
            <button onClick={() => setShowImageWarning(false)} className="text-amber-400 hover:text-amber-600">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="flex-1" />

        <div className="flex gap-2">
          <Button
            variant={viewMode === "preview" ? "default" : "outline"}
            onClick={() => setViewMode("preview")}
            size="sm"
            className="font-bold"
          >
            <Eye className="h-4 w-4 mr-2" />
            Previsualizar
          </Button>
          <Button
            variant={viewMode === "edit" ? "default" : "outline"}
            onClick={() => setViewMode("edit")}
            size="sm"
            className="font-bold"
          >
            <Settings className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      {viewMode === "preview" ? (
        <div className="bg-gray-100 p-8 rounded-xl overflow-auto">
          <div className="flex gap-4 mb-4 items-center justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-bold">
              Página {currentPage + 1} de {renderPreview().length}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(Math.min(renderPreview().length - 1, currentPage + 1))}
              disabled={currentPage === renderPreview().length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex justify-center">
            <div
              ref={previewRef}
              id="catalog-capture-area" // Añade este ID
              className="scale-[0.7] origin-top shadow-2xl"
              style={{ width: '794px', height: '1123px' }}
            >
              {renderPreview()[currentPage]}
            </div>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={selectAllVisible} className="text-xs font-bold">
                  Seleccionar todos
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAll} className="text-xs font-bold">
                  Deseleccionar todos
                </Button>
                <span className="text-xs text-muted-foreground">
                  {selectedProducts.size} / {products.filter(p => p.visible).length} productos seleccionados
                </span>
              </div>
              <Select value={exportCategory} onValueChange={setExportCategory}>
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue placeholder="Exportar categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4">
              <div className="grid grid-cols-12 gap-4 text-xs font-bold text-gray-500 uppercase tracking-wider pb-2 border-b">
                <div className="col-span-1">#</div>
                <div className="col-span-1">
                  <Checkbox
                    checked={selectedProducts.size === products.filter(p => p.visible).length && products.filter(p => p.visible).length > 0}
                    onCheckedChange={(checked) => checked ? selectAllVisible() : deselectAll()}
                  />
                </div>
                <div className="col-span-4">Producto</div>
                <div className="col-span-2">Categoría</div>
                <div className="col-span-2">Imagen</div>
                <div className="col-span-2 text-center">Visible</div>
              </div>

              {filteredProducts.map((product, index) => (
                <div key={product.id} className="grid grid-cols-12 gap-4 items-center py-2 border-b border-gray-50 hover:bg-muted/30 rounded-lg px-2">
                  <div className="col-span-1 flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-gray-300 cursor-grab" />
                    <span className="text-sm font-bold text-gray-500">{index + 1}</span>
                  </div>
                  <div className="col-span-1">
                    <Checkbox
                      checked={selectedProducts.has(product.id)}
                      onCheckedChange={() => toggleProductSelection(product.id)}
                    />
                  </div>
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-gray-300 text-xs">N/A</span>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.brand} • {product.format}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Badge variant="outline" className="text-xs">
                      {product.category?.name || "Sin categoría"}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    {product.image ? (
                      <Badge variant="success" className="text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Con imagen
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Sin imagen
                      </Badge>
                    )}
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <Checkbox
                      checked={product.visible}
                      onCheckedChange={(checked) => toggleVisibility(product.id, !!checked)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-xl max-h-[85vh]">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Settings className="h-5 w-5 text-emerald-600" />
              Configuración del Catálogo
            </DialogTitle>
            <DialogDescription>
              Personaliza el diseño y contenido de tu catálogo digital
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[calc(85vh-180px)] pr-4">
            <div className="space-y-6 py-4">
              {/* Título y Diseño */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Diseño del Catálogo
                </h3>

                <div className="grid gap-4">
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Título Principal</label>
                    <Input
                      value={catalogTitle}
                      onChange={(e) => setCatalogTitle(e.target.value)}
                      placeholder="CATÁLOGO DE PRODUCTOS"
                      className="font-medium"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Este título aparece en la portada</p>
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-2 block">Diseño de Grilla</label>
                    <Select value={String(gridCols)} onValueChange={(v) => setGridCols(Number(v) as 2 | 3)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">
                          <div className="flex items-center gap-2">
                            <div className="grid grid-cols-2 gap-1 w-8 h-8">
                              <div className="bg-primary/20 rounded" />
                              <div className="bg-primary/20 rounded" />
                              <div className="bg-primary/20 rounded" />
                              <div className="bg-primary/20 rounded" />
                            </div>
                            <span>2x2 (4 productos por página)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="3">
                          <div className="flex items-center gap-2">
                            <div className="grid grid-cols-3 gap-0.5 w-8 h-8">
                              <div className="bg-primary/20 rounded" />
                              <div className="bg-primary/20 rounded" />
                              <div className="bg-primary/20 rounded" />
                              <div className="bg-primary/20 rounded" />
                              <div className="bg-primary/20 rounded" />
                              <div className="bg-primary/20 rounded" />
                              <div className="bg-primary/20 rounded" />
                              <div className="bg-primary/20 rounded" />
                              <div className="bg-primary/20 rounded" />
                            </div>
                            <span>3x3 (9 productos por página)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Personalización de Marca */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Identidad de Marca
                </h3>

                <div className="grid gap-4">
                  <div>
                    <label className="text-sm font-semibold mb-2 block">Nombre de la Empresa</label>
                    <Input
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Ana's Supplements"
                      className="font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-2 block">Color de Acento</label>
                    <div className="flex gap-3">
                      <div className="relative">
                        <input
                          type="color"
                          value={brandColor}
                          onChange={(e) => setBrandColor(e.target.value)}
                          className="w-12 h-10 rounded-lg border cursor-pointer bg-transparent"
                        />
                      </div>
                      <Input
                        value={brandColor}
                        onChange={(e) => setBrandColor(e.target.value)}
                        placeholder="#10b981"
                        className="flex-1 font-mono"
                      />
                      <div
                        className="w-10 h-10 rounded-lg border"
                        style={{ backgroundColor: brandColor }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold mb-2 block">URL del Logo</label>
                    <Input
                      value={brandLogo}
                      onChange={(e) => setBrandLogo(e.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Deja vacío para usar el color de acento</p>
                  </div>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Resumen del Catálogo
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Productos visibles</p>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{products.filter(p => p.visible).length}</p>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Con imagen</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{products.filter(p => p.image).length}</p>
                  </div>
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Sin imagen</p>
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{productsWithoutImage.length}</p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
                    <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">Páginas</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{renderPreview().length}</p>
                  </div>
                </div>

                {productsWithoutImage.length > 0 && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                      ⚠️ {productsWithoutImage.length} productos no tienen imagen asignada. Agrega imágenes para un catálogo más profesional.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="pt-4 border-t">
            <Button onClick={() => setShowSettings(false)} className="font-bold w-full sm:w-auto">
              Listo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
