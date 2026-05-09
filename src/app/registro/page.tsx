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

const ZONAS: Record<string, string[]> = {
  "CABA": ["Agronomía", "Almagro", "Balvanera", "Barracas", "Belgrano", "Boedo", "Caballito", "Chacarita", "Coghlan", "Colegiales", "Constitución", "Flores", "Floresta", "La Boca", "La Paternal", "Liniers", "Mataderos", "Monte Castro", "Monserrat", "Nueva Pompeya", "Núñez", "Palermo", "Parque Avellaneda", "Parque Chacabuco", "Parque Chas", "Parque Patricios", "Puerto Madero", "Recoleta", "Retiro", "Saavedra", "San Cristóbal", "San Nicolás", "San Telmo", "Vélez Sársfield", "Versalles", "Villa Crespo", "Villa del Parque", "Villa Devoto", "Villa General Mitre", "Villa Lugano", "Villa Luro", "Villa Ortúzar", "Villa Pueyrredón", "Villa Real", "Villa Riachuelo", "Villa Santa Rita", "Villa Soldati", "Villa Urquiza"],
  "GBA Norte": ["Escobar", "José C. Paz", "Malvinas Argentinas", "Pilar", "San Fernando", "San Isidro", "San Martín", "Tigre", "Vicente López"],
  "GBA Sur": ["Almirante Brown", "Avellaneda", "Berazategui", "Esteban Echeverría", "Ezeiza", "Florencio Varela", "Lanús", "Lomas de Zamora", "Quilmes"],
  "GBA Oeste": [
    "Hurlingham - Hurlingham", "Hurlingham - Villa Tesei", "Hurlingham - William Morris",
    "Ituzaingó - Ituzaingó", "Ituzaingó - Villa Udaondo",
    "La Matanza - Aldo Bonzi", "La Matanza - Casanova", "La Matanza - Catán", "La Matanza - Celina", "La Matanza - Ciudad Evita", "La Matanza - Gregorio de Laferrere", "La Matanza - La Tablada", "La Matanza - Lomas del Mirador", "La Matanza - Rafael Castillo", "La Matanza - Ramos Mejía", "La Matanza - San Justo", "La Matanza - Tapiales", "La Matanza - Virrey del Pino",
    "Merlo - Merlo", "Merlo - San Antonio de Padua", "Merlo - Libertad",
    "Moreno - Moreno", "Moreno - Paso del Rey",
    "Morón - Morón", "Morón - Castelar", "Morón - Haedo", "Morón - El Palomar", "Morón - Villa Sarmiento",
    "Tres de Febrero - Caseros", "Tres de Febrero - Ciudad Jardín", "Tres de Febrero - Ciudadela", "Tres de Febrero - Santos Lugares", "Tres de Febrero - Sáenz Peña", "Tres de Febrero - Villa Bosch"
  ]
};

export default function RegistroPage() {
  const router = useRouter()
  const supabase = createClient()

  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [email, setEmail] = useState("")
  const [telefono, setTelefono] = useState("")
  const [contactoUrgencia, setContactoUrgencia] = useState("")
  
  const [calle, setCalle] = useState("")
  const [numeroCalle, setNumeroCalle] = useState("")
  const [provincia, setProvincia] = useState("")
  const [barrioLocalidad, setBarrioLocalidad] = useState("")

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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw new Error(authError.message)
      if (!authData.user) throw new Error("No se pudo crear el usuario")

      const nombreArmado = `${nombre} ${apellido}`.trim()
      const direccionArmada = `${calle} ${numeroCalle}, ${barrioLocalidad}, ${provincia}`

      const { error: perfilError } = await supabase
        .from("perfiles")
        .insert([
          {
            id: authData.user.id,
            email: email,
            rol: "alumna",
            creditos_clases: 0,
            nombre: nombre,
            apellido: apellido,
            calle: calle,
            numero_calle: numeroCalle,
            provincia: provincia,
            barrio_localidad: barrioLocalidad,
            telefono: telefono,
            contacto_urgencia: contactoUrgencia,
            nombre_completo: nombreArmado,
            direccion: direccionArmada
          }
        ])

      if (perfilError) throw new Error("Error al guardar la ficha de la alumna")

      toast.success("¡Cuenta creada con éxito!")
      router.push("/alumna")

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
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Luján" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="apellido">Apellido</Label>
                <Input id="apellido" required value={apellido} onChange={(e) => setApellido(e.target.value)} placeholder="Ej: Díaz" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
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

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg space-y-4">
              <Label className="text-slate-600 font-bold uppercase text-xs">Dirección</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2 col-span-2">
                  <Label className="text-xs">Calle</Label>
                  <Input required value={calle} onChange={(e) => setCalle(e.target.value)} placeholder="Ej: Av. Cabildo" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">Número</Label>
                  <Input required value={numeroCalle} onChange={(e) => setNumeroCalle(e.target.value)} placeholder="Ej: 1500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-xs">Provincia / Región</Label>
                  <select 
                    required
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500"
                    value={provincia} 
                    onChange={e => {
                      setProvincia(e.target.value)
                      setBarrioLocalidad("")
                    }}
                  >
                    <option value="" disabled>Seleccioná...</option>
                    <option value="CABA">CABA</option>
                    <option value="GBA Norte">GBA Norte</option>
                    <option value="GBA Sur">GBA Sur</option>
                    <option value="GBA Oeste">GBA Oeste</option>
                    <option value="Otra Provincia">Otra Provincia</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs">Barrio / Localidad</Label>
                  {ZONAS[provincia] ? (
                    <select
                      required
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500"
                      value={barrioLocalidad}
                      onChange={e => setBarrioLocalidad(e.target.value)}
                    >
                      <option value="" disabled>Elegí tu zona...</option>
                      {ZONAS[provincia].map(barrio => (
                        <option key={barrio} value={barrio}>{barrio}</option>
                      ))}
                    </select>
                  ) : (
                    <Input 
                      required 
                      value={barrioLocalidad} 
                      onChange={(e) => setBarrioLocalidad(e.target.value)} 
                      placeholder={provincia === "" ? "Primero elegí provincia" : "Escribí tu localidad"} 
                      disabled={provincia === ""}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-2 pt-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} required minLength={6} className="pr-10" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full mt-4 bg-slate-900 hover:bg-slate-800" disabled={cargando}>
              {cargando ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando cuenta...</> : "Registrarme"}
            </Button>

            <div className="mt-2 text-center text-sm">
              ¿Ya tenés cuenta? <Link href="/login" className="text-fuchsia-600 hover:underline font-bold">Iniciá sesión</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}