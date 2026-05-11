import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Pencil, X, Save, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

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

export default function VistaPerfil({ perfil, alActualizar }: { perfil: any, alActualizar: () => void }) {
  const supabase = createClient()
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  
  const [formData, setFormData] = useState({
    nombre: "", apellido: "", telefono: "", contacto_urgencia: "", 
    calle: "", numero_calle: "", provincia: "", barrio_localidad: ""
  })

  useEffect(() => {
    if (perfil) {
      setFormData({
        nombre: perfil.nombre || "",
        apellido: perfil.apellido || "",
        telefono: perfil.telefono || "",
        contacto_urgencia: perfil.contacto_urgencia || "",
        calle: perfil.calle || "",
        numero_calle: perfil.numero_calle || "",
        provincia: perfil.provincia || "",
        barrio_localidad: perfil.barrio_localidad || ""
      })
    }
  }, [perfil])

  const handleGuardarCambios = async () => {
    setGuardando(true)
    try {
      const nombreArmado = `${formData.nombre} ${formData.apellido}`.trim()
      const direccionArmada = `${formData.calle} ${formData.numero_calle}, ${formData.barrio_localidad}, ${formData.provincia}`

      const { error } = await supabase.from("perfiles").update({
        ...formData,
        nombre_completo: nombreArmado,
        direccion: direccionArmada
      }).eq("id", perfil.id)

      if (error) throw new Error("No pudimos actualizar tus datos.")
      
      setEditando(false)
      toast.success("¡Datos actualizados con éxito!")
      alActualizar()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Card className="border-border shadow-sm animate-in fade-in bg-card">
      <CardHeader className="border-b border-border pb-4 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl text-foreground">Ficha personal</CardTitle>
          <CardDescription className="text-muted-foreground">Mantené tu información de contacto actualizada.</CardDescription>
        </div>
        {!editando && (
          <Button variant="outline" size="sm" onClick={() => setEditando(true)} className="text-foreground border-border hover:bg-accent">
            <Pencil className="h-4 w-4 mr-2" /> Editar datos
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        {!editando ? (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nombre completo</p>
                <p className="text-foreground font-medium bg-background px-3 py-2 rounded-md border border-border">
                  {perfil?.nombre} {perfil?.apellido}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email registrado</p>
                <p className="text-muted-foreground font-medium bg-muted/30 px-3 py-2 rounded-md border border-border">{perfil?.email} 🔒</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">WhatsApp Personal</p>
                <p className="text-foreground font-medium bg-background px-3 py-2 rounded-md border border-border">{perfil?.telefono}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tel. Emergencia</p>
                <p className="text-foreground font-medium bg-background px-3 py-2 rounded-md border border-border">{perfil?.contacto_urgencia}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Dirección</p>
              <p className="text-foreground font-medium bg-background px-3 py-2 rounded-md border border-border">
                {perfil?.calle} {perfil?.numero_calle}, {perfil?.barrio_localidad} ({perfil?.provincia})
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in slide-in-from-top-2">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nombre</Label>
                <Input value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} className="bg-background border-input focus-visible:ring-ring" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Apellido</Label>
                <Input value={formData.apellido} onChange={(e) => setFormData({...formData, apellido: e.target.value})} className="bg-background border-input focus-visible:ring-ring" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">WhatsApp Personal</Label>
                <Input value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})} className="bg-background border-input focus-visible:ring-ring" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tel. Emergencia</Label>
                <Input value={formData.contacto_urgencia} onChange={(e) => setFormData({...formData, contacto_urgencia: e.target.value})} className="bg-background border-input focus-visible:ring-ring" />
              </div>
            </div>

            <div className="p-4 bg-muted/30 border border-border rounded-lg space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Calle</Label>
                  <Input value={formData.calle} onChange={(e) => setFormData({...formData, calle: e.target.value})} className="bg-background border-input focus-visible:ring-ring" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Número</Label>
                  <Input value={formData.numero_calle} onChange={(e) => setFormData({...formData, numero_calle: e.target.value})} className="bg-background border-input focus-visible:ring-ring" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Provincia</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={formData.provincia} 
                    onChange={e => setFormData({...formData, provincia: e.target.value, barrio_localidad: ""})}
                  >
                    <option value="" disabled>Seleccioná...</option>
                    <option value="CABA">CABA</option>
                    <option value="GBA Norte">GBA Norte</option>
                    <option value="GBA Sur">GBA Sur</option>
                    <option value="GBA Oeste">GBA Oeste</option>
                    <option value="Otra Provincia">Otra Provincia</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Barrio / Localidad</Label>
                  {ZONAS[formData.provincia] ? (
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={formData.barrio_localidad}
                      onChange={e => setFormData({...formData, barrio_localidad: e.target.value})}
                    >
                      <option value="" disabled>Elegí tu zona...</option>
                      {ZONAS[formData.provincia].map(barrio => (
                        <option key={barrio} value={barrio}>{barrio}</option>
                      ))}
                    </select>
                  ) : (
                    <Input 
                      value={formData.barrio_localidad} 
                      onChange={(e) => setFormData({...formData, barrio_localidad: e.target.value})} 
                      placeholder={formData.provincia === "" ? "Elegí provincia" : "Tu localidad"} 
                      disabled={formData.provincia === ""}
                      className="bg-background border-input focus-visible:ring-ring"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-border mt-4">
              <Button onClick={handleGuardarCambios} disabled={guardando} className="bg-primary hover:bg-primary/90 text-primary-foreground flex-1">
                {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Guardar cambios
              </Button>
              <Button variant="outline" onClick={() => setEditando(false)} disabled={guardando} className="text-foreground border-border hover:bg-accent">
                <X className="mr-2 h-4 w-4" /> Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}