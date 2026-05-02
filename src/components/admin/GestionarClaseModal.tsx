"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import { X, UserPlus, Trash2, Loader2, Search, CheckCircle2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export default function GestionarClaseModal({ clase, onClose, onUpdate }: { clase: any, onClose: () => void, onUpdate: () => void }) {
  const supabase = createClient()
  const [cargando, setCargando] = useState(true)
  const [reservas, setReservas] = useState<any[]>([])
  const [alumnas, setAlumnas] = useState<any[]>([])
  
  const [alumnaSeleccionada, setAlumnaSeleccionada] = useState("")
  const [descontarCredito, setDescontarCredito] = useState(true)
  const [agregando, setAgregando] = useState(false)
  const [busquedaAlumna, setBusquedaAlumna] = useState("")

  // NUEVOS ESTADOS PARA EL MODAL LINDO DE BORRADO
  const [reservaAEliminar, setReservaAEliminar] = useState<any | null>(null)
  const [pasoEliminacion, setPasoEliminacion] = useState<1 | 2>(1)
  const [eliminando, setEliminando] = useState(false)

  const cargarDatos = async () => {
    setCargando(true)
    
    const { data: dataReservas } = await supabase
      .from("reservas")
      .select("id, estado, fecha_clase, perfiles(id, nombre_completo, email)")
      .eq("clase_id", clase.id)

    if (dataReservas) setReservas(dataReservas)

    const { data: dataAlumnas } = await supabase
      .from("perfiles")
      .select("id, nombre_completo, email, creditos_clases")
      .eq("rol", "alumna")
      .order("nombre_completo")

    if (dataAlumnas) setAlumnas(dataAlumnas)
    
    setCargando(false)
  }

  useEffect(() => {
    cargarDatos()
  }, [clase.id])

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
          fecha_clase: clase.fecha 
        }])
        .select()

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

      toast.success("Alumna agregada a la clase")
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

  // LÓGICA DE ELIMINACIÓN DIVIDIDA EN DOS PASOS
  const iniciarEliminacion = (reserva: any) => {
    setReservaAEliminar(reserva)
    setPasoEliminacion(1) // Empezamos preguntando si la quiere borrar
  }

  const confirmarEliminacion = async (devolverClase: boolean) => {
    if (!reservaAEliminar) return
    setEliminando(true)

    try {
      // 1. Borramos
      const { error } = await supabase.from("reservas").delete().eq("id", reservaAEliminar.id)
      if (error) throw error

      // 2. Devolvemos la clase (si Flor dijo que sí)
      if (devolverClase) {
        const perfilId = reservaAEliminar.perfiles.id
        const { data: perfilActual } = await supabase.from("perfiles").select("creditos_clases").eq("id", perfilId).single()
        
        await supabase
          .from("perfiles")
          .update({ creditos_clases: (perfilActual?.creditos_clases || 0) + 1 })
          .eq("id", perfilId)
        
        toast.success(`Clase devuelta a ${reservaAEliminar.perfiles.nombre_completo}`)
      } else {
        toast.success("Baja confirmada (sin devolver la clase)")
      }

      cargarDatos()
      onUpdate()
    } catch (error: any) {
      toast.error("Error al eliminar: " + error.message)
    } finally {
      setEliminando(false)
      setReservaAEliminar(null) // Cerramos el minimodal
    }
  }

  const alumnasDisponibles = alumnas.filter(a => !reservas.some(r => r.perfiles?.id === a.id))
  const alumnasFiltradas = alumnasDisponibles.filter(a => 
    a.nombre_completo?.toLowerCase().includes(busquedaAlumna.toLowerCase()) || 
    a.email?.toLowerCase().includes(busquedaAlumna.toLowerCase())
  )

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-in fade-in">
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          
          <div className="bg-slate-900 p-5 flex justify-between items-center text-white shrink-0">
            <div>
              <h3 className="font-bold text-xl flex items-center gap-2">
                Gestionar: {clase.nivel} 
                <span className="text-sm font-normal bg-white/20 px-2 py-0.5 rounded-full">{clase.horario.slice(0,5)} hs</span>
              </h3>
              <p className="text-slate-300 text-sm mt-1">Acá podés anotar alumnas a mano o liberar cupos.</p>
            </div>
            <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-md transition-colors"><X className="h-6 w-6" /></button>
          </div>

          <div className="p-6 overflow-y-auto space-y-8">
            {cargando ? (
              <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-fuchsia-600" /></div>
            ) : (
              <>
                <div className="bg-fuchsia-50 p-5 rounded-xl border border-fuchsia-100 space-y-4">
                  <h4 className="font-bold text-fuchsia-900 flex items-center gap-2">
                    <UserPlus className="h-5 w-5" /> Anotar alumna manualmente
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        placeholder="Buscar alumna por nombre..." 
                        className="pl-9 bg-white border-fuchsia-200 focus-visible:ring-fuchsia-500"
                        value={busquedaAlumna}
                        onChange={(e) => {
                          setBusquedaAlumna(e.target.value);
                          if (alumnaSeleccionada) setAlumnaSeleccionada("");
                        }}
                      />
                    </div>

                    {alumnasFiltradas.length > 0 ? (
                      <div className="max-h-36 overflow-y-auto bg-white border border-slate-200 rounded-lg divide-y divide-slate-100 shadow-inner">
                        {alumnasFiltradas.map(a => (
                          <div 
                            key={a.id}
                            onClick={() => setAlumnaSeleccionada(alumnaSeleccionada === a.id ? "" : a.id)}
                            className={`p-3 text-sm cursor-pointer transition-all flex justify-between items-center border-l-4 ${alumnaSeleccionada === a.id ? 'bg-fuchsia-100 border-fuchsia-600' : 'hover:bg-slate-50 border-transparent'}`}
                          >
                            <div className="flex items-center gap-2">
                              {alumnaSeleccionada === a.id ? <CheckCircle2 className="h-4 w-4 text-fuchsia-600" /> : <div className="h-4 w-4 rounded-full border border-slate-300" />}
                              <span className={alumnaSeleccionada === a.id ? 'font-bold text-fuchsia-900' : 'text-slate-700'}>
                                {a.nombre_completo}
                              </span>
                            </div>
                            <span className="text-xs font-medium bg-slate-100 px-2 py-1 rounded-full text-slate-600">
                              {/* CAMBIO DE PALABRA AQUÍ */}
                              {a.creditos_clases} clases
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-3 text-sm text-slate-500 bg-white border border-slate-200 rounded-lg">
                        No hay alumnas disponibles con ese nombre (o ya están en la clase).
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="rounded border-slate-300 text-fuchsia-600 focus:ring-fuchsia-600"
                        checked={descontarCredito}
                        onChange={(e) => setDescontarCredito(e.target.checked)}
                      />
                      {/* CAMBIO DE PALABRA AQUÍ */}
                      Descontarle 1 clase de su cuenta
                    </label>
                    
                    <Button onClick={handleAgregarManual} disabled={agregando || !alumnaSeleccionada} className="bg-fuchsia-600 hover:bg-fuchsia-700 w-full sm:w-auto">
                      {agregando ? "Anotando..." : "Anotar a la clase"}
                    </Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-4 flex justify-between">
                    Alumnas anotadas 
                    <span className="text-sm font-normal text-slate-500">Cupo: {reservas.length} / {clase.cupo_maximo}</span>
                  </h4>
                  
                  {reservas.length === 0 ? (
                    <div className="text-center p-8 border-2 border-dashed border-slate-100 rounded-xl text-slate-400 bg-white">
                      Todavía no hay nadie anotada en esta clase. ¡Buscá una alumna arriba para sumar a la primera!
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden bg-white">
                      {reservas.map((reserva) => (
                        <div key={reserva.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-slate-50 gap-3">
                          <div>
                            <p className="font-bold text-slate-900">{reserva.perfiles?.nombre_completo}</p>
                            <p className="text-xs text-slate-500">{reserva.perfiles?.email}</p>
                          </div>
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => iniciarEliminacion(reserva)}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700 w-full sm:w-auto"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Dar de baja
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MINI-MODAL DE CONFIRMACIÓN DE BORRADO (Reemplaza el window.confirm) */}
      {reservaAEliminar && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden p-6 text-center space-y-4">
            
            {pasoEliminacion === 1 ? (
              <>
                <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                  <Trash2 className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-xl text-slate-900">¿Dar de baja?</h3>
                <p className="text-slate-500 text-sm">
                  Estás por sacar a <strong>{reservaAEliminar.perfiles?.nombre_completo}</strong> del cupo de la clase.
                </p>
                <div className="space-y-3 pt-4">
                  <Button onClick={() => setPasoEliminacion(2)} className="w-full bg-red-600 hover:bg-red-700 text-white">
                    Sí, dar de baja
                  </Button>
                  <Button onClick={() => setReservaAEliminar(null)} variant="ghost" className="w-full text-slate-500">
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="mx-auto w-12 h-12 bg-fuchsia-100 text-fuchsia-600 rounded-full flex items-center justify-center mb-4">
                  <RotateCcw className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-xl text-slate-900">¿Devolver la clase?</h3>
                <p className="text-slate-500 text-sm">
                  La alumna ya fue separada del cupo. ¿Querés devolverle <strong>1 clase</strong> a su cuenta?
                </p>
                <div className="space-y-3 pt-4">
                  <Button onClick={() => confirmarEliminacion(true)} disabled={eliminando} className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white">
                    {eliminando ? "Procesando..." : "Sí, devolver 1 clase"}
                  </Button>
                  <Button onClick={() => confirmarEliminacion(false)} disabled={eliminando} variant="outline" className="w-full text-slate-500 border-slate-200">
                    No, borrar sin devolver nada
                  </Button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </>
  )
}