import { Routes, Route, useLocation } from "react-router-dom"
import { useEffect } from "react"
import { AuthProvider } from "@/contexts/auth-context"
import { CartProvider } from "@/contexts/cart-context"
import { FavoritesProvider } from "@/contexts/favorites-context"
import { Navbar } from "@/components/layout/navbar"
import { Footer } from "@/components/layout/footer"
import { WhatsAppButton } from "@/components/shared/whatsapp-button"
import { HomePage } from "@/pages/home"
import { CatalogPage } from "@/pages/catalog"
import { ProductPage } from "@/pages/product"
import { CartPage } from "@/pages/cart"
import { LoginPage } from "@/pages/login"
import { RegisterPage } from "@/pages/register"
import { FavoritesPage } from "@/pages/favorites"
import { OrdersPage } from "@/pages/orders"
import NotificationsPage from "@/pages/notifications"
import { AccountPage } from "@/pages/account"
import { GoogleConfirmPage } from "@/pages/google-confirm"
import VerifyEmailPage from "@/pages/verify-email"
import ForgotPasswordPage from "@/pages/forgot-password"
import ResetPasswordPage from "@/pages/reset-password"
import { AdminDashboard } from "@/pages/admin/dashboard"
import { AdminOrdersPage } from "@/pages/admin/orders"
import { AdminProductsPage } from "@/pages/admin/products"
import { AdminCategoriesPage } from "@/pages/admin/categories"
import { AdminCustomersPage } from "@/pages/admin/customers"
import { AdminInventoryPage } from "@/pages/admin/inventory"
import { AdminAnalyticsPage } from "@/pages/admin/analytics"
import { AdminSettingsPage } from "@/pages/admin/settings"
import { FinancialDashboard } from "@/pages/admin/financial"
import { AdminNotificationsPage } from "@/pages/admin/notifications"
import { ProtectedRoute } from "@/components/shared/protected-route"
import { UserAccountLayout } from "@/components/layout/user-account-layout"

import { Toaster } from "@/components/ui/toaster"

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
