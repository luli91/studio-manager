"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function CompletarPerfilPage() {
  const router = useRouter()
  const supabase = createClient()

  const [nombre, setNombre] = useState("")
  const [telefono, setTelefono] = useState("")
  const [contactoUrgencia, setContactoUrgencia] = useState("")
  const [direccion, setDireccion] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [usuarioId, setUsuarioId] = useState("")
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    const obtenerDatosGoogle = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUsuarioId(user.id)
        setEmail(user.email || "")
        if (user.user_metadata?.full_name) {
          setNombre(user.user_metadata.full_name)
        }
        setCargando(false)
      } else {
        router.push("/login")
      }
    }
    obtenerDatosGoogle()
  }, [router, supabase])

  const handleGuardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setGuardando(true)

    try {
      const { error: errorAuth } = await supabase.auth.updateUser({ password })
      if (errorAuth) throw new Error("Hubo un problema al crear tu contraseña de respaldo.")

      const { error: errorPerfil } = await supabase
        .from("perfiles")
        .insert([
          {
            id: usuarioId,
            email: email,
            nombre_completo: nombre,
            telefono: telefono,
            contacto_urgencia: contactoUrgencia,
            direccion: direccion,
            rol: "alumna",
            creditos_clases: 0 // Arranca con 0 clases
          }
        ])

      if (errorPerfil) throw new Error("No pudimos guardar tu perfil.")

      toast.success("¡Perfil completado con éxito!")
      router.push("/dashboard") 

    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-lg shadow-lg border-slate-200">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">¡Ya casi estamos!</CardTitle>
          <CardDescription>Completá los datos que le faltan a Google para armar tu ficha.</CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleGuardarPerfil} className="grid gap-4">
            
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre completo</Label>
              <Input id="nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
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
              <Label htmlFor="password">Crear contraseña de respaldo (obligatorio)</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} required minLength={6} className="pr-10" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full mt-2" disabled={guardando}>
              {guardando ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : "Finalizar registro"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}