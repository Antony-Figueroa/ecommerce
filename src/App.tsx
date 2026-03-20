import { Routes, Route, useLocation } from "react-router-dom"
import { useEffect, lazy, useRef } from "react"
import { AuthProvider } from "@/contexts/auth-context"
import { CartProvider } from "@/contexts/cart-context"
import { FavoritesProvider } from "@/contexts/favorites-context"
import { ProtectedRoute } from "@/components/shared/protected-route"
import { UserAccountLayout } from "@/components/layout/user-account-layout"
import { AdminLayout } from "@/components/layout/admin-layout"
import { Toaster } from "@/components/ui/toaster"
import { RootLayout } from "@/components/layout/root-layout"

// Optimizando tamaño del bundle mediante importaciones dinámicas (bundle-dynamic-imports)
const HomePage = lazy(() => import("@/pages/home").then(m => ({ default: m.HomePage })))
const CatalogPage = lazy(() => import("@/pages/catalog").then(m => ({ default: m.CatalogPage })))
const ProductPage = lazy(() => import("@/pages/product").then(m => ({ default: m.ProductPage })))
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
const AdminProvidersPage = lazy(() => import("@/pages/admin/providers").then(m => ({ default: m.AdminProvidersPage })))
const FinancialDashboard = lazy(() => import("@/pages/admin/financial").then(m => ({ default: m.FinancialDashboard })))
const AdminNotificationsPage = lazy(() => import("@/pages/admin/notifications").then(m => ({ default: m.AdminNotificationsPage })))
const AdminAuditPage = lazy(() => import("@/pages/admin/audit").then(m => ({ default: m.AdminAuditPage })))
const AdminKanbanPage = lazy(() => import("@/pages/admin/kanban").then(m => ({ default: m.AdminKanbanPage })))

function App() {
  const location = useLocation()
  const prevPathname = useRef(location.pathname)

  useEffect(() => {
    // Only scroll to top if not in admin area
    // AND not when just switching categories in products page
    const isProductTransition =
      (location.pathname.startsWith('/productos') || location.pathname.startsWith('/catalogo')) &&
      (prevPathname.current.startsWith('/productos') || prevPathname.current.startsWith('/catalogo'))

    if (!location.pathname.startsWith('/admin') && !isProductTransition) {
      window.scrollTo(0, 0)
    }
    prevPathname.current = location.pathname
  }, [location.pathname])

  return (
    <AuthProvider>
      <FavoritesProvider>
        <CartProvider>
          <div className="flex min-h-screen flex-col">
            <Routes>
              {/* Rutas de Administrador - Usan su propio Layout persistente */}
              <Route element={<ProtectedRoute adminOnly={true}><AdminLayout /></ProtectedRoute>}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/orders" element={<AdminOrdersPage />} />
                <Route path="/admin/products" element={<AdminProductsPage />} />
                <Route path="/admin/categories" element={<AdminCategoriesPage />} />
                <Route path="/admin/customers" element={<AdminCustomersPage />} />
                <Route path="/admin/inventory" element={<AdminInventoryPage />} />
                <Route path="/admin/providers" element={<AdminProvidersPage />} />
                <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
                <Route path="/admin/settings" element={<AdminSettingsPage />} />
                <Route path="/admin/financial" element={<FinancialDashboard />} />
                <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
                <Route path="/admin/audit" element={<AdminAuditPage />} />
                <Route path="/admin/kanban" element={<AdminKanbanPage />} />
              </Route>

              {/* Rutas Públicas y de Usuario - Usan RootLayout para Navbar/Footer persistente */}
              <Route element={<RootLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/productos" element={<CatalogPage />} />
                <Route path="/productos/:slug" element={<CatalogPage />} />
                <Route path="/producto/:id" element={<ProductPage />} />
                <Route path="/carrito" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/registro" element={<RegisterPage />} />
                <Route path="/registro/confirmacion" element={<GoogleConfirmPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Rutas de Usuario Protegidas con Layout de Cuenta anidado */}
                <Route element={<ProtectedRoute><UserAccountLayout /></ProtectedRoute>}>
                  <Route path="/perfil" element={<AccountPage />} />
                  <Route path="/pedidos" element={<OrdersPage />} />
                  <Route path="/favoritos" element={<FavoritesPage />} />
                  <Route path="/notificaciones" element={<NotificationsPage />} />
                </Route>

                {/* Catch-all route to redirect to home */}
                <Route path="*" element={<HomePage />} />
              </Route>
            </Routes>
            <Toaster />
          </div>
        </CartProvider>
      </FavoritesProvider>
    </AuthProvider>
  )
}

export default App
