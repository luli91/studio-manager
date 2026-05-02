"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { X, CalendarDays, Trash2, Edit2, Plus, Minus, Loader2, AlertTriangle, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

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
    nombre_completo: alumna.nombre_completo || "",
    telefono: alumna.telefono || "",
    contacto_urgencia: alumna.contacto_urgencia || "",
    direccion: alumna.direccion || ""
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

  // --- LÓGICA DE AJUSTE CON GENERACIÓN DE RECIBOS ---
  const handleAjustarClases = async (operacion: 'sumar' | 'restar') => {
    setProcesandoAjuste(true)
    
    try {
      // 1. Buscamos el saldo exacto actual
      const { data: dbPerfil } = await supabase.from("perfiles").select("creditos_clases").eq("id", alumna.id).single()
      const creditosActuales = Number(dbPerfil?.creditos_clases) || 0
      const cantidadDePack = Number(packSeleccionado)

      // 2. Calculamos los nuevos créditos
      const ajuste = operacion === 'sumar' ? cantidadDePack : -cantidadDePack
      const nuevosCreditos = creditosActuales + ajuste

      if (nuevosCreditos < 0) {
        toast.error("La alumna no puede quedar con clases en negativo.")
        setProcesandoAjuste(false)
        return
      }

      // 3. Guardamos el nuevo saldo de la alumna
      const { error: errorPerfil } = await supabase.from("perfiles").update({ creditos_clases: nuevosCreditos }).eq("id", alumna.id)
      if (errorPerfil) throw errorPerfil
      
      // 4. NUEVO: GENERAR RECIBO SI FLOR LE SUMÓ UN PACK
      if (operacion === 'sumar') {
        const montoTotal = cantidadDePack * 5000 // Simulamos precio ($5000 por clase)
        
        const { error: errorPago } = await supabase
          .from("pagos")
          .insert({
            perfil_id: alumna.id,
            monto: montoTotal,
            cantidad_clases: cantidadDePack,
            metodo_pago: 'efectivo'
          })
          
        if (errorPago) throw errorPago
      }

      // 5. Refrescamos la pantalla
      await refrescarCreditosEnVivo() 
      onUpdate() 
      
      toast.success(operacion === 'sumar' ? `¡Pack sumado y recibo generado!` : `Se restaron ${cantidadDePack} clases.`)
    } catch (error: any) {
      toast.error("Error al actualizar clases: " + error.message)
    } finally {
      setProcesandoAjuste(false)
    }
  }

  const handleGuardarDatos = async () => {
    setGuardando(true)
    try {
      const { error } = await supabase.from("perfiles").update(formData).eq("id", alumna.id)
      if (error) throw error
      
      toast.success("Datos de la alumna actualizados")
      setEditando(false)
      onUpdate()
    } catch (error: any) {
      toast.error("Error al guardar: " + error.message)
    } finally {
      setGuardando(false)
    }
  }

  const handleEliminarAlumna = async () => {
    const confirmacion = window.confirm(`CUIDADO: Estás por eliminar a ${alumna.nombre_completo} del directorio. Esto no se puede deshacer. ¿Continuar?`)
    if (!confirmacion) return

    try {
      const { error } = await supabase.from("perfiles").delete().eq("id", alumna.id)
      if (error) throw error

      toast.success("Alumna eliminada correctamente")
      onUpdate()
      onClose()
    } catch (error: any) {
      toast.error("Error al eliminar: " + error.message)
    }
  }

  const formatearFecha = (fechaString: string) => {
    if (!fechaString) return "Fecha no disponible"
    const [año, mes, dia] = fechaString.split('-')
    return `${dia}/${mes}/${año}`
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* HEADER */}
        <div className="bg-slate-900 p-5 flex justify-between items-start text-white shrink-0">
          <div>
            <h3 className="font-bold text-2xl">{formData.nombre_completo}</h3>
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium mt-2 inline-block">Alumna del Estudio</span>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-md transition-colors"><X className="h-6 w-6" /></button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8 flex-1 bg-slate-50">
          
          {/* SECCIÓN 1: GESTIÓN DE CLASES (BILLETERA CON PACKS) */}
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
                  <Button variant="outline" disabled={procesandoAjuste} onClick={() => handleAjustarClases('restar')} className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 shadow-sm transition-all active:scale-95">
                    <Minus className="h-4 w-4 mr-2" /> Restar
                  </Button>
                  <Button variant="outline" disabled={procesandoAjuste} onClick={() => handleAjustarClases('sumar')} className="flex-1 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 border-emerald-200 shadow-sm transition-all active:scale-95">
                    <Plus className="h-4 w-4 mr-2" /> Sumar
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            
            {/* SECCIÓN 2: FICHA PERSONAL */}
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
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-500">Nombre completo</Label>
                      <Input value={formData.nombre_completo} onChange={e => setFormData({...formData, nombre_completo: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Lock className="h-3 w-3"/> Email de la cuenta (No editable)</Label>
                      <Input value={alumna.email} disabled className="bg-slate-50 text-slate-500" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-500">Teléfono / WhatsApp</Label>
                      <Input value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-500">Contacto de Urgencia</Label>
                      <Input value={formData.contacto_urgencia} onChange={e => setFormData({...formData, contacto_urgencia: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-500">Dirección</Label>
                      <Input value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} />
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-slate-100 mt-4 pt-4">
                      <Button onClick={handleGuardarDatos} disabled={guardando} className="flex-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white">
                        {guardando ? "Guardando..." : "Guardar cambios"}
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
                      <p className="text-xs font-bold text-slate-400 uppercase">Teléfono / WhatsApp</p>
                      <p className="font-medium text-slate-900">{formData.telefono || "No especificado"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">En caso de emergencia</p>
                      <p className="font-medium text-slate-900">{formData.contacto_urgencia || "No especificado"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase">Dirección</p>
                      <p className="font-medium text-slate-900">{formData.direccion || "No especificada"}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECCIÓN 3: HISTORIAL DE CLASES */}
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
                    Esta alumna todavía no se anotó a ninguna clase.
                  </div>
                ) : (
                  <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
                    {historial.map((reserva) => (
                      <div key={reserva.id} className="p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-900">{reserva.clases?.nivel}</p>
                          <p className="text-xs text-slate-500">{formatearFecha(reserva.fecha_clase)} a las {reserva.clases?.horario.slice(0,5)}hs</p>
                        </div>
                        <span className="bg-fuchsia-100 text-fuchsia-700 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                          Anotada
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ZONA DE PELIGRO */}
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