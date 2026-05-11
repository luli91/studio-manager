"use client"

import { useState, useEffect } from "react"
import { Plus, Calendar, Loader2, Trash2, Users, AlertTriangle, Search, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import NuevaClaseForm from "@/components/admin/NuevaClaseForm"
import { createClient } from "@/lib/supabase"
import { toast } from "sonner"
import GestionarClaseModal from "@/components/admin/GestionarClaseModal"

export default function AdminClasesPage() {
  const supabase = createClient()
  const [mostrandoForm, setMostrandoForm] = useState(false)
  const [clases, setClases] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  
  const [filtro, setFiltro] = useState("")
  const [claseABorrar, setClaseABorrar] = useState<any | null>(null)
  const [borrando, setBorrando] = useState(false)
  const [claseAGestionar, setClaseAGestionar] = useState<any | null>(null)

  const cargarClases = async () => {
    setCargando(true)
    const { data, error } = await supabase
      .from("clases")
      .select(`
        *,
        reservas (id, estado)
      `)
      .gte("fecha", new Date().toISOString().split('T')[0])
      .order("fecha", { ascending: true })
      .order("horario", { ascending: true })

    if (data) {
      const clasesConReservasLimpias = data.map(clase => ({
        ...clase,
        reservas_confirmadas: clase.reservas?.filter((r: any) => r.estado === 'confirmada') || []
      }))
      setClases(clasesConReservasLimpias)
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
      let queryClases = supabase.from("clases").select("id")
      
      if (tipo === 'una' || !claseABorrar.grupo_id) {
        queryClases = queryClases.eq("id", claseABorrar.id)
      } else {
        queryClases = queryClases.eq("grupo_id", claseABorrar.grupo_id).gte("fecha", claseABorrar.fecha)
      }
      
      const { data: clasesAfectadas, error: errClases } = await queryClases
      if (errClases) throw errClases

      const clasesIds = clasesAfectadas.map(c => c.id)

      if (clasesIds.length > 0) {
        const { data: reservas, error: errRes } = await supabase
          .from("reservas")
          .select("id, perfil_id")
          .in("clase_id", clasesIds)
          .eq("estado", "confirmada")

        if (errRes) throw errRes

        if (reservas && reservas.length > 0) {
          for (const res of reservas) {
            const { data: perfil } = await supabase
              .from("perfiles")
              .select("creditos_clases")
              .eq("id", res.perfil_id)
              .single()

            await supabase
              .from("perfiles")
              .update({ creditos_clases: (perfil?.creditos_clases || 0) + 1 })
              .eq("id", res.perfil_id)
          }
          await supabase.from("reservas").delete().in("clase_id", clasesIds)
        }

        const { error: errBorrado } = await supabase.from("clases").delete().in("id", clasesIds)
        if (errBorrado) throw errBorrado
      }

      toast.success(tipo === 'una' ? "Clase eliminada" : "Serie eliminada")
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
        <div className="bg-muted border border-border text-foreground p-4 rounded-xl flex items-start gap-3 shadow-sm animate-in fade-in">
          <AlertTriangle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <div>
            <h4 className="font-bold">¡Atención Flor! Tu grilla se está por terminar.</h4>
            <p className="text-sm mt-1 text-muted-foreground">
              Las últimas clases programadas llegan hasta el <strong>{ultimaFecha}</strong>. 
              No te olvides de usar el botón "Nueva Clase" y repetir las semanas para generar los próximos meses.
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            Gestión de Clases
          </h1>
          <p className="text-muted-foreground mt-1">Armá la grilla semanal y creá eventos especiales.</p>
        </div>
        
        {!mostrandoForm && (
          <Button onClick={() => setMostrandoForm(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" /> Nueva Clase
          </Button>
        )}
      </div>

      {mostrandoForm && (
        <div className="max-w-xl mx-auto mb-8">
          <NuevaClaseForm onCertado={handleClaseCreada} />
        </div>
      )}

      {!mostrandoForm && !cargando && clases.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nombre, día o fecha..." 
            className="pl-10 bg-card border-border shadow-sm focus-visible:ring-ring"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </div>
      )}

      {!mostrandoForm && (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          {cargando ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : clases.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground border-dashed border-2 border-border m-4 rounded-xl">
              No hay clases programadas de hoy en adelante.
            </div>
          ) : clasesFiltradas.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No se encontraron clases para "{filtro}".
            </div>
          ) : (
            <div className="divide-y divide-border max-h-[70vh] overflow-y-auto">
              {clasesFiltradas.map((clase) => (
                <div key={clase.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-accent transition-colors">
                  
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg text-center min-w-[70px] ${clase.es_evento ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                      <p className="text-xs font-bold uppercase">{clase.dia_semana.slice(0,3)}</p>
                      <p className="text-lg font-black">{clase.horario.slice(0,5)}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        {clase.nivel}
                        {clase.es_evento && (
                          <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full uppercase tracking-wider">Evento</span>
                        )}
                        {clase.grupo_id && (
                          <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full uppercase tracking-wider">Repetida</span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground font-medium">
                        {formatearFecha(clase.fecha)} • {clase.costo_creditos === 0 ? `Precio: $${clase.precio}` : `Gasta ${clase.costo_creditos} clase${clase.costo_creditos !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 sm:mt-0 flex items-center gap-6">
                    <div className="text-right flex items-center gap-2 text-secondary-foreground bg-secondary px-3 py-1.5 rounded-md">
                      <Users className="h-4 w-4" />
                      <span className="text-sm font-bold">{clase.reservas_confirmadas?.length || 0} / {clase.cupo_maximo}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" title="Gestionar clase y alumnas" onClick={() => setClaseAGestionar(clase)} className="text-muted-foreground hover:text-foreground hover:bg-accent">
                        <Settings2 className="h-4 w-4" />
                      </Button>
                      
                      <Button variant="ghost" size="icon" onClick={() => setClaseABorrar(clase)} className="text-muted-foreground hover:text-foreground hover:bg-accent">
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

      {claseABorrar && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card rounded-2xl shadow-xl max-w-sm w-full overflow-hidden border border-border">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center mb-4">
                <Trash2 className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-xl text-foreground">¿Borrar clase?</h3>
              <p className="text-muted-foreground text-sm">
                Vas a borrar la clase de <strong>{claseABorrar.nivel}</strong> del {formatearFecha(claseABorrar.fecha)}.
              </p>

              {claseABorrar.reservas_confirmadas?.length > 0 && (
                <div className="bg-muted text-foreground p-3 rounded-lg text-xs text-left mt-2">
                  <AlertTriangle className="h-4 w-4 inline-block mr-1 mb-0.5 text-muted-foreground" />
                  <strong>Tiene {claseABorrar.reservas_confirmadas.length} reserva(s).</strong> El sistema las cancelará y devolverá las clases.
                </div>
              )}
              
              <div className="space-y-3 pt-4">
                {claseABorrar.grupo_id && (
                  <Button onClick={() => confirmarBorrado('serie')} disabled={borrando} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                    Borrar esta y las siguientes (Serie)
                  </Button>
                )}
                <Button onClick={() => confirmarBorrado('una')} disabled={borrando} variant={claseABorrar.grupo_id ? "outline" : "default"} className={!claseABorrar.grupo_id ? "w-full bg-primary hover:bg-primary/90 text-primary-foreground" : "w-full border-border text-foreground hover:bg-accent"}>
                  Borrar solo esta clase
                </Button>
                <Button onClick={() => setClaseABorrar(null)} disabled={borrando} variant="ghost" className="w-full text-muted-foreground hover:text-foreground">
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {claseAGestionar && (
        <GestionarClaseModal 
            clase={claseAGestionar} 
            onClose={() => setClaseAGestionar(null)} 
            onUpdate={cargarClases} 
        />
        )}
    </div>
  )
}