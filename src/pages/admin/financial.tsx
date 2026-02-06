import { useState, useEffect, useMemo } from "react"
import {
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  Plus,
  Minus,
  Calculator,
  FileText,
  History,
  Settings,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { AdminLayout } from "@/components/layout/admin-layout"
import { formatUSD, formatBS, cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface Product {
  id: string
  name: string
  sku: string
  stock: number
  purchasePrice: number
  shippingCost: number
  profitMargin: number
  price: number
}

interface CartItem {
  product: Product
  quantity: number
}

interface BCVRate {
  rate: number
  timestamp: string
}

export function FinancialDashboard() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [bcvRate, setBcvRate] = useState<BCVRate>({ rate: 375.00, timestamp: new Date().toISOString() })
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [isUpdatingBcv, setIsUpdatingBcv] = useState(false)

  // Memoize totals to avoid recalculation on every render
  const totals = useMemo(() => {
    const totalCostUSD = cart.reduce((sum, item) => {
      const purchasePrice = Number(item.product?.purchasePrice) || 0
      const shippingCost = Number(item.product?.shippingCost) || 0
      return sum + (purchasePrice + shippingCost) * (item.quantity || 0)
    }, 0)

    const totalUSD = cart.reduce((sum, item) => {
      const price = Number(item.product?.price) || 0
      return sum + price * (item.quantity || 0)
    }, 0)

    const rate = Number(bcvRate?.rate) || 375.00
    const totalBs = totalUSD * rate
    const profitUSD = totalUSD - totalCostUSD
    const profitBs = profitUSD * rate

    return {
      totalCostUSD,
      totalUSD,
      totalBs,
      profitUSD,
      profitBs
    }
  }, [cart, bcvRate])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Usar la API real para el BCV
      const rateData = await api.getBCVStatus()
      if (rateData && rateData.currentRate) {
        setBcvRate({ 
          rate: Number(rateData.currentRate.rate) || 375.00, 
          timestamp: rateData.currentRate.createdAt || rateData.currentRate.timestamp || new Date().toISOString() 
        })
      }

      // Usar la API real para productos y ventas (ahora con el cliente api)
      const [productsData, salesData] = await Promise.all([
        api.get<{ products: Product[] }>("/admin/products"),
        api.get<{ sales: any[] }>("/admin/sales?limit=10").catch(() => ({ sales: [] })),
      ])

      if (productsData && productsData.products) {
        setProducts(productsData.products)
      }
      if (salesData && salesData.sales) {
        setSales(salesData.sales)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      // Demo data if API fails
      if (products.length === 0) {
        setProducts([
          { id: "1", name: "Paracetamol 500mg", sku: "PAR-001", stock: 45, purchasePrice: 5.50, shippingCost: 2.00, profitMargin: 1.5, price: 11.25 },
          { id: "2", name: "Ibuprofeno 400mg", sku: "IBU-002", stock: 8, purchasePrice: 8.75, shippingCost: 2.00, profitMargin: 1.5, price: 16.13 },
          { id: "3", name: "Amoxicilina 500mg", sku: "AMO-003", stock: 3, purchasePrice: 12.00, shippingCost: 2.50, profitMargin: 1.6, price: 23.20 },
          { id: "4", name: "Vitamina C 1000mg", sku: "VIT-004", stock: 120, purchasePrice: 15.00, shippingCost: 1.50, profitMargin: 1.4, price: 23.10 },
        ])
      }
    }
  }

  const handleUpdateBcv = async () => {
    setIsUpdatingBcv(true)
    try {
      const result = await api.forceBCVUpdate()
      console.log("Resultado de actualización BCV:", result)
      
      const newRate = Number(result.record?.rate || result.rate)
      
      if (isNaN(newRate) || newRate <= 0) {
        throw new Error("La API devolvió una tasa inválida")
      }

      setBcvRate({ 
        rate: newRate, 
        timestamp: result.record?.createdAt || result.record?.timestamp || new Date().toISOString() 
      })
      
      toast({
        title: "Tasa actualizada",
        description: `La tasa BCV se ha actualizado a Bs ${formatBS(newRate)}`,
      })
    } catch (error) {
      console.error("Error updating BCV rate:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la tasa BCV automáticamente.",
        variant: "destructive",
      })
    } finally {
        setIsUpdatingBcv(false)
    }
  }

  const handleManualBcvUpdate = async (newRate: number) => {
    if (!newRate || isNaN(newRate) || newRate <= 0) {
      toast({
        title: "Error",
        description: "Por favor ingresa una tasa válida",
        variant: "destructive"
      })
      return
    }

    setIsUpdatingBcv(true)
    try {
      const result = await api.setBCVRateManual(newRate)
      const confirmedRate = Number(result.rate)
      setBcvRate({ 
        rate: isNaN(confirmedRate) ? newRate : confirmedRate, 
        timestamp: result.record?.createdAt || new Date().toISOString() 
      })
      toast({
        title: "Tasa actualizada manualmente",
        description: `La tasa BCV se ha establecido a Bs ${formatBS(result.rate)}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la tasa manualmente.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingBcv(false)
    }
  }

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId))
  }

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    )
  }



  const processSale = async () => {
    if (cart.length === 0) return

    const items = cart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
    }))

    try {
      const response = await fetch("http://localhost:3001/api/financial/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          bcvRate: bcvRate.rate,
          customerName: "Venta directa",
        }),
      })

      if (response.ok) {
        setCart([])
        fetchData()
        toast({
          title: "Venta procesada",
          description: "Venta procesada exitosamente!",
        })
      }
    } catch (error) {
      toast({
        title: "Venta procesada (demo)",
        description: "La venta se procesó en modo demo.",
      })
      setCart([])
    }
  }



  return (
    <AdminLayout title="Gestión Financiera">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground">Gestion de inventario, ventas y ganancias</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xs text-green-600 font-medium">TASA BCV</p>
                <div className="flex flex-col">
                  <p className="text-lg font-bold text-green-700 leading-none">Bs {formatBS(bcvRate?.rate || 0)}</p>
                  <p className="text-[10px] text-green-600 mt-1">
                    Act: {bcvRate?.timestamp ? new Date(bcvRate.timestamp).toLocaleString('es-VE', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: '2-digit', 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true 
                    }) : 'Cargando...'}
                  </p>
                </div>
              </div>
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  disabled={isUpdatingBcv}
                >
                  {isUpdatingBcv ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Settings className="h-4 w-4 mr-2" />
                  )}
                  Gestionar Tasa
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Tasa de Cambio (BCV)</h4>
                    <p className="text-sm text-muted-foreground">
                      Actualiza la tasa para cálculos en Bolívares.
                    </p>
                  </div>
                  <div className="grid gap-4">
                    <div className="flex flex-col gap-2">
                      <label htmlFor="manual-rate" className="text-sm font-medium">Establecer manualmente</label>
                      <div className="flex gap-2">
                        <Input
                          id="manual-rate"
                          type="number"
                          step="0.01"
                          placeholder={bcvRate?.rate?.toString() || "0.00"}
                          className="h-9"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleManualBcvUpdate(parseFloat(e.currentTarget.value))
                            }
                          }}
                        />
                        <Button 
                          size="sm" 
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement
                            handleManualBcvUpdate(parseFloat(input.value))
                          }}
                        >
                          OK
                        </Button>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">o</span>
                      </div>
                    </div>
                    <Button 
                      variant="secondary" 
                      className="w-full"
                      onClick={handleUpdateBcv}
                      disabled={isUpdatingBcv}
                    >
                      <RefreshCw className={cn("h-4 w-4 mr-2", isUpdatingBcv && "animate-spin")} />
                      Actualizar desde API
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="pos" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Punto de Venta
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Inventario
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Ventas
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Reportes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-100">
                      <DollarSign className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Ventas (Bs)</p>
                      <p className="text-2xl font-bold">Bs {formatBS(totals.totalBs)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-green-100">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ganancia (Bs)</p>
                      <p className="text-2xl font-bold text-green-600">Bs {formatBS(totals.profitBs)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-purple-100">
                      <Package className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Productos</p>
                      <p className="text-2xl font-bold">{products.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-yellow-100">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Stock Bajo</p>
                      <p className="text-2xl font-bold">{products.filter(p => p.stock < 10).length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Resumen de Venta Actual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Inversión Total (USD):</span>
                      <span className="font-medium">${formatUSD(totals.totalCostUSD)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Ventas Totales (USD):</span>
                      <span className="font-medium">${formatUSD(totals.totalUSD)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-2 border-t">
                      <span className="text-muted-foreground font-semibold">Total en Bolívares:</span>
                      <span className="font-bold text-lg">Bs {formatBS(totals.totalBs)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-semibold">Ganancia en Bolívares:</span>
                      <span className="font-bold">Bs {formatBS(totals.profitBs)}</span>
                    </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground font-semibold">Margen de Utilidad Promedio:</span>
                        <span>{totals.totalCostUSD > 0 ? formatUSD((totals.profitUSD / totals.totalCostUSD) * 100).replace(/\.00$/, '') : 0}%</span>
                      </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estado del Inventario</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {products.slice(0, 5).map(product => (
                      <div key={product.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{product.name}</span>
                        </div>
                        <Badge variant={product.stock < 10 ? "destructive" : product.stock < 20 ? "secondary" : "default"}>
                          {product.stock} uds
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pos" className="space-y-6 mt-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Productos Disponibles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      {products.map(product => (
                        <div key={product.id} className="p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                            </div>
                            <Badge variant={product.stock < 10 ? "destructive" : "default"}>
                              Stock: {product.stock}
                            </Badge>
                          </div>
                          <div className="mt-3 flex justify-between items-center">
                            <div className="text-sm">
                              <p className="text-muted-foreground">Costo: ${formatUSD(product.purchasePrice + product.shippingCost)}</p>
                              <p className="font-semibold text-green-600">Venta: ${formatUSD(product.price)}</p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => addToCart(product)}
                              disabled={product.stock === 0}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Agregar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Carrito de Venta</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cart.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">Carrito vacio</p>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {cart.map(item => (
                            <div key={item.product.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex-1">
                                <p className="text-sm font-medium truncate">{item.product.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  ${formatUSD(item.product.price)} x {item.quantity}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="border-t pt-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total (USD)</span>
                            <span>${formatUSD(totals.totalUSD)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Costo (USD)</span>
                            <span>${formatUSD(totals.totalCostUSD)}</span>
                          </div>
                          <div className="flex justify-between text-sm font-bold pt-2 border-t">
                            <span>Total (Bs)</span>
                            <span>Bs {formatBS(totals.totalBs)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-green-600 font-bold">
                            <span>Ganancia (Bs)</span>
                            <span>Bs {formatBS(totals.profitBs)}</span>
                          </div>
                        </div>

                        <Button className="w-full" size="lg" onClick={processSale}>
                          <DollarSign className="h-4 w-4 mr-2" />
                          Procesar Venta
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Inventario con Costos</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4">Producto</th>
                      <th className="text-left p-4">SKU</th>
                      <th className="text-right p-4">Stock</th>
                      <th className="text-right p-4">Costo Compra</th>
                      <th className="text-right p-4">Envio</th>
                      <th className="text-right p-4">Costo Total</th>
                      <th className="text-right p-4">Precio Venta</th>
                      <th className="text-right p-4">Margen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map(product => (
                      <tr key={product.id} className="border-b">
                        <td className="p-4 font-medium">{product.name}</td>
                        <td className="p-4 text-muted-foreground">{product.sku}</td>
                        <td className="p-4 text-right">
                          <Badge variant={product.stock < 10 ? "destructive" : "secondary"}>
                            {product.stock}
                          </Badge>
                        </td>
                        <td className="p-4 text-right">${formatUSD(product.purchasePrice)}</td>
                        <td className="p-4 text-right">${formatUSD(product.shippingCost)}</td>
                        <td className="p-4 text-right">
                          ${formatUSD(product.purchasePrice + product.shippingCost)}
                        </td>
                        <td className="p-4 text-right">
                          ${formatUSD(product.price)}
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant="outline">{Number(product.profitMargin * 100).toFixed(0)}%</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Historial de Ventas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sales.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No hay ventas registradas</p>
                  ) : (
                    sales.map(sale => (
                      <div key={sale.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{sale.saleNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(sale.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">Bs {formatBS(sale.totalBs)}</p>
                            <p className="text-xs text-green-600 font-medium">
                              Ganancia: Bs {formatBS(sale.realProfit)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6 mt-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <FileText className="h-12 w-12 mx-auto text-blue-500 mb-4" />
                  <h3 className="font-semibold mb-2">Reporte de Ventas</h3>
                  <p className="text-sm text-muted-foreground">
                    Genera un reporte detallado de todas las ventas con ganancias por producto
                  </p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <Package className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h3 className="font-semibold mb-2">Reporte de Inventario</h3>
                  <p className="text-sm text-muted-foreground">
                    Estado actual del inventario con valores y alertas de stock
                  </p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-12 w-12 mx-auto text-purple-500 mb-4" />
                  <h3 className="font-semibold mb-2">Reporte Financiero</h3>
                  <p className="text-sm text-muted-foreground">
                    Resumen de ingresos, ganancias y metricas financieras
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Generar Reporte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium">Fecha Inicio</label>
                    <Input type="date" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Fecha Fin</label>
                    <Input type="date" />
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full">Generar Reporte</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
