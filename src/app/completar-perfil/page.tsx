"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
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
  const [email, setEmail] = useState("")
  const [usuarioId, setUsuarioId] = useState("")
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

  // Apenas carga la página, le preguntamos a Google los datos que ya sabe
  useEffect(() => {
    const obtenerDatosGoogle = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUsuarioId(user.id)
        setEmail(user.email || "")
        // Google guarda el nombre en "user_metadata"
        if (user.user_metadata?.full_name) {
          setNombre(user.user_metadata.full_name)
        }
        setCargando(false)
      } else {
        router.push("/login") // Si no hay usuario, lo pateamos al login
      }
    }

    obtenerDatosGoogle()
  }, [router, supabase])

  const handleGuardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault()
    setGuardando(true)

    try {
      // Guardamos la ficha completa en nuestra base de datos
      const { error } = await supabase
        .from("perfiles")
        .insert([
          {
            id: usuarioId,
            email: email,
            nombre_completo: nombre,
            telefono: telefono,
            rol: "alumna" // ¡Siempre entran como alumnas por defecto!
          }
        ])

      if (error) throw new Error("No pudimos guardar tu perfil")

      toast.success("¡Perfil creado con éxito!")
      router.push("/dashboard") // ¡Y le abrimos la puerta al panel de alumna!

    } catch (error: any) {
      toast.error(error.message)
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
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">
            ¡Ya casi estamos!
          </CardTitle>
          <CardDescription className="text-base">
            Necesitamos un par de datos más para armar tu ficha en el estudio.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleGuardarPerfil} className="grid gap-4">
            
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre completo</Label>
              <Input
                id="nombre"
                type="text"
                required
                className="bg-slate-50"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Ana Pérez"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="telefono">Teléfono (Emergencias/WhatsApp)</Label>
              <Input
                id="telefono"
                type="tel"
                required
                className="bg-slate-50"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: 1123456789"
              />
            </div>

            <Button type="submit" className="w-full mt-2 text-base h-11" disabled={guardando}>
              {guardando ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
              ) : (
                "Finalizar registro"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}