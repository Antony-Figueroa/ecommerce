import { Routes, Route, useLocation } from "react-router-dom"
import { useEffect, lazy, Suspense } from "react"
import { AuthProvider } from "@/contexts/auth-context"
import { CartProvider } from "@/contexts/cart-context"
import { FavoritesProvider } from "@/contexts/favorites-context"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { WhatsAppButton } from "@/components/shared/whatsapp-button"
import { HomePage } from "@/pages/home"
import { CatalogPage } from "@/pages/catalog"
import { ProductPage } from "@/pages/product"
import { ProtectedRoute } from "@/components/shared/protected-route"
import { UserAccountLayout } from "@/components/layout/user-account-layout"
import { Toaster } from "@/components/ui/toaster"
import { Loader2 } from "lucide-react"

// Optimizando tamaño del bundle mediante importaciones dinámicas (bundle-dynamic-imports)
const CartPage = lazy(() => import("@/pages/cart").then(m => ({ default: m.CartPage })))
const LoginPage = lazy(() => import("@/pages/login").then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import("@/pages/register").then(m => ({ default: m.RegisterPage })))
const FavoritesPage = lazy(() => import("@/pages/favorites").then(m => ({ default: m.FavoritesPage })))
const OrdersPage = lazy(() => import("@/pages/orders").then(m => ({ default: m.OrdersPage })))
const NotificationsPage = lazy(() => import("@/pages/notifications"))
const AccountPage = lazy(() => import("@/pages/account").then(m => ({ default: m.AccountPage })))
const GoogleConfirmPage = lazy(() => import("@/pages/google-confirm").then(m => ({ default: m.GoogleConfirmPage })))
const VerifyEmailPage = lazy(() => import("@/pages/verify-email"))
const ForgotPasswordPage = lazy(() => import("@/pages/forgot-password"))
const ResetPasswordPage = lazy(() => import("@/pages/reset-password"))

// Admin Pages
const AdminDashboard = lazy(() => import("@/pages/admin/dashboard").then(m => ({ default: m.AdminDashboard })))
const AdminOrdersPage = lazy(() => import("@/pages/admin/orders").then(m => ({ default: m.AdminOrdersPage })))
const AdminProductsPage = lazy(() => import("@/pages/admin/products").then(m => ({ default: m.AdminProductsPage })))
const AdminCategoriesPage = lazy(() => import("@/pages/admin/categories").then(m => ({ default: m.AdminCategoriesPage })))
const AdminCustomersPage = lazy(() => import("@/pages/admin/customers").then(m => ({ default: m.AdminCustomersPage })))
const AdminInventoryPage = lazy(() => import("@/pages/admin/inventory").then(m => ({ default: m.AdminInventoryPage })))
const AdminAnalyticsPage = lazy(() => import("@/pages/admin/analytics").then(m => ({ default: m.AdminAnalyticsPage })))
const AdminSettingsPage = lazy(() => import("@/pages/admin/settings").then(m => ({ default: m.AdminSettingsPage })))
const FinancialDashboard = lazy(() => import("@/pages/admin/financial").then(m => ({ default: m.FinancialDashboard })))
const AdminNotificationsPage = lazy(() => import("@/pages/admin/notifications").then(m => ({ default: m.AdminNotificationsPage })))

function PageLoader() {
  return (
    <div className="flex h-[60vh] w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

function App() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  const isAdminPath = location.pathname.startsWith("/admin")
  const isAuthPath = [
    "/login", 
    "/registro", 
    "/registro/confirmacion",
    "/verify-email",
    "/forgot-password",
    "/reset-password"
  ].includes(location.pathname)
  const hideLayout = isAdminPath || isAuthPath

  return (
    <AuthProvider>
      <FavoritesProvider>
        <CartProvider>
          <div className="flex min-h-screen flex-col">
            {!hideLayout && <Navbar />}
            <main className="flex-1">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/productos" element={<CatalogPage />} />
                  <Route path="/productos/:slug" element={<CatalogPage />} />
                  <Route path="/ofertas" element={<CatalogPage offersOnly={true} />} />
                  <Route path="/producto/:id" element={<ProductPage />} />
                  <Route path="/carrito" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/registro" element={<RegisterPage />} />
                  <Route path="/registro/confirmacion" element={<GoogleConfirmPage />} />
                  <Route path="/verify-email" element={<VerifyEmailPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  
                  {/* Rutas de Usuario Protegidas con Layout de Cuenta */}
                  <Route element={<ProtectedRoute><UserAccountLayout /></ProtectedRoute>}>
                    <Route path="/perfil" element={<AccountPage />} />
                    <Route path="/pedidos" element={<OrdersPage />} />
                    <Route path="/favoritos" element={<FavoritesPage />} />
                    <Route path="/notificaciones" element={<NotificationsPage />} />
                  </Route>
                  
                  {/* Admin Routes Protegidas */}
                  <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/admin/orders" element={<ProtectedRoute adminOnly={true}><AdminOrdersPage /></ProtectedRoute>} />
                  <Route path="/admin/products" element={<ProtectedRoute adminOnly={true}><AdminProductsPage /></ProtectedRoute>} />
                  <Route path="/admin/categories" element={<ProtectedRoute adminOnly={true}><AdminCategoriesPage /></ProtectedRoute>} />
                  <Route path="/admin/customers" element={<ProtectedRoute adminOnly={true}><AdminCustomersPage /></ProtectedRoute>} />
                  <Route path="/admin/inventory" element={<ProtectedRoute adminOnly={true}><AdminInventoryPage /></ProtectedRoute>} />
                  <Route path="/admin/analytics" element={<ProtectedRoute adminOnly={true}><AdminAnalyticsPage /></ProtectedRoute>} />
                  <Route path="/admin/settings" element={<ProtectedRoute adminOnly={true}><AdminSettingsPage /></ProtectedRoute>} />
                  <Route path="/admin/financial" element={<ProtectedRoute adminOnly={true}><FinancialDashboard /></ProtectedRoute>} />
                  <Route path="/admin/notifications" element={<ProtectedRoute adminOnly={true}><AdminNotificationsPage /></ProtectedRoute>} />
                </Routes>
              </Suspense>
            </main>
            {!hideLayout && <Footer />}
            {!hideLayout && <WhatsAppButton />}
            <Toaster />
          </div>
        </CartProvider>
      </FavoritesProvider>
    </AuthProvider>
  )
}

export default App
