"use client"

import { useState, useEffect } from "react"
import { Plus, Calendar, Loader2, Trash2, Users, AlertTriangle, Search, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import NuevaClaseForm from "@/components/admin/NuevaClaseForm"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"

export default function AdminClasesPage() {
  const supabase = createClient()
  const [mostrandoForm, setMostrandoForm] = useState(false)
  const [clases, setClases] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  
  // NUEVO: Estado para el buscador
  const [filtro, setFiltro] = useState("")

  const [claseABorrar, setClaseABorrar] = useState<any | null>(null)
  const [borrando, setBorrando] = useState(false)

  const cargarClases = async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from("clases")
      .select("*")
      .gte("fecha", new Date().toISOString().split('T')[0])
      .order("fecha", { ascending: true })
      .order("horario", { ascending: true })

    if (data) {
      setClases(data)
    }
    setCargando(false)
  }

  useEffect(() => {
    cargarClases()
  }, [])

  const confirmarBorrado = async (tipo: 'una' | 'serie') => {
    if (!claseABorrar) return
    setBorrando(true)
    
    try {
      let query = supabase.from("clases").delete()
      
      if (tipo === 'una' || !claseABorrar.grupo_id) {
        query = query.eq("id", claseABorrar.id)
      } else {
        query = query.eq("grupo_id", claseABorrar.grupo_id).gte("fecha", claseABorrar.fecha)
      }

      const { error } = await query
      if (error) throw error

      toast.success(tipo === 'una' ? "Clase eliminada" : "Serie de clases eliminada")
      setClaseABorrar(null)
      cargarClases()
    } catch (error: any) {
      toast.error("Error al borrar: " + error.message)
    } finally {
      setBorrando(false)
    }
  }

  const handleClaseCreada = () => {
    setMostrandoForm(false)
    cargarClases()
  }

  const formatearFecha = (fechaString: string) => {
    const [año, mes, dia] = fechaString.split('-')
    return `${dia}/${mes}/${año}`
  }

  // Lógica del recordatorio de grilla vacía
  let alertaGrilla = false;
  let ultimaFecha = "";
  
  if (clases.length > 0) {
    const ultimaClase = clases[clases.length - 1];
    const fechaUltima = new Date(ultimaClase.fecha + "T00:00:00");
    const hoy = new Date();
    const diferenciaDias = (fechaUltima.getTime() - hoy.getTime()) / (1000 * 3600 * 24);
    
    if (diferenciaDias < 15) { 
      alertaGrilla = true;
    }
    ultimaFecha = formatearFecha(ultimaClase.fecha);
  }

  // NUEVO: Lógica de filtrado inteligente
  const clasesFiltradas = clases.filter(clase => {
    const busqueda = filtro.toLowerCase();
    const fechaFormateada = formatearFecha(clase.fecha);
    return (
      clase.nivel.toLowerCase().includes(busqueda) ||
      clase.dia_semana.toLowerCase().includes(busqueda) ||
      clase.horario.includes(busqueda) ||
      fechaFormateada.includes(busqueda)
    );
  });

  return (
    <div className="space-y-6">
      
      {!cargando && alertaGrilla && !mostrandoForm && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-3 shadow-sm animate-in fade-in">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-bold">¡Atención Flor! Tu grilla se está por terminar.</h4>
            <p className="text-sm mt-1">
              Las últimas clases programadas llegan hasta el <strong>{ultimaFecha}</strong>. 
              No te olvides de usar el botón "Nueva Clase" y repetir las semanas para generar los próximos meses.
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-fuchsia-600" />
            Gestión de Clases
          </h1>
          <p className="text-slate-500 mt-1">Armá la grilla semanal y creá eventos especiales.</p>
        </div>
        
        {!mostrandoForm && (
          <Button onClick={() => setMostrandoForm(true)} className="bg-fuchsia-600 hover:bg-fuchsia-700">
            <Plus className="mr-2 h-4 w-4" /> Nueva Clase
          </Button>
        )}
      </div>

      {mostrandoForm && (
        <div className="max-w-xl mx-auto mb-8">
          <NuevaClaseForm onCertado={handleClaseCreada} />
        </div>
      )}

      {/* NUEVO: BUSCADOR DE CLASES */}
      {!mostrandoForm && !cargando && clases.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input 
            placeholder="Buscar por nombre, día, horario o fecha..." 
            className="pl-10 bg-white border-slate-200 shadow-sm"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
      )}

      {!mostrandoForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {cargando ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-fuchsia-600" />
            </div>
          ) : clases.length === 0 ? (
            <div className="p-12 text-center text-slate-400 border-dashed border-2 border-slate-100 m-4 rounded-xl">
              No hay clases programadas de hoy en adelante.
            </div>
          ) : clasesFiltradas.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No se encontraron clases para "{filtro}".
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
              {clasesFiltradas.map((clase) => (
                <div key={clase.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-slate-50 transition-colors">
                  
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg text-center min-w-[70px] ${clase.es_evento ? 'bg-amber-100 text-amber-700' : 'bg-fuchsia-100 text-fuchsia-700'}`}>
                      <p className="text-xs font-bold uppercase">{clase.dia_semana.slice(0,3)}</p>
                      <p className="text-lg font-black">{clase.horario.slice(0,5)}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        {clase.nivel}
                        {clase.es_evento && (
                          <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Evento</span>
                        )}
                        {clase.grupo_id && (
                          <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Repetida</span>
                        )}
                      </h3>
                      <p className="text-sm text-slate-500 font-medium">
                        {formatearFecha(clase.fecha)} • {clase.costo_creditos === 0 ? `Precio: $${clase.precio}` : `Gasta ${clase.costo_creditos} crédito`}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-0 flex items-center gap-6">
                    <div className="text-right flex items-center gap-2 text-slate-600 bg-slate-100 px-3 py-1.5 rounded-md">
                      <Users className="h-4 w-4" />
                      <span className="text-sm font-bold">0 / {clase.cupo_maximo}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      {/* BOTÓN PREPARADO PARA GESTIONAR LA CLASE (Aún sin función) */}
                      <Button variant="ghost" size="icon" title="Gestionar clase y alumnas" className="text-slate-400 hover:text-fuchsia-600 hover:bg-fuchsia-50">
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      
                      <Button variant="ghost" size="icon" onClick={() => setClaseABorrar(clase)} className="text-slate-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Borrado Inteligente (Sin cambios) */}
      {claseABorrar && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full overflow-hidden">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-xl text-slate-900">¿Borrar clase?</h3>
              <p className="text-slate-500 text-sm">
                Vas a borrar la clase de <strong>{claseABorrar.nivel}</strong> del {formatearFecha(claseABorrar.fecha)}.
              </p>

              <div className="space-y-3 pt-4">
                {claseABorrar.grupo_id && (
                  <Button onClick={() => confirmarBorrado('serie')} disabled={borrando} className="w-full bg-red-600 hover:bg-red-700 text-white">
                    Borrar esta y las siguientes (Serie)
                  </Button>
                )}
                <Button onClick={() => confirmarBorrado('una')} disabled={borrando} variant={claseABorrar.grupo_id ? "outline" : "destructive"} className="w-full">
                  Borrar solo esta clase
                </Button>
                <Button onClick={() => setClaseABorrar(null)} disabled={borrando} variant="ghost" className="w-full text-slate-500">
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}