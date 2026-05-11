import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  const [datosEdit, setDatosEdit] = useState({ 
    nombre: "", apellido: "", email: "", telefono: "", contacto_urgencia: "",
    calle: "", numero_calle: "", provincia: "", barrio_localidad: "" 
  })

  useEffect(() => {
    if (perfil) {
      setDatosEdit({
        nombre: perfil.nombre || "",
        apellido: perfil.apellido || "",
        email: perfil.email || "",
        telefono: perfil.telefono || "",
        contacto_urgencia: perfil.contacto_urgencia || "",
        calle: perfil.calle || "",
        numero_calle: perfil.numero_calle || "",
        provincia: perfil.provincia || "",
        barrio_localidad: perfil.barrio_localidad || ""
      })
    }
  }, [perfil])

  const handleUpdatePerfil = async () => {
    const nombreArmado = `${datosEdit.nombre} ${datosEdit.apellido}`.trim()
    const direccionArmada = `${datosEdit.calle} ${datosEdit.numero_calle}, ${datosEdit.barrio_localidad}, ${datosEdit.provincia}`

    const { error } = await supabase.from("perfiles").update({
      ...datosEdit,
      nombre_completo: nombreArmado,
      direccion: direccionArmada
    }).eq("id", perfil.id)

    if (error) return toast.error("Error al actualizar")
    toast.success("¡Perfil actualizado! ✨")
    alActualizar() 
  }

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-in fade-in pb-20">
      <header className="text-center">
        <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter italic">Mi Perfil</h1>
        <p className="text-muted-foreground font-medium">Actualizá tus datos personales.</p>
      </header>
      <div className="bg-card p-8 rounded-[3rem] border border-border shadow-sm space-y-6">
        <div className="grid grid-cols-1 gap-5">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-muted-foreground uppercase ml-4 tracking-widest">Nombre</label>
              <Input value={datosEdit.nombre} onChange={e => setDatosEdit({...datosEdit, nombre: e.target.value})} className="rounded-2xl h-12 bg-background border-input focus-visible:ring-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-muted-foreground uppercase ml-4 tracking-widest">Apellido</label>
              <Input value={datosEdit.apellido} onChange={e => setDatosEdit({...datosEdit, apellido: e.target.value})} className="rounded-2xl h-12 bg-background border-input focus-visible:ring-ring" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-muted-foreground uppercase ml-4 tracking-widest">WhatsApp</label>
            <Input value={datosEdit.telefono} onChange={e => setDatosEdit({...datosEdit, telefono: e.target.value})} className="rounded-2xl h-12 bg-background border-input focus-visible:ring-ring" />
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-muted-foreground uppercase ml-4 tracking-widest">Contacto Emergencia</label>
            <Input value={datosEdit.contacto_urgencia} onChange={e => setDatosEdit({...datosEdit, contacto_urgencia: e.target.value})} className="rounded-2xl h-12 bg-background border-input focus-visible:ring-ring" />
          </div>

          <div className="bg-muted/30 p-4 rounded-3xl border border-border space-y-4">
            <label className="text-[10px] font-black text-muted-foreground uppercase ml-2 tracking-widest">Dirección Completa</label>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Input value={datosEdit.calle} onChange={e => setDatosEdit({...datosEdit, calle: e.target.value})} placeholder="Calle" className="rounded-2xl h-12 bg-background border-input focus-visible:ring-ring" />
              </div>
              <div>
                <Input value={datosEdit.numero_calle} onChange={e => setDatosEdit({...datosEdit, numero_calle: e.target.value})} placeholder="N°" className="rounded-2xl h-12 bg-background border-input focus-visible:ring-ring" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select 
                className="flex h-12 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                value={datosEdit.provincia} 
                onChange={e => setDatosEdit({...datosEdit, provincia: e.target.value, barrio_localidad: ""})}
              >
                <option value="" disabled>Provincia...</option>
                <option value="CABA">CABA</option>
                <option value="GBA Norte">GBA Norte</option>
                <option value="GBA Sur">GBA Sur</option>
                <option value="GBA Oeste">GBA Oeste</option>
                <option value="Otra Provincia">Otra</option>
              </select>
              {ZONAS[datosEdit.provincia] ? (
                <select
                  className="flex h-12 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                  value={datosEdit.barrio_localidad}
                  onChange={e => setDatosEdit({...datosEdit, barrio_localidad: e.target.value})}
                >
                  <option value="" disabled>Zona...</option>
                  {ZONAS[datosEdit.provincia].map(barrio => (
                    <option key={barrio} value={barrio}>{barrio}</option>
                  ))}
                </select>
              ) : (
                <Input value={datosEdit.barrio_localidad} onChange={e => setDatosEdit({...datosEdit, barrio_localidad: e.target.value})} placeholder="Barrio" className="rounded-2xl h-12 bg-background border-input focus-visible:ring-ring" disabled={datosEdit.provincia === ""} />
              )}
            </div>
          </div>

        </div>
        
        <Button onClick={handleUpdatePerfil} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 rounded-2xl font-black uppercase shadow-lg active:scale-95 transition-all">
          <Save className="mr-2 h-5 w-5" /> Guardar Cambios
        </Button>
      </div>
    </div>
  )
}