import * as React from "react"
import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react"
import { api } from "@/lib/api"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      await api.post("/auth/forgot-password", { email })
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar la solicitud")
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
          {submitted ? (
            <div className="space-y-6 text-center lg:text-left">
              <div className="flex justify-center lg:justify-start">
                <div className="h-16 w-16 bg-green-50 dark:bg-green-500/10 rounded-2xl flex items-center justify-center border border-green-100 dark:border-green-500/20 shadow-xl shadow-green-500/5">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Correo enviado
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  Si el correo <strong className="text-slate-900 dark:text-white">{email}</strong> está registrado, recibirás un enlace para restablecer tu contraseña.
                </p>
              </div>
              <Button asChild className="w-full h-14 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-base font-bold rounded-2xl transition-all shadow-xl">
                <Link to="/login">Volver al Inicio de Sesión</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  ¿Olvidaste tu contraseña?
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  No te preocupes, dinos tu correo y te ayudaremos a recuperarla.
                </p>
              </div>

              {error && (
                <div className="p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-sm font-semibold rounded-2xl border border-rose-100 dark:border-rose-500/20 flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-rose-500" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Email</Label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      className="pl-12 h-14 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 focus:ring-4 focus:ring-primary/10 transition-all rounded-2xl font-medium"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                      <span>Enviando enlace...</span>
                    </div>
                  ) : (
                    "Enviar enlace de recuperación"
                  )}
                </Button>
              </form>

              <div className="pt-2">
                <Link to="/login" className="flex items-center justify-center gap-2 text-sm font-bold text-slate-500 hover:text-primary transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                  Volver al Inicio de Sesión
                </Link>
              </div>
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
                Protegemos tu<br />cuenta.
              </h2>
              <p className="text-lg text-slate-200 font-medium max-w-md">
                Tu seguridad es nuestra prioridad. Sigue los pasos para recuperar el acceso de forma segura.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
