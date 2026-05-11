"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { X, CalendarDays, Trash2, Edit2, Plus, Minus, Loader2, AlertTriangle, Lock } from "lucide-react"
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

export default function PerfilAlumnaModal({ alumna, onClose, onUpdate }: { alumna: any, onClose: () => void, onUpdate: () => void }) {
  const supabase = createClient()
  
  const [historial, setHistorial] = useState<any[]>([])
  const [cargandoHistorial, setCargandoHistorial] = useState(true)
  
  const [creditos, setCreditos] = useState<number>(Number(alumna.creditos_clases) || 0)
  const [packSeleccionado, setPackSeleccionado] = useState<number>(4) 
  const [procesandoAjuste, setProcesandoAjuste] = useState(false)
  
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  
  const [formData, setFormData] = useState({
    nombre: alumna.nombre || "",
    apellido: alumna.apellido || "",
    telefono: alumna.telefono || "",
    contacto_urgencia: alumna.contacto_urgencia || "",
    calle: alumna.calle || "",
    numero_calle: alumna.numero_calle || "",
    provincia: alumna.provincia || "",
    barrio_localidad: alumna.barrio_localidad || ""
  })

  const refrescarCreditosEnVivo = async () => {
    const { data } = await supabase.from("perfiles").select("creditos_clases").eq("id", alumna.id).single()
    if (data) {
      setCreditos(Number(data.creditos_clases) || 0)
    }
  }

  useEffect(() => {
    const cargarHistorial = async () => {
      const { data, error } = await supabase
        .from("reservas")
        .select("id, estado, fecha_clase, clases(nivel, horario)")
        .eq("perfil_id", alumna.id)
        .eq("estado", "confirmada")
        .order("fecha_clase", { ascending: false })

      if (data) setHistorial(data)
      setCargandoHistorial(false)
    }
    
    cargarHistorial()
    refrescarCreditosEnVivo()
  }, [alumna.id, supabase])

  const handleAjustarClases = async (operacion: 'sumar' | 'restar') => {
  setProcesandoAjuste(true)
  try {
    const { data: dbPerfil } = await supabase.from("perfiles").select("creditos_clases").eq("id", alumna.id).single()
    const creditosActuales = Number(dbPerfil?.creditos_clases) || 0
    const cantidadDePack = Number(packSeleccionado)
    
    // DEFINIMOS LOS NUEVOS PRECIOS DE FLOR
    const PRECIOS: Record<number, number> = {
      1: 15000,
      4: 35000,
      8: 52000,
      12: 62000,
    }

    const ajuste = operacion === 'sumar' ? cantidadDePack : -cantidadDePack
    const nuevosCreditos = creditosActuales + ajuste

    if (nuevosCreditos < 0) {
      toast.error("La alumna no puede quedar con clases en negativo.")
      return
    }

    const { error: errorPerfil } = await supabase.from("perfiles").update({ creditos_clases: nuevosCreditos }).eq("id", alumna.id)
    if (errorPerfil) throw errorPerfil
    
    // CALCULAMOS EL MONTO REAL SEGÚN EL PACK
    const precioPack = PRECIOS[cantidadDePack] || 0
    const montoTotal = operacion === 'sumar' ? precioPack : -precioPack
    
    const { error: errorPago } = await supabase.from("pagos").insert({
      perfil_id: alumna.id,
      monto: montoTotal,
      cantidad_clases: ajuste,
      metodo_pago: 'efectivo'
    })
      
    if (errorPago) throw errorPago

    await refrescarCreditosEnVivo() 
    onUpdate() 
    toast.success(operacion === 'sumar' ? `¡Pack sumado y recibo generado!` : `Se restaron ${cantidadDePack} clases.`)
  } catch (error: any) {
    toast.error("Error: " + error.message)
  } finally {
    setProcesandoAjuste(false)
  }
}

  const handleGuardarDatos = async () => {
    setGuardando(true)
    try {
      const nombreArmado = `${formData.nombre} ${formData.apellido}`.trim()
      const direccionArmada = `${formData.calle} ${formData.numero_calle}, ${formData.barrio_localidad}, ${formData.provincia}`

      const { error } = await supabase.from("perfiles").update({
        ...formData,
        nombre_completo: nombreArmado,
        direccion: direccionArmada
      }).eq("id", alumna.id)

      if (error) throw error
      
      toast.success("Ficha de la alumna actualizada")
      setEditando(false)
      onUpdate()
    } catch (error: any) {
      toast.error("Error al guardar: " + error.message)
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminarAlumna = async () => {
    const confirmacion = window.confirm(`CUIDADO: Estás por eliminar a esta alumna. ¿Continuar?`)
    if (!confirmacion) return
    try {
      const { error } = await supabase.from("perfiles").delete().eq("id", alumna.id)
      if (error) throw error
      toast.success("Alumna eliminada")
      onUpdate()
      onClose()
    } catch (error: any) {
      toast.error("Error: " + error.message)
    }
  }

  const formatearFecha = (fechaString: string) => {
    if (!fechaString) return "No disponible"
    const [año, mes, dia] = fechaString.split('-')
    return `${dia}/${mes}/${año}`
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-card rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-border">
        
        <div className="bg-primary p-5 flex justify-between items-start text-primary-foreground shrink-0">
          <div>
            <h3 className="font-bold text-2xl">{formData.nombre} {formData.apellido}</h3>
            <span className="bg-background/20 px-3 py-1 rounded-full text-xs font-medium mt-2 inline-block">Alumna</span>
          </div>
          <button onClick={onClose} className="hover:bg-background/20 p-2 rounded-md transition-colors"><X className="h-6 w-6" /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8 flex-1 bg-muted/30">
          
          <div className="bg-card p-6 rounded-xl border border-border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Clases Disponibles</p>
                <div className="text-5xl font-black text-primary transition-all duration-300">{creditos}</div>
              </div>
            </div>
            
            <div className="bg-muted/50 p-4 rounded-xl border border-border w-full md:w-auto space-y-3">
              <Label className="text-xs font-bold text-muted-foreground uppercase">Ajustar saldo manualmente</Label>
              <div className="flex flex-col sm:flex-row gap-3">
                <select 
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground focus-visible:ring-ring outline-none min-w-[180px]"
                  value={packSeleccionado}
                  onChange={(e) => setPackSeleccionado(Number(e.target.value))}
                  disabled={procesandoAjuste}
                >
                  <option value={1}>1 clase suelta</option>
                  <option value={4}>Pack de 4 clases</option>
                  <option value={8}>Pack de 8 clases</option>
                  <option value={12}>Pack de 12 clases</option>
                </select>
                
                <div className="flex gap-2">
                  <Button variant="outline" disabled={procesandoAjuste} onClick={() => handleAjustarClases('restar')} className="flex-1 text-destructive hover:bg-destructive/10 border-destructive/20 shadow-sm"><Minus className="h-4 w-4 mr-2" /> Restar</Button>
                  <Button variant="outline" disabled={procesandoAjuste} onClick={() => handleAjustarClases('sumar')} className="flex-1 text-primary hover:bg-primary/10 border-primary/20 shadow-sm"><Plus className="h-4 w-4 mr-2" /> Sumar</Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-foreground text-lg">Ficha Personal</h4>
                {!editando && (
                  <Button variant="ghost" size="sm" onClick={() => setEditando(true)} className="text-primary hover:bg-primary/10">
                    <Edit2 className="h-4 w-4 mr-2" /> Editar
                  </Button>
                )}
              </div>

              <div className="bg-card p-5 rounded-xl border border-border shadow-sm space-y-4">
                {editando ? (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-muted-foreground">Nombre</Label>
                        <Input value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="bg-background border-input focus-visible:ring-ring" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-muted-foreground">Apellido</Label>
                        <Input value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value})} className="bg-background border-input focus-visible:ring-ring" />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1"><Lock className="h-3 w-3"/> Email (No editable)</Label>
                      <Input value={alumna.email} disabled className="bg-muted text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-muted-foreground">WhatsApp</Label>
                      <Input value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="bg-background border-input focus-visible:ring-ring" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-muted-foreground">Urgencia</Label>
                      <Input value={formData.contacto_urgencia} onChange={e => setFormData({...formData, contacto_urgencia: e.target.value})} className="bg-background border-input focus-visible:ring-ring" />
                    </div>
                    
                    <div className="bg-muted/50 p-3 rounded-lg border border-border space-y-3">
                      <Label className="text-xs font-bold text-muted-foreground uppercase">Dirección</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <Input value={formData.calle} onChange={e => setFormData({...formData, calle: e.target.value})} placeholder="Calle" className="bg-background border-input focus-visible:ring-ring" />
                        </div>
                        <div>
                          <Input value={formData.numero_calle} onChange={e => setFormData({...formData, numero_calle: e.target.value})} placeholder="N°" className="bg-background border-input focus-visible:ring-ring" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          value={formData.provincia} 
                          onChange={e => setFormData({...formData, provincia: e.target.value, barrio_localidad: ""})}
                        >
                          <option value="" disabled>Elegí...</option>
                          <option value="CABA">CABA</option>
                          <option value="GBA Norte">GBA Norte</option>
                          <option value="GBA Sur">GBA Sur</option>
                          <option value="GBA Oeste">GBA Oeste</option>
                          <option value="Otra Provincia">Otra</option>
                        </select>
                        {ZONAS[formData.provincia] ? (
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={formData.barrio_localidad}
                            onChange={e => setFormData({...formData, barrio_localidad: e.target.value})}
                          >
                            <option value="" disabled>Elegí zona...</option>
                            {ZONAS[formData.provincia].map(barrio => (
                              <option key={barrio} value={barrio}>{barrio}</option>
                            ))}
                          </select>
                        ) : (
                          <Input value={formData.barrio_localidad} onChange={e => setFormData({...formData, barrio_localidad: e.target.value})} placeholder="Barrio" className="bg-background border-input focus-visible:ring-ring" disabled={formData.provincia === ""} />
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-border mt-4">
                      <Button onClick={handleGuardarDatos} disabled={guardando} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground">
                        {guardando ? "Guardando..." : "Guardar"}
                      </Button>
                      <Button variant="outline" onClick={() => setEditando(false)} className="border-border text-foreground hover:bg-accent">Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Email registrado</p>
                      <p className="font-medium text-foreground">{alumna.email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">WhatsApp</p>
                      <p className="font-medium text-foreground">{formData.telefono || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Emergencia</p>
                      <p className="font-medium text-foreground">{formData.contacto_urgencia || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase">Dirección</p>
                      <p className="font-medium text-foreground">
                        {formData.calle} {formData.numero_calle}, {formData.barrio_localidad} ({formData.provincia})
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-foreground text-lg flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-muted-foreground" /> Historial de Reservas
              </h4>
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden h-[360px] flex flex-col">
                {cargandoHistorial ? (
                  <div className="flex-1 flex justify-center items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                ) : historial.length === 0 ? (
                  <div className="flex-1 flex flex-col justify-center items-center text-muted-foreground text-sm p-6 text-center gap-2">
                    <CalendarDays className="h-8 w-8 text-muted" />
                    Sin reservas activas.
                  </div>
                ) : (
                  <div className="overflow-y-auto divide-y divide-border flex-1">
                    {historial.map((reserva) => (
                      <div key={reserva.id} className="p-4 hover:bg-muted/50 transition-colors flex justify-between items-center">
                        <div>
                          <p className="font-bold text-foreground">{reserva.clases?.nivel}</p>
                          <p className="text-xs text-muted-foreground">{formatearFecha(reserva.fecha_clase)} a las {reserva.clases?.horario.slice(0,5)}hs</p>
                        </div>
                        <span className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border border-border">Anotada</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          <div className="pt-6 mt-4 border-t border-destructive/20">
            <div className="bg-destructive/10 p-4 rounded-xl border border-destructive/20 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3 text-destructive">
                <AlertTriangle className="h-6 w-6 shrink-0" />
                <p className="text-sm">Si borrás a esta alumna, perderá el acceso a la cuenta y se cancelarán todas sus reservas activas.</p>
              </div>
              <Button variant="destructive" onClick={handleEliminarAlumna} className="shrink-0 bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                <Trash2 className="h-4 w-4 mr-2" /> Eliminar Alumna
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}