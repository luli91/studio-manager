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

// Importamos nuestro puente a Supabase
import { createClient } from "@/lib/supabase"

export default function RegistroPage() {
  const router = useRouter()
  const supabase = createClient()

  // Estados para guardar los datos del formulario
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [urgencia, setUrgencia] = useState("")
  const [password, setPassword] = useState("")
  
  // Estados para la interfaz (ojito, errores y botón de carga)
  const [showPassword, setShowPassword] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState("")

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault() // Evita que la página se recargue
    setError("")
    setCargando(true)

    try {
      // 1. Creamos la cuenta en el sistema de Auth de Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw new Error(authError.message)
      
      if (authData.user) {
        // 2. Si se creó bien, guardamos sus datos extra en nuestra tabla 'perfiles'
        const { error: dbError } = await supabase.from("perfiles").insert({
          id: authData.user.id, // Conectamos el usuario con su perfil
          nombre_completo: nombre,
          telefono: telefono,
          contacto_urgencia: urgencia,
          rol: "alumna" // Por defecto todas son alumnas
        })

        if (dbError) throw new Error("Error al guardar los datos del perfil.")

        // 3. ¡Éxito! La mandamos al login
        toast.success("¡Cuenta creada! Ya podés iniciar sesión.")
        router.push("/login")
      }
    } catch (err: any) {
      console.error(err)
      if (err.message.includes("already registered")) {
        setError("Este email ya está registrado. Por favor, iniciá sesión.")
      } else {
        setError(err.message || "Ocurrió un error al registrarte.")
      }
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 py-10">
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">
            Crear Cuenta
          </CardTitle>
          <CardDescription className="text-base">
            Completá tus datos para sumarte al estudio.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="grid gap-6">
          
          {/* Mensaje de error si algo sale mal */}
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleRegistro} className="grid gap-4">
            
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre y Apellido</Label>
              <Input
                id="nombre"
                type="text"
                required
                className="bg-slate-50"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>

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
              <Label htmlFor="telefono">Teléfono (WhatsApp)</Label>
              <Input
                id="telefono"
                type="tel"
                required
                className="bg-slate-50"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="urgencia">Contacto de Urgencia (Nombre y Tel)</Label>
              <Input
                id="urgencia"
                type="text"
                required
                className="bg-slate-50 border-orange-200 focus-visible:ring-orange-500"
                value={urgencia}
                onChange={(e) => setUrgencia(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
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
            
            <Button type="submit" className="w-full mt-4 text-base h-11" disabled={cargando}>
              {cargando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando cuenta...
                </>
              ) : (
                "Registrarme"
              )}
            </Button>
          </form>
          
          <div className="text-center text-sm text-slate-600">
            ¿Ya tenés una cuenta?{" "}
            <Link href="/login" className="font-semibold text-slate-900 hover:underline">
              Iniciá sesión acá
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}