"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner" 

// Importamos el puente
import { createClient } from "@/lib/supabase"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState("")



const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  setError("")
  setCargando(true)

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) throw new Error("Credenciales inválidas")

    if (authData.user) {
      // AQUÍ LA MAGIA: Consultamos el rol en la tabla perfiles
      const { data: perfil, error: perfilError } = await supabase
        .from("perfiles")
        .select("rol")
        .eq("id", authData.user.id)
        .single()

      if (perfilError) throw new Error("Error al obtener el perfil")

      toast.success("¡Bienvenida de nuevo!")

      // Redirección inteligente
      if (perfil.rol === "admin") {
        router.push("/admin/dashboard")
      } else {
        router.push("/dashboard")
      }
    }
  } catch (err: any) {
    toast.error(err.message || "Error al ingresar")
    setCargando(false)
  }
}

const iniciarSesionConGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
        redirectTo: `${window.location.origin}/callback` 
    }
    });

    if (error) {
      console.error("Error al entrar con Google:", error.message);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">
            Studio Manager
          </CardTitle>
          <CardDescription className="text-base">
            Bienvenida. Iniciá sesión en tu cuenta.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="grid gap-6">
          {/* Mensaje de error si se equivoca de clave */}
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md text-center">
              {error}
            </div>
          )}

          <Button variant="outline" type="button" onClick={iniciarSesionConGoogle} className="w-full font-normal flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continuar con Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">O continuá con email</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                className="bg-slate-50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link href="/recuperar" className="text-sm font-medium text-slate-600 hover:text-slate-900 hover:underline">
                  ¿Olvidaste tu clave?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="bg-slate-50 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <Button type="submit" className="w-full mt-2 text-base h-11" disabled={cargando}>
              {cargando ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Ingresando...</>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>
          
          <div className="text-center text-sm text-slate-600">
            ¿Aún no tenés cuenta?{" "}
            <Link href="/registro" className="font-semibold text-slate-900 hover:underline">
              Registrate acá
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}