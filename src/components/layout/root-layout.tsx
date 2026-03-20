import { Outlet, useLocation } from "react-router-dom"
import { Navbar } from "./navbar"
import { Footer } from "./footer"
import { AIChat } from "@/components/chat/AIChat"
import { Suspense } from "react"
import { PageLoader } from "@/components/shared/page-loader"

export function RootLayout() {
  const location = useLocation()
  
  const isAuthPath = [
    "/login", 
    "/registro", 
    "/registro/confirmacion",
    "/verify-email",
    "/forgot-password",
    "/reset-password"
  ].includes(location.pathname)

  // Si es una ruta de autenticación, solo mostramos el contenido sin Navbar/Footer
  if (isAuthPath) {
    return (
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
    )
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <AIChat />
    </>
  )
}
