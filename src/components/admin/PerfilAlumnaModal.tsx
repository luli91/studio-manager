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
      const ajuste = operacion === 'sumar' ? cantidadDePack : -cantidadDePack
      const nuevosCreditos = creditosActuales + ajuste

      if (nuevosCreditos < 0) {
        toast.error("La alumna no puede quedar con clases en negativo.")
        setProcesandoAjuste(false)
        return
      }

      const { error: errorPerfil } = await supabase.from("perfiles").update({ creditos_clases: nuevosCreditos }).eq("id", alumna.id)
      if (errorPerfil) throw errorPerfil
      
      const multiplicador = operacion === 'sumar' ? 1 : -1
      const montoTotal = (cantidadDePack * 5000) * multiplicador 
      
      const { error: errorPago } = await supabase.from("pagos").insert({
        perfil_id: alumna.id,
        monto: montoTotal,
        cantidad_clases: cantidadDePack * multiplicador,
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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        <div className="bg-slate-900 p-5 flex justify-between items-start text-white shrink-0">
          <div>
            <h3 className="font-bold text-2xl">{formData.nombre} {formData.apellido}</h3>
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium mt-2 inline-block">Alumna</span>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-md"><X className="h-6 w-6" /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8 flex-1 bg-slate-50">
          
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Clases Disponibles</p>
                <div className="text-5xl font-black text-fuchsia-600 transition-all duration-300">{creditos}</div>
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 w-full md:w-auto space-y-3">
              <Label className="text-xs font-bold text-slate-500 uppercase">Ajustar saldo manualmente</Label>
              <div className="flex flex-col sm:flex-row gap-3">
                <select 
                  className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 min-w-[180px]"
                  value={packSeleccionado}
                  onChange={(e) => setPackSeleccionado(Number(e.target.value))}
                  disabled={procesandoAjuste}
                >
                  <option value={1}>1 clase suelta</option>
                  <option value={4}>Pack de 4 clases</option>
                  <option value={8}>Pack de 8 clases</option>
                  <option value={12}>Pack de 12 clases</option>
                  <option value={20}>Pack libre (20)</option>
                </select>
                
                <div className="flex gap-2">
                  <Button variant="outline" disabled={procesandoAjuste} onClick={() => handleAjustarClases('restar')} className="flex-1 text-red-600 hover:bg-red-50 border-red-200 shadow-sm"><Minus className="h-4 w-4 mr-2" /> Restar</Button>
                  <Button variant="outline" disabled={procesandoAjuste} onClick={() => handleAjustarClases('sumar')} className="flex-1 text-emerald-600 hover:bg-emerald-50 border-emerald-200 shadow-sm"><Plus className="h-4 w-4 mr-2" /> Sumar</Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-900 text-lg">Ficha Personal</h4>
                {!editando && (
                  <Button variant="ghost" size="sm" onClick={() => setEditando(true)} className="text-fuchsia-600 hover:bg-fuchsia-50">
                    <Edit2 className="h-4 w-4 mr-2" /> Editar
                  </Button>
                )}
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                {editando ? (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-500">Nombre</Label>
                        <Input value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-bold text-slate-500">Apellido</Label>
                        <Input value={formData.apellido} onChange={e => setFormData({...formData, apellido: e.target.value})} />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Lock className="h-3 w-3"/> Email (No editable)</Label>
                      <Input value={alumna.email} disabled className="bg-slate-50 text-slate-500" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-500">WhatsApp</Label>
                      <Input value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-500">Urgencia</Label>
                      <Input value={formData.contacto_urgencia} onChange={e => setFormData({...formData, contacto_urgencia: e.target.value})} />
                    </div>
                    
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-3">
                      <Label className="text-xs font-bold text-slate-500 uppercase">Dirección</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <Input value={formData.calle} onChange={e => setFormData({...formData, calle: e.target.value})} placeholder="Calle" />
                        </div>
                        <div>
                          <Input value={formData.numero_calle} onChange={e => setFormData({...formData, numero_calle: e.target.value})} placeholder="N°" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <select 
                          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
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
                            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                            value={formData.barrio_localidad}
                            onChange={e => setFormData({...formData, barrio_localidad: e.target.value})}
                          >
                            <option value="" disabled>Elegí zona...</option>
                            {ZONAS[formData.provincia].map(barrio => (
                              <option key={barrio} value={barrio}>{barrio}</option>
                            ))}
                          </select>
                        ) : (
                          <Input value={formData.barrio_localidad} onChange={e => setFormData({...formData, barrio_localidad: e.target.value})} placeholder="Barrio" className="bg-white" disabled={formData.provincia === ""} />
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-slate-100 mt-4 pt-4">
                      <Button onClick={handleGuardarDatos} disabled={guardando} className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white">
                        {guardando ? "Guardando..." : "Guardar"}
                      </Button>
                      <Button variant="outline" onClick={() => setEditando(false)}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Email registrado</p>
                      <p className="font-medium text-slate-900">{alumna.email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">WhatsApp</p>
                      <p className="font-medium text-slate-900">{formData.telefono || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Emergencia</p>
                      <p className="font-medium text-slate-900">{formData.contacto_urgencia || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Dirección</p>
                      <p className="font-medium text-slate-900">
                        {formData.calle} {formData.numero_calle}, {formData.barrio_localidad} ({formData.provincia})
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-slate-400" /> Historial de Reservas
              </h4>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-[360px] flex flex-col">
                {cargandoHistorial ? (
                  <div className="flex-1 flex justify-center items-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
                ) : historial.length === 0 ? (
                  <div className="flex-1 flex flex-col justify-center items-center text-slate-400 text-sm p-6 text-center gap-2">
                    <CalendarDays className="h-8 w-8 text-slate-200" />
                    Sin reservas aún.
                  </div>
                ) : (
                  <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
                    {historial.map((reserva) => (
                      <div key={reserva.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-900">{reserva.clases?.nivel}</p>
                          <p className="text-xs text-slate-500">{formatearFecha(reserva.fecha_clase)} a las {reserva.clases?.horario.slice(0,5)}hs</p>
                        </div>
                        <span className="bg-fuchsia-100 text-fuchsia-700 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">Anotada</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          <div className="pt-6 mt-4 border-t border-red-100">
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3 text-red-800">
                <AlertTriangle className="h-6 w-6 shrink-0" />
                <p className="text-sm">Si borrás a esta alumna, perderá el acceso a la cuenta y se cancelarán todas sus reservas activas.</p>
              </div>
              <Button variant="destructive" onClick={handleEliminarAlumna} className="shrink-0 bg-red-600 hover:bg-red-700">
                <Trash2 className="h-4 w-4 mr-2" /> Eliminar Alumna
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}