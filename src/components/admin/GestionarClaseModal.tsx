"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { X, UserPlus, Trash2, Loader2, Search, CheckCircle2, RotateCcw, Settings2, Save, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function GestionarClaseModal({ clase, onClose, onUpdate }: { clase: any, onClose: () => void, onUpdate: () => void }) {
  const supabase = createClient()
  const [cargando, setCargando] = useState(true)
  const [reservas, setReservas] = useState<any[]>([])
  const [alumnas, setAlumnas] = useState<any[]>([])
  const [profesoras, setProfesoras] = useState<any[]>([])
  
  // ESTADOS PARA LA EDICIÓN DE LA CLASE
  const [modoEdicion, setModoEdicion] = useState(false)
  const [datosClase, setDatosClase] = useState({
    nivel: clase.nivel,
    horario: clase.horario,
    cupo_maximo: clase.cupo_maximo,
    profesor_id: clase.profesor_id || ""
  })
  const [guardandoCambios, setGuardandoCambios] = useState(false)

  const [alumnaSeleccionada, setAlumnaSeleccionada] = useState("")
  const [descontarCredito, setDescontarCredito] = useState(true)
  const [agregando, setAgregando] = useState(false)
  const [busquedaAlumna, setBusquedaAlumna] = useState("")

  const [reservaAEliminar, setReservaAEliminar] = useState<any | null>(null)
  const [pasoEliminacion, setPasoEliminacion] = useState<1 | 2>(1)
  const [eliminando, setEliminando] = useState(false)

  const cargarDatos = async () => {
    setCargando(true)
    
    // Traemos reservas, alumnas y PROFESORAS
    const [resReservas, resAlumnas, resProfes] = await Promise.all([
      // ACÁ ESTÁ EL CAMBIO 1: Traemos SOLO las confirmadas para que no se vean las canceladas en la lista activa
      supabase.from("reservas").select("id, estado, fecha_clase, perfiles(id, nombre_completo, nombre, apellido, email)").eq("clase_id", clase.id).eq("estado", "confirmada"),
      supabase.from("perfiles").select("id, nombre_completo, email, creditos_clases").eq("rol", "alumna").order("nombre_completo"),
      supabase.from("perfiles").select("id, nombre_completo").eq("rol", "profe").order("nombre_completo")
    ])

    if (resReservas.data) setReservas(resReservas.data)
    if (resAlumnas.data) setAlumnas(resAlumnas.data)
    if (resProfes.data) setProfesoras(resProfes.data)
    
    setCargando(false)
  }

  useEffect(() => {
    cargarDatos()
  }, [clase.id])

  const handleGuardarCambiosClase = async () => {
    setGuardandoCambios(true)
    try {
      const { error } = await supabase
        .from("clases")
        .update(datosClase)
        .eq("id", clase.id)

      if (error) throw error
      
      toast.success("Clase actualizada correctamente")
      setModoEdicion(false)
      onUpdate() // Refresca la grilla de fondo
    } catch (error: any) {
      toast.error("Error al actualizar: " + error.message)
    } finally {
      setGuardandoCambios(false)
    }
  }

  const handleAgregarManual = async () => {
    if (!alumnaSeleccionada) return toast.error("Seleccioná una alumna")
    setAgregando(true)

    try {
      const { error: errorReserva } = await supabase
        .from("reservas")
        .insert([{ 
          perfil_id: alumnaSeleccionada, 
          clase_id: clase.id, 
          estado: "confirmada",
          fecha_clase: clase.fecha || new Date().toISOString().split('T')[0]
        }])

      if (errorReserva) throw errorReserva

      if (descontarCredito) {
        const alumna = alumnas.find(a => a.id === alumnaSeleccionada)
        if (alumna && alumna.creditos_clases > 0) {
          await supabase
            .from("perfiles")
            .update({ creditos_clases: alumna.creditos_clases - 1 })
            .eq("id", alumna.id)
        }
      }

      toast.success("Alumna agregada")
      setAlumnaSeleccionada("")
      setBusquedaAlumna("") 
      cargarDatos() 
      onUpdate() 
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setAgregando(false)
    }
  }

  const iniciarEliminacion = (reserva: any) => {
    setReservaAEliminar(reserva)
    setPasoEliminacion(1)
  }

  const confirmarEliminacion = async (devolverClase: boolean) => {
    if (!reservaAEliminar) return
    setEliminando(true)

    try {
      // ACÁ ESTÁ EL CAMBIO 2: Actualizamos a "cancelada" en vez de borrar
      const { error } = await supabase.from("reservas").update({ estado: 'cancelada' }).eq("id", reservaAEliminar.id)
      if (error) throw error

      if (devolverClase) {
        const perfilId = reservaAEliminar.perfiles.id
        const { data: perfilActual } = await supabase.from("perfiles").select("creditos_clases").eq("id", perfilId).single()
        await supabase.from("perfiles").update({ creditos_clases: (perfilActual?.creditos_clases || 0) + 1 }).eq("id", perfilId)
        toast.success("Clase devuelta y cupo liberado")
      } else {
        toast.success("Cupo liberado (sin devolución)")
      }

      cargarDatos()
      onUpdate()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setEliminando(false)
      setReservaAEliminar(null)
    }
  }

  const alumnasFiltradas = alumnas
    .filter(a => !reservas.some(r => r.perfiles?.id === a.id))
    .filter(a => a.nombre_completo?.toLowerCase().includes(busquedaAlumna.toLowerCase()))

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-in fade-in">
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          
          {/* HEADER HEADER */}
          <div className="bg-slate-900 p-5 flex justify-between items-center text-white shrink-0">
            <div>
              <h3 className="font-bold text-xl flex items-center gap-2">
                {modoEdicion ? "Editando clase" : `Gestionar: ${clase.nivel}`}
                {!modoEdicion && <span className="text-sm font-normal bg-white/20 px-2 py-0.5 rounded-full">{clase.horario.slice(0,5)} hs</span>}
              </h3>
              <p className="text-slate-300 text-sm mt-1">
                {modoEdicion ? "Cambiá los detalles de esta clase específica." : "Anotá alumnas o editá la configuración de la clase."}
              </p>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setModoEdicion(!modoEdicion)} 
                    className={`p-2 rounded-md transition-colors ${modoEdicion ? 'bg-fuchsia-600' : 'hover:bg-white/10'}`}
                    title="Editar configuración de clase"
                >
                    <Settings2 className="h-5 w-5" />
                </button>
                <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-md transition-colors"><X className="h-6 w-6" /></button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto space-y-6">
            {cargando ? (
              <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-fuchsia-600" /></div>
            ) : modoEdicion ? (
              /* --- VISTA DE EDICIÓN --- */
              <div className="space-y-4 animate-in slide-in-from-top-2">
                <div className="space-y-1">
                        <Label>Nombre / Nivel</Label>
                        <select 
                          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500"
                          value={datosClase.nivel} 
                          onChange={e => setDatosClase({...datosClase, nivel: e.target.value})}
                        >
                          <option value="" disabled>Seleccioná una disciplina</option>
                          <option value="Pole Sport">Pole Sport</option>
                          <option value="Pole Exotic">Pole Exotic</option>
                          <option value="Pole Basic">Pole Basic</option>
                          <option value="Pole Spin">Pole Spin</option>
                          <option value="Pole Mix">Pole Mix</option>
                          <option value="Funcional">Funcional</option>
                          <option value="Sensual Flow">Sensual Flow</option>
                          <option value="Flex">Flex</option>
                          <option value="Evento Especial">Evento Especial</option>
                        </select>
                    </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <Label>Cupo Máximo</Label>
                        <Input type="number" value={datosClase.cupo_maximo} onChange={e => setDatosClase({...datosClase, cupo_maximo: parseInt(e.target.value)})} />
                    </div>
                    <div className="space-y-1">
                        <Label>Profesora</Label>
                        <select 
                            className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-fuchsia-500 outline-none"
                            value={datosClase.profesor_id}
                            onChange={e => setDatosClase({...datosClase, profesor_id: e.target.value})}
                        >
                            <option value="">Sin profesora asignada</option>
                            {profesoras.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre_completo}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex gap-2 pt-4">
                    <Button onClick={handleGuardarCambiosClase} disabled={guardandoCambios} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                        {guardandoCambios ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Guardar cambios en esta clase
                    </Button>
                    <Button variant="ghost" onClick={() => setModoEdicion(false)} className="text-slate-500">Cancelar</Button>
                </div>
              </div>
            ) : (
              /* --- VISTA DE GESTIÓN (ALUMNAS) --- */
              <>
                <div className="bg-fuchsia-50 p-5 rounded-xl border border-fuchsia-100 space-y-4">
                  <h4 className="font-bold text-fuchsia-900 flex items-center gap-2">
                    <UserPlus className="h-5 w-5" /> Anotar alumna manualmente
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        placeholder="Buscar alumna..." 
                        className="pl-9 bg-white border-fuchsia-200"
                        value={busquedaAlumna}
                        onChange={(e) => setBusquedaAlumna(e.target.value)}
                      />
                    </div>

                    {alumnasFiltradas.length > 0 &&  (
                      <div className="max-h-36 overflow-y-auto bg-white border border-slate-200 rounded-lg divide-y divide-slate-100 shadow-inner">
                        {alumnasFiltradas.map(a => (
                          <div 
                            key={a.id}
                            onClick={() => setAlumnaSeleccionada(alumnaSeleccionada === a.id ? "" : a.id)}
                            className={`p-3 text-sm cursor-pointer transition-all flex justify-between items-center ${alumnaSeleccionada === a.id ? 'bg-fuchsia-100' : 'hover:bg-slate-50'}`}
                          >
                            <span className={alumnaSeleccionada === a.id ? 'font-bold text-fuchsia-900' : 'text-slate-700'}>{a.nombre_completo}</span>
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded-full">{a.creditos_clases} clases</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input type="checkbox" checked={descontarCredito} onChange={(e) => setDescontarCredito(e.target.checked)} className="rounded text-fuchsia-600" />
                      Descontarle 1 clase
                    </label>
                    <Button onClick={handleAgregarManual} disabled={agregando || !alumnaSeleccionada} className="bg-fuchsia-600">
                      {agregando ? "Anotando..." : "Anotar ahora"}
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-4 flex justify-between">
                    Lista de clase 
                    <span className="text-sm font-normal text-slate-500">{reservas.length} / {clase.cupo_maximo} alumnas</span>
                  </h4>
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl bg-white">
                    {reservas.length === 0 ? (
                       <div className="p-4 text-center text-slate-400 text-sm">Nadie anotado todavía.</div>
                    ) : (
                      reservas.map((reserva) => (
                        <div key={reserva.id} className="flex justify-between p-4 items-center">
                          <div>
                            <p className="font-bold text-slate-900">
                               {reserva.perfiles?.nombre ? `${reserva.perfiles.nombre} ${reserva.perfiles.apellido}` : reserva.perfiles?.nombre_completo}
                            </p>
                            <p className="text-xs text-slate-500">{reserva.perfiles?.email}</p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => iniciarEliminacion(reserva)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" /> Baja
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE ELIMINACIÓN */}
      {reservaAEliminar && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center space-y-4">
            {pasoEliminacion === 1 ? (
              <>
                <h3 className="font-bold text-xl">¿Quitar de la clase?</h3>
                <p className="text-slate-500 text-sm">Vas a liberar el cupo de <strong>{reservaAEliminar.perfiles?.nombre_completo}</strong>.</p>
                <Button onClick={() => setPasoEliminacion(2)} className="w-full bg-red-600">Continuar</Button>
                <Button onClick={() => setReservaAEliminar(null)} variant="ghost" className="w-full">Cancelar</Button>
              </>
            ) : (
              <>
                <h3 className="font-bold text-xl">¿Devolver clase?</h3>
                <p className="text-slate-500 text-sm">¿Querés que recupere la clase en su cuenta?</p>
                <Button onClick={() => confirmarEliminacion(true)} disabled={eliminando} className="w-full bg-fuchsia-600">Sí, devolver 1 clase</Button>
                <Button onClick={() => confirmarEliminacion(false)} disabled={eliminando} variant="outline" className="w-full">No, solo borrar</Button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}