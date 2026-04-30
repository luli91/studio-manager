"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function RegistroPage() {
  const router = useRouter()
  const supabase = createClient()

  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [contactoUrgencia, setContactoUrgencia] = useState("")
  const [direccion, setDireccion] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [cargando, setCargando] = useState(false)

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setCargando(true)

    try {
      // 1. Creamos el usuario en Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw new Error(authError.message)
      if (!authData.user) throw new Error("No se pudo crear el usuario")

      // 2. Guardamos TODOS los datos en tu tabla perfiles
      const { error: perfilError } = await supabase
        .from("perfiles")
        .insert([
          {
            id: authData.user.id,
            email: email,
            nombre_completo: nombre,
            telefono: telefono,
            contacto_urgencia: contactoUrgencia,
            direccion: direccion,
            rol: "alumna",
            creditos_clases: 0 // Arranca con 0 clases
          }
        ])

      if (perfilError) throw new Error("Error al guardar la ficha de la alumna")

      toast.success("¡Cuenta creada con éxito!")
      router.push("/dashboard")

    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-lg shadow-lg border-slate-200">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">Crear cuenta</CardTitle>
          <CardDescription>Completá tu ficha para unirte al estudio.</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleRegistro} className="grid gap-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre completo</Label>
                <Input id="nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="telefono">Celular (WhatsApp)</Label>
                <Input id="telefono" required value={telefono} onChange={(e) => setTelefono(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="urgencia">Tel. Emergencia</Label>
                <Input id="urgencia" required value={contactoUrgencia} onChange={(e) => setContactoUrgencia(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="direccion">Dirección completa</Label>
              <Input id="direccion" required value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Ej: Calle Falsa 123, Ciudad" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} required minLength={6} className="pr-10" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full mt-2" disabled={cargando}>
              {cargando ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando cuenta...</> : "Registrarme"}
            </Button>

            <div className="mt-4 text-center text-sm">
              ¿Ya tenés cuenta? <Link href="/login" className="text-fuchsia-600 hover:underline">Iniciá sesión</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}