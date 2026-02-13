import * as React from "react"
import { useState } from "react"
import { useSearchParams, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react"
import { api } from "@/lib/api"

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setStatus("error")
      setMessage("Las contraseñas no coinciden")
      return
    }

    if (password.length < 8) {
      setStatus("error")
      setMessage("La contraseña debe tener al menos 8 caracteres")
      return
    }

    setLoading(true)
    setStatus("idle")
    setMessage("")

    try {
      await api.post("/auth/reset-password", { token, password })
      setStatus("success")
      setMessage("Tu contraseña ha sido restablecida exitosamente.")
    } catch (err) {
      setStatus("error")
      setMessage(err instanceof Error ? err.message : "Error al restablecer la contraseña")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-[#0A0A0A] font-sans">
      {/* Lado Izquierdo: Contenido */}
      <div className="flex flex-col justify-center px-8 sm:px-12 lg:px-24 py-12 relative overflow-hidden">
        {/* Logo Top Left */}
        <div className="absolute top-8 left-8 lg:left-12">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg transition-transform group-hover:scale-105">
              <span className="text-xl font-black italic">A+</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Ana's</span>
          </Link>
        </div>

        <div className="max-w-[440px] w-full mx-auto space-y-8">
          {!token ? (
            <div className="space-y-6 text-center lg:text-left">
              <div className="flex justify-center lg:justify-start">
                <div className="h-16 w-16 bg-rose-50 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-100 dark:border-rose-500/20 shadow-xl shadow-rose-500/5">
                  <XCircle className="h-8 w-8 text-rose-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Enlace inválido
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  No se ha proporcionado un token de recuperación válido o el enlace ha expirado.
                </p>
              </div>
              <Button asChild className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-base font-bold rounded-2xl transition-all shadow-xl">
                <Link to="/forgot-password">Solicitar nuevo enlace</Link>
              </Button>
            </div>
          ) : status === "success" ? (
            <div className="space-y-6 text-center lg:text-left">
              <div className="flex justify-center lg:justify-start">
                <div className="h-16 w-16 bg-green-50 dark:bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-100 dark:border-green-500/20 shadow-xl shadow-green-500/5">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  ¡Éxito!
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  {message}
                </p>
              </div>
              <Button asChild className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-base font-bold rounded-2xl transition-all shadow-xl">
                <Link to="/login">Ir al Inicio de Sesión</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Nueva contraseña
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  Crea una contraseña segura que no hayas usado antes.
                </p>
              </div>

              {status === "error" && (
                <div className="p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm font-semibold rounded-2xl border border-rose-100 dark:border-rose-500/20 flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-rose-500" />
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Nueva contraseña</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-12 pr-12 h-14 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus:ring-4 focus:ring-primary/10 transition-all rounded-2xl font-medium"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Confirmar contraseña</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-12 pr-12 h-14 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus:ring-4 focus:ring-primary/10 transition-all rounded-2xl font-medium"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-base font-bold rounded-2xl transition-all shadow-xl shadow-slate-200 dark:shadow-none disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Restableciendo...</span>
                    </div>
                  ) : (
                    "Restablecer contraseña"
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Lado Derecho: Imagen y Branding */}
      <div className="hidden lg:block relative p-8">
        <div className="relative h-full w-full rounded-[48px] overflow-hidden group">
          <img
            src="https://images.unsplash.com/photo-1550572017-ed200f5e6343?q=80&w=2000&auto=format&fit=crop"
            alt="Ana's Supplements"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Logo overlay */}
          <div className="absolute top-12 left-12">
            <div className="flex items-center gap-3 text-white">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30">
                <span className="text-2xl font-black italic">A+</span>
              </div>
              <span className="text-2xl font-black tracking-tighter">ANA'S SUPPLEMENTS</span>
            </div>
          </div>

          {/* Content overlay */}
          <div className="absolute bottom-16 left-16 right-16 space-y-6">
            <div className="space-y-4">
              <h2 className="text-5xl font-extrabold text-white leading-[1.1] tracking-tight">
                Recupera tu<br />progreso.
              </h2>
              <p className="text-lg text-slate-200 font-medium max-w-md">
                Estamos aquí para ayudarte a volver a tu camino hacia el bienestar. Crea una nueva contraseña y continúa.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
