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
} from "@/components/ui/select"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { 
  BookOpen, 
  Download, 
  Eye, 
  GripVertical, 
  Loader2, 
  Settings,
  ChevronLeft,
  ChevronRight,
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

const CATALOG_YEAR = new Date().getFullYear()

export function AdminCatalogPage() {
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [categories, setCategories] = useState<CatalogCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"preview" | "edit">("preview")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [gridCols, setGridCols] = useState<2 | 3>(3)
  const [showSettings, setShowSettings] = useState(false)
  const [catalogTitle, setCatalogTitle] = useState("CATÁLOGO DE PRODUCTOS")
  const [currentPage, setCurrentPage] = useState(0)
  const [exporting, setExporting] = useState(false)
  
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchCatalogData()
  }, [])

  const fetchCatalogData = async () => {
    try {
      setLoading(true)
      const data = await api.getCatalogData()
      setProducts(data.products || [])
      setCategories(data.categories || [])
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
    } catch (error) {
      console.error("Error toggling visibility:", error)
    }
  }

  const visibleProducts = products.filter(p => 
    p.visible && (selectedCategory === "all" || p.categoryId === selectedCategory)
  )

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
    if (!previewRef.current) return
    
    setExporting(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).default

      const element = previewRef.current
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 794,
        windowHeight: 1123
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('portrait', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`catalogo-productos-${CATALOG_YEAR}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
    } finally {
      setExporting(false)
    }
  }

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
    <div className="h-[1123px] w-[794px] bg-white p-16 flex flex-col items-center justify-center text-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/30" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-200/20 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center">
          <span className="text-white text-3xl font-bold">A</span>
        </div>
        
        <h1 className="text-7xl font-bold text-gray-900 tracking-tight mb-4">
          {catalogTitle}
        </h1>
        <p className="text-3xl text-emerald-600 font-medium mb-12">{CATALOG_YEAR}</p>
        
        <div className="w-32 h-1 mx-auto bg-gradient-to-r from-transparent via-emerald-500 to-transparent mb-12" />
        
        <p className="text-xl text-gray-500 font-light">
          Suplementos vitaminicos y nutricionales
        </p>
        <p className="text-lg text-gray-400 mt-2">
          Para una vida saludable
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

      <div className="flex gap-4 mb-6">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={String(gridCols)} onValueChange={(v) => setGridCols(Number(v) as 2 | 3)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Columnas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2">2 columnas</SelectItem>
            <SelectItem value="3">3 columnas</SelectItem>
          </SelectContent>
        </Select>
        
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
            <div className="grid gap-4">
              <div className="grid grid-cols-12 gap-4 text-xs font-bold text-gray-500 uppercase tracking-wider pb-2 border-b">
                <div className="col-span-1">Orden</div>
                <div className="col-span-5">Producto</div>
                <div className="col-span-3">Categoría</div>
                <div className="col-span-2 text-center">Visible</div>
              </div>
              
              {visibleProducts.map((product, index) => (
                <div key={product.id} className="grid grid-cols-12 gap-4 items-center py-2 border-b border-gray-50">
                  <div className="col-span-1 flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-gray-300 cursor-grab" />
                    <span className="text-sm font-bold text-gray-500">{index + 1}</span>
                  </div>
                  <div className="col-span-5 flex items-center gap-3">
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
                  <div className="col-span-3">
                    <Badge variant="outline" className="text-xs">
                      {product.category?.name || "Sin categoría"}
                    </Badge>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configuración del Catálogo</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-bold mb-2 block">Título del Catálogo</label>
              <Input
                value={catalogTitle}
                onChange={(e) => setCatalogTitle(e.target.value)}
                placeholder="CATÁLOGO DE PRODUCTOS"
              />
            </div>
            
            <div>
              <label className="text-sm font-bold mb-2 block">Diseño de Grilla</label>
              <Select value={String(gridCols)} onValueChange={(v) => setGridCols(Number(v) as 2 | 3)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2x2 (4 productos por página)</SelectItem>
                  <SelectItem value="3">3x3 (9 productos por página)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500">
                <strong>Productos visibles:</strong> {visibleProducts.length} de {products.length}
              </p>
              <p className="text-sm text-gray-500">
                <strong>Categorías:</strong> {categories.length}
              </p>
              <p className="text-sm text-gray-500">
                <strong>Páginas estimadas:</strong> {renderPreview().length}
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowSettings(false)} className="font-bold">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
